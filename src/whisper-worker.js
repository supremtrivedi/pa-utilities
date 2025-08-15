import { pipeline, env } from '@xenova/transformers';

env.allowLocalModels = true;

class MyTranscriptionPipeline {
  static task = 'automatic-speech-recognition';
  static model = 'Xenova/whisper-tiny.en';
  static instance = null;

  static async getInstance(model, progress_callback = null) {
    if (this.instance === null || this.model !== model) {
      this.model = model;
      console.log('[WORKER] Loading model:', model);
      this.instance = pipeline(this.task, this.model, { progress_callback });
      console.log('[WORKER] Model pipeline created');
    }
    return this.instance;
  }
}

console.log('[WORKER] LOADED');

self.addEventListener('message', async (event) => {
  console.log('[WORKER] RECEIVED MESSAGE', event.data);

  try {
    const { url, audio, model, language, subtask } = event.data;

    console.log('[WORKER] Getting transcriber instance...');
    const transcriber = await MyTranscriptionPipeline.getInstance(model, (progressData) => {
      // You may see progress messages in main thread
      self.postMessage(progressData);
    });
    console.log('[WORKER] Transcriber instance obtained:', transcriber);

    // Utility function to decode tokens (streaming, might not be used)
    function decodeTextFromTokens(tokens, tokenizer) {
      return tokenizer.decode(tokens, { skip_special_tokens: true });
    }

    // Streaming callback for transformers.js
    const callback_function = (items) => {
      try {
        console.log('[WORKER] Streaming update:', items);
        const lastText = decodeTextFromTokens(items[0].output_token_ids, transcriber.tokenizer);
        self.postMessage({ status: 'update', output: { text: lastText } });
      } catch (streamError) {
        console.error('[WORKER] Error in streaming callback:', streamError);
      }
    };

    let result = null;
    if (url) {
      console.log('[WORKER] Starting transcription from URL', url);
      result = await transcriber(url, {
        task: subtask,
        language: language === 'english' ? 'english' : language,
        return_timestamps: true,
        chunk_length_s: 30,
        stride_length_s: 5,
        callback_function,
      });
      console.log('[WORKER] URL transcription finished');
    } else if (audio) {
      console.log('[WORKER] Starting transcription from audio');
      result = await transcriber(audio, {
        task: subtask,
        language: language === 'english' ? 'english' : language,
        return_timestamps: true,
        chunk_length_s: 30,
        stride_length_s: 5,
        callback_function,
      });
      console.log('[WORKER] Audio transcription finished');
    } else {
      throw new Error('No input URL or audio received.');
    }

    // Patch: Ensure result.text is present if only chunks exist
    if (result && result.chunks && !result.text) {
      console.log('[WORKER] Patching .text into result from chunks');
      result.text = result.chunks.map(c => c.text).join('');
    }
    console.log('[WORKER] Final transcription result:', result);

    self.postMessage({
      status: 'complete',
      output: result
    });

  } catch (error) {
    console.error('[WORKER] ERROR:', error);
    self.postMessage({
      status: 'error',
      error: error.message || String(error)
    });
  }
});
