import { pipeline } from '@xenova/transformers';

class WhisperPipeline {
  static task = 'automatic-speech-recognition';
  static model = 'Xenova/whisper-tiny.en';
  static instance = null;

  static async getInstance(progress_callback = null) {
    if (this.instance === null) {
      this.instance = pipeline(this.task, this.model, { progress_callback });
    }
    return this.instance;
  }
}

self.onmessage = async function(event) {
  const { type, data } = event.data;
  
  if (type === 'TRANSCRIBE') {
    try {
      // Send loading status
      self.postMessage({ type: 'LOADING', data: 0 });
      
      // Initialize the pipeline
      const transcriber = await WhisperPipeline.getInstance((progress) => {
        self.postMessage({ type: 'LOADING', data: Math.round(progress.progress * 100) });
      });
      
      // Convert blob to array buffer
      const arrayBuffer = await data.arrayBuffer();
      
      // Transcribe the audio
      const result = await transcriber(arrayBuffer);
      
      // Send the result
      self.postMessage({ type: 'RESULT', data: result });
      
    } catch (error) {
      self.postMessage({ type: 'ERROR', data: error.message });
    }
  }
};
