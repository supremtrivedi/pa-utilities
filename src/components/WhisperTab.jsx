import React, { useState, useRef, useEffect } from 'react';
import './WhisperTab.css';

function WhisperTab() {
  const [activeInputMethod, setActiveInputMethod] = useState('url');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [model, setModel] = useState('Xenova/whisper-tiny.en');
  const [language, setLanguage] = useState('english');
  const [subtask, setSubtask] = useState('transcribe');
  const [progressItems, setProgressItems] = useState([]);

  // URL input state
  const [urlInput, setUrlInput] = useState('');

  // File input state
  const [selectedFile, setSelectedFile] = useState(null);
  const [audioURL, setAudioURL] = useState('');

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);

  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);
  const worker = useRef(null);
  const recordingTimer = useRef(null);

  // Initialize worker exactly like original
  useEffect(() => {
    if (!worker.current) {
      worker.current = new Worker(new URL('../whisper-worker.js', import.meta.url), {
        type: 'module'
      });
    }

    const onMessageReceived = (e) => {
      switch (e.data.status) {
        case 'initiate':
          setProgressItems(prev => [...prev, e.data]);
          break;
        case 'progress':
          setProgressItems(prev => 
            prev.map(item => {
              if (item.file === e.data.file) {
                return { ...item, progress: e.data.progress };
              }
              return item;
            })
          );
          break;
        case 'done':
          setProgressItems(prev => prev.filter(item => item.file !== e.data.file));
          break;
        case 'ready':
          // Model is ready
          break;
        case 'update':
          setTranscription(e.data.output);
          break;
        case 'complete':
          setIsTranscribing(false);
          break;
        case 'error':
          console.error('Transcription error:', e.data.error);
          setIsTranscribing(false);
          break;
      }
    };

    worker.current.addEventListener('message', onMessageReceived);

    return () => {
      if (worker.current) {
        worker.current.removeEventListener('message', onMessageReceived);
      }
    };
  }, []);

  // URL processing
  const handleUrlSubmit = async () => {
    if (!urlInput.trim()) return;
    
    setIsTranscribing(true);
    setTranscription('');
    setProgressItems([]);
    
    worker.current.postMessage({
      url: urlInput,
      model,
      language,
      subtask
    });
  };

  // File processing
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setAudioURL(URL.createObjectURL(file));
    }
  };

  const handleFileSubmit = () => {
    if (!selectedFile) return;
    
    setIsTranscribing(true);
    setTranscription('');
    setProgressItems([]);
    
    worker.current.postMessage({
      audio: selectedFile,
      model,
      language,
      subtask
    });
  };

  // Recording functionality
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];
      setRecordingTime(0);

      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };

      mediaRecorder.current.onstop = () => {
        const blob = new Blob(audioChunks.current, { type: 'audio/wav' });
        setRecordedBlob(blob);
        setAudioURL(URL.createObjectURL(blob));
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        clearInterval(recordingTimer.current);
      };

      mediaRecorder.current.start();
      setIsRecording(true);
      
      // Start timer
      recordingTimer.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);
      clearInterval(recordingTimer.current);
    }
  };

  const submitRecording = () => {
    if (!recordedBlob) return;
    
    setIsTranscribing(true);
    setTranscription('');
    setProgressItems([]);
    
    worker.current.postMessage({
      audio: recordedBlob,
      model,
      language,
      subtask
    });
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const clearAll = () => {
    setTranscription('');
    setUrlInput('');
    setSelectedFile(null);
    setRecordedBlob(null);
    setAudioURL('');
    setRecordingTime(0);
    setProgressItems([]);
  };

  return (
    <div className="whisper-tab">
      {/* Configuration Section */}
      <div className="whisper-section">
        <h2 className="section-title">Configuration</h2>
        <div className="config-controls">
          <div className="config-group">
            <label>Model:</label>
            <select 
              value={model} 
              onChange={(e) => setModel(e.target.value)}
              className="config-select"
            >
              <option value="Xenova/whisper-tiny.en">Tiny English (39MB)</option>
              <option value="Xenova/whisper-base.en">Base English (74MB)</option>
              <option value="Xenova/whisper-small.en">Small English (244MB)</option>
              <option value="Xenova/whisper-tiny">Tiny Multilingual (39MB)</option>
              <option value="Xenova/whisper-base">Base Multilingual (74MB)</option>
              <option value="Xenova/whisper-small">Small Multilingual (244MB)</option>
            </select>
          </div>

          <div className="config-group">
            <label>Language:</label>
            <select 
              value={language} 
              onChange={(e) => setLanguage(e.target.value)}
              className="config-select"
            >
              <option value="english">English</option>
              <option value="spanish">Spanish</option>
              <option value="french">French</option>
              <option value="german">German</option>
              <option value="italian">Italian</option>
              <option value="portuguese">Portuguese</option>
              <option value="dutch">Dutch</option>
              <option value="russian">Russian</option>
              <option value="japanese">Japanese</option>
              <option value="korean">Korean</option>
              <option value="chinese">Chinese</option>
              <option value="arabic">Arabic</option>
            </select>
          </div>

          <div className="config-group">
            <label>Task:</label>
            <select 
              value={subtask} 
              onChange={(e) => setSubtask(e.target.value)}
              className="config-select"
            >
              <option value="transcribe">Transcribe</option>
              <option value="translate">Translate to English</option>
            </select>
          </div>
        </div>
      </div>

      {/* Input Method Selection */}
      <div className="whisper-section">
        <h2 className="section-title">Audio Input</h2>
        <div className="input-method-tabs">
          <button 
            className={`input-tab ${activeInputMethod === 'url' ? 'active' : ''}`}
            onClick={() => setActiveInputMethod('url')}
          >
            🔗 From URL
          </button>
          <button 
            className={`input-tab ${activeInputMethod === 'file' ? 'active' : ''}`}
            onClick={() => setActiveInputMethod('file')}
          >
            📁 From File
          </button>
          <button 
            className={`input-tab ${activeInputMethod === 'record' ? 'active' : ''}`}
            onClick={() => setActiveInputMethod('record')}
          >
            🎤 Record
          </button>
        </div>

        {/* URL Input */}
        {activeInputMethod === 'url' && (
          <div className="input-panel">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Enter YouTube URL or direct audio file URL..."
              className="url-input"
            />
            <button 
              onClick={handleUrlSubmit}
              disabled={isTranscribing || !urlInput.trim()}
              className="btn-primary"
            >
              Process URL
            </button>
          </div>
        )}

        {/* File Input */}
        {activeInputMethod === 'file' && (
          <div className="input-panel">
            <input
              type="file"
              accept="audio/*,video/*"
              onChange={handleFileChange}
              className="file-input"
            />
            {selectedFile && (
              <div className="file-preview">
                <p>Selected: {selectedFile.name}</p>
                <audio controls src={audioURL} className="audio-preview" />
                <button 
                  onClick={handleFileSubmit}
                  disabled={isTranscribing}
                  className="btn-primary"
                >
                  Transcribe File
                </button>
              </div>
            )}
          </div>
        )}

        {/* Recording Input */}
        {activeInputMethod === 'record' && (
          <div className="input-panel">
            <div className="recording-controls">
              <div className="recording-status">
                {isRecording ? (
                  <div className="recording-active">
                    <div className="recording-indicator" />
                    <span>Recording: {formatTime(recordingTime)}</span>
                  </div>
                ) : (
                  <span>Ready to record</span>
                )}
              </div>
              
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`btn-record ${isRecording ? 'recording' : ''}`}
                disabled={isTranscribing}
              >
                {isRecording ? '⏹️ Stop Recording' : '🎤 Start Recording'}
              </button>
              
              {recordedBlob && (
                <div className="recorded-audio">
                  <audio controls src={audioURL} className="audio-preview" />
                  <button 
                    onClick={submitRecording}
                    disabled={isTranscribing}
                    className="btn-primary"
                  >
                    Transcribe Recording
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Progress Section */}
      {progressItems.length > 0 && (
        <div className="progress-container">
          <h3 className="section-title">Loading Model</h3>
          <label>Loading models... (only happens once)</label>
          {progressItems.map(data => (
            <div key={data.file} style={{ marginBottom: '12px' }}>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${data.progress || 0}%` }}
                />
              </div>
              <p className="progress-text">{data.file} ({data.progress || 0}%)</p>
            </div>
          ))}
        </div>
      )}

      {/* Transcription Results */}
      <div className="whisper-section">
        <h2 className="section-title">Transcription</h2>
        <textarea
          value={transcription}
          onChange={(e) => setTranscription(e.target.value)}
          placeholder="Transcription will appear here..."
          className="transcription-textarea"
          rows="10"
        />
        
        {transcription && (
          <div className="transcription-actions">
            <button
              onClick={() => navigator.clipboard.writeText(transcription)}
              className="btn-secondary"
            >
              📋 Copy Text
            </button>
            <button
              onClick={() => {
                const blob = new Blob([transcription], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'transcription.txt';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }}
              className="btn-secondary"
            >
              💾 Download
            </button>
            <button
              onClick={clearAll}
              className="btn-secondary"
            >
              🗑️ Clear All
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default WhisperTab;
