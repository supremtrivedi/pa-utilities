import React, { useState, useRef, useEffect } from 'react';
import './WhisperTab.css';
import { formatAudioTimestamp } from '../utils/AudioUtils';

function WhisperTab() {
  const [activeInputMethod, setActiveInputMethod] = useState('url');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [progressItems, setProgressItems] = useState([]);
  const [transcribedData, setTranscribedData] = useState(null);

  // URL input state
  const [urlInput, setUrlInput] = useState('');

  // File input state
  const [selectedFile, setSelectedFile] = useState(null);
  const [audioURL, setAudioURL] = useState('');

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);

  const [model, setModel] = useState('Xenova/whisper-tiny.en');
  const [language, setLanguage] = useState('english');
  const [subtask, setSubtask] = useState('transcribe');

  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);
  const worker = useRef(null);
  const recordingTimer = useRef(null);
  const fileInputRef = useRef(null);

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
          break;
        case 'update':
        case 'complete':
          setTranscribedData(e.data.output);
          setIsTranscribing(e.data.status === 'update');
          break;
        case 'error':
          setIsTranscribing(false);
          break;
        default:
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

  // --- Tab switching clears stale state ---
  const handleTabChange = (method) => {
    setActiveInputMethod(method);
    setSelectedFile(null);
    setRecordedBlob(null);
    setAudioURL('');
    setTranscribedData(null);
    setProgressItems([]);
    setUrlInput('');
    setRecordingTime(0);
  };

  // URL input processing
  const handleUrlSubmit = async () => {
    if (!urlInput.trim()) return;
    setIsTranscribing(true);
    setTranscribedData(null);
    setProgressItems([]);
    worker.current.postMessage({
      url: urlInput,
      model,
      language,
      subtask
    });
  };

  // File input processing (choose file, preview, then transcribe)
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setAudioURL(URL.createObjectURL(file));
      setTranscribedData(null);
      setProgressItems([]);
    }
  };

  const handleFileSubmit = () => {
    if (!selectedFile) return;
    setIsTranscribing(true);
    setTranscribedData(null);
    setProgressItems([]);
    worker.current.postMessage({
      audio: selectedFile,
      model,
      language,
      subtask
    });
  };

  // Recording controls
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];
      setRecordingTime(0);

      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data);
        }
      };

      mediaRecorder.current.onstop = () => {
        const blob = new Blob(audioChunks.current, { type: 'audio/webm' });
        setRecordedBlob(blob);
        setAudioURL(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
        clearInterval(recordingTimer.current);
        setTranscribedData(null);
        setProgressItems([]);
      };

      mediaRecorder.current.start();
      setIsRecording(true);

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
    setTranscribedData(null);
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
    setTranscribedData(null);
    setUrlInput('');
    setSelectedFile(null);
    setRecordedBlob(null);
    setAudioURL('');
    setRecordingTime(0);
    setProgressItems([]);
  };

  // Export functions
  const exportTXT = () => {
    const txt = (transcribedData?.chunks ?? []).map(c => c.text).join('') || transcribedData?.text || '';
    const blob = new Blob([txt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transcription.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportJSON = () => {
    const json = JSON.stringify(transcribedData?.chunks ?? [], null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transcription.json';
    a.click();
    URL.revokeObjectURL(url);
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
              onChange={e => setModel(e.target.value)}
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
              onChange={e => setLanguage(e.target.value)}
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
              onChange={e => setSubtask(e.target.value)}
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
            onClick={() => handleTabChange('url')}
          >
            🔗 From URL
          </button>
          <button
            className={`input-tab ${activeInputMethod === 'file' ? 'active' : ''}`}
            onClick={() => handleTabChange('file')}
          >
            📁 From File
          </button>
          <button
            className={`input-tab ${activeInputMethod === 'record' ? 'active' : ''}`}
            onClick={() => handleTabChange('record')}
          >
            🎤 Record
          </button>
        </div>

        {activeInputMethod === 'url' && (
          <div className="input-panel">
            <input
              type="url"
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
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

        {activeInputMethod === 'file' && (
          <div className="input-panel">
            {/* Hidden file input */}
            <input
              type="file"
              accept="audio/*,video/*"
              onChange={handleFileChange}
              ref={fileInputRef}
              style={{ display: 'none' }}
            />
            <button
              type="button"
              className="btn-primary"
              disabled={isTranscribing}
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
            >
              Choose File…
            </button>
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
        {transcribedData?.chunks?.length > 0 ? (
          <div style={{ maxHeight: 300, overflowY: 'auto', background: '#fff', border: '1px solid #efefef', borderRadius: 4, padding: 12 }}>
            {transcribedData.chunks.map((chunk, i) => (
              <div key={i} style={{ marginBottom: 10 }}>
                <span style={{ color: "#888", marginRight: 8 }}>
                  {chunk.timestamp && chunk.timestamp[0] != null
                    ? formatAudioTimestamp(chunk.timestamp[0])
                    : ""}
                </span>
                <span>{chunk.text}</span>
              </div>
            ))}
          </div>
        ) : (
          <textarea
            value={transcribedData?.text || ""}
            readOnly
            className="transcription-textarea"
            rows={10}
          />
        )}
        {(transcribedData?.text || "").length > 0 && (
          <div className="transcription-actions">
            <button
              onClick={() => navigator.clipboard.writeText(
                (transcribedData?.chunks ?? []).map(c => c.text).join('') ||
                transcribedData?.text || ''
              )}
              className="btn-secondary"
            >
              📋 Copy Text
            </button>
            <button
              onClick={exportTXT}
              className="btn-secondary"
            >
              💾 Download TXT
            </button>
            <button
              onClick={exportJSON}
              className="btn-secondary"
            >
              💾 Download JSON
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
