import { pipeline, env } from '@xenova/transformers';

// Configure environment
env.allowLocalModels = false;

class MyTranscriptionPipeline {
  static task = 'automatic-speech-recognition';
  static model = 'Xenova/whisper-tiny';
  static instance = null;

  static async getInstance(model, progress_callback = null) {
    if (this.instance === null || this.model !== model) {
      this.model = model;
      this.instance = pipeline(this.task, this.model, { progress_callback });
    }
    return this.instance;
  }
}

// Listen for messages from the UI
self.addEventListener('message', async (event) => {
  const { url, audio, model, language, subtask } = event.data;
  
  console.log('Worker received message:', event.data); // Debug log
  
  try {
    // Get the transcription pipeline
    const transcriber = await MyTranscriptionPipeline.getInstance(model, (x) => {
      // Send progress updates
      self.postMessage(x);
    });

    let output;
    
    if (url) {
      console.log('Processing URL:', url);
      output = await transcriber(url, {
        task: subtask,
        language: language === 'english' ? 'english' : language,
        return_timestamps: true,
        chunk_length_s: 30,
        stride_length_s: 5,
      });
    } else if (audio) {
      console.log('Processing audio blob:', audio);
      
      // Process audio blob directly
      output = await transcriber(audio, {
        task: subtask,
        language: language === 'english' ? 'english' : language,
        return_timestamps: true,
        chunk_length_s: 30,
        stride_length_s: 5,
      });
    }

    console.log('Transcription output:', output); // Debug log

    // Send the output back to the main thread
    self.postMessage({
      status: 'complete',
      output: output,
    });

  } catch (error) {
    console.error('Worker error:', error);
    self.postMessage({
      status: 'error',
      error: error.message,
    });
  }
});
