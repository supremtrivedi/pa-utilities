import React, { useState, useRef, useEffect } from 'react';
import './WhisperTab.css';

function WhisperTab() {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [audioURL, setAudioURL] = useState('');
  const [progress, setProgress] = useState(null);
  
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);
  const worker = useRef(null);

  useEffect(() => {
    // Initialize the worker
    worker.current = new Worker(new URL('../whisper-worker.js', import.meta.url), {
      type: 'module'
    });

    worker.current.onmessage = (event) => {
      const { type, data } = event.data;
      
      switch (type) {
        case 'LOADING':
          setProgress(data);
          break;
        case 'RESULT':
          setTranscription(data.text);
          setIsTranscribing(false);
          break;
        case 'ERROR':
          console.error('Transcription error:', data);
          setIsTranscribing(false);
          break;
      }
    };

    return () => {
      worker.current?.terminate();
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };

      mediaRecorder.current.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/wav' });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        
        // Start transcription
        setIsTranscribing(true);
        worker.current.postMessage({ type: 'TRANSCRIBE', data: audioBlob });
      };

      mediaRecorder.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);
      
      // Stop all tracks
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAudioURL(url);
      setIsTranscribing(true);
      worker.current.postMessage({ type: 'TRANSCRIBE', data: file });
    }
  };

  return (
    <div className="whisper-tab">
      <div className="whisper-section">
        <h2 className="section-title">Audio Input</h2>
        
        <div className="audio-controls">
          <div className="recording-controls">
            <button
              className={`btn-primary ${isRecording ? 'recording' : ''}`}
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isTranscribing}
            >
              {isRecording ? (
                <>
                  <div className="recording-indicator" />
                  Stop Recording
                </>
              ) : (
                <>
                  🎤 Start Recording
                </>
              )}
            </button>
            
            <div className="file-upload">
              <input
                type="file"
                id="audio-upload"
                accept="audio/*"
                onChange={handleFileUpload}
                disabled={isTranscribing}
                style={{ display: 'none' }}
              />
              <label htmlFor="audio-upload" className="btn-secondary">
                📁 Upload Audio File
              </label>
            </div>
          </div>
          
          {audioURL && (
            <div className="audio-preview">
              <audio controls src={audioURL} className="audio-player" />
            </div>
          )}
        </div>
      </div>

      <div className="whisper-section">
        <h2 className="section-title">Transcription</h2>
        
        {isTranscribing && (
          <div className="progress-container">
            <div className="loading-spinner" />
            <p>Transcribing audio...</p>
            {progress && (
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </div>
        )}
        
        <textarea
          value={transcription}
          onChange={(e) => setTranscription(e.target.value)}
          placeholder="Transcription will appear here..."
          className="transcription-textarea"
          rows="8"
        />
        
        {transcription && (
          <div className="transcription-actions">
            <button
              className="btn-secondary"
              onClick={() => navigator.clipboard.writeText(transcription)}
            >
              📋 Copy Text
            </button>
            <button
              className="btn-secondary"
              onClick={() => setTranscription('')}
            >
              🗑️ Clear
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default WhisperTab;
