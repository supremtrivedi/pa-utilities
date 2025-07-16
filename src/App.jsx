import { useState, useRef, useCallback, useEffect } from 'react';
import './App.css';
import LanguageSelector from './components/LanguageSelector';
import Progress from './components/Progress';
import TabNavigation from './components/TabNavigation';
import WhisperTab from './components/WhisperTab';
import { pipeline } from '@xenova/transformers';
import { webmFixDuration } from './utils/BlobFix';

function App() {

  const [directFile, setDirectFile] = useState(null);
  const [fixedBlob, setFixedBlob] = useState(null);

  const [directResult, setDirectResult] = useState('');
  const [directLoading, setDirectLoading] = useState(false);

  const handleDirectFileChange = async (e) => {
  const file = e.target.files[0];
  setDirectFile(file);
  setDirectResult('');
  setFixedBlob(null);

  // Only fix if the file is webm (recorded in app)
  if (file && file.type === 'audio/webm') {
    const objectUrl = URL.createObjectURL(file);
    const audio = new Audio(objectUrl);

    audio.addEventListener('loadedmetadata', async () => {
      // Duration in seconds, multiplied by 1000 for ms
      const fixed = await webmFixDuration(file, audio.duration * 1000);
      setFixedBlob(fixed);
    });
    // Trigger metadata loading
    audio.load();
  }
};

const handleDirectTranscribe = async () => {
  setDirectLoading(true);
  setDirectResult('');
  try {
    const asr = await pipeline(
      'automatic-speech-recognition',
      'Xenova/whisper-tiny.en'
    );
    // Use fixedBlob if available, otherwise use directFile
    const input = fixedBlob || directFile;
    const result = await asr(input, {
      language: 'english',
      task: 'transcribe',
      chunk_length_s: 30,
      stride_length_s: 5,
      return_timestamps: true,
      top_k: 0,
      do_sample: false,
      force_full_sequences: false
    });
    setDirectResult(JSON.stringify(result, null, 2));
  } catch (err) {
    setDirectResult('ERROR: ' + String(err));
  }
  setDirectLoading(false);
};

  
  const [activeTab, setActiveTab] = useState('translator');
  const [sourceLanguage, setSourceLanguage] = useState('eng_Latn');
  const [targetLanguage, setTargetLanguage] = useState('fra_Latn');
  const [input, setInput] = useState('I love walking my dog.');
  const [output, setOutput] = useState('');
  const [ready, setReady] = useState(null);
  const [disabled, setDisabled] = useState(false);
  const [progressItems, setProgressItems] = useState([]);

  const worker = useRef(null);

  // Initialize worker for translation
// Initialize worker for translation
useEffect(() => {
  if (!worker.current) {
    worker.current = new Worker(new URL('./worker.js', import.meta.url), {
      type: 'module'
    });
  }

  const onMessageReceived = (e) => {
  switch (e.data.status) {
    case 'initiate':
      setReady(false);
      setProgressItems(prev => [...prev, e.data]);
      break;
    case 'progress':
      setProgressItems(
        prev => prev.map(item => {
          if (item.file === e.data.file) {
            return { ...item, progress: e.data.progress }
          }
          return item;
        })
      );
      break;
    case 'done':
      setProgressItems(
        prev => prev.filter(item => item.file !== e.data.file)
      );
      break;
    case 'ready':
      setReady(true);
      break;
    case 'update':
      setOutput(e.data.output);
      break;
    case 'complete':
      setDisabled(false);
      break;
  }
};


  worker.current.addEventListener('message', onMessageReceived);

  return () => {
    worker.current?.removeEventListener('message', onMessageReceived);
  };
},);


  const translate = useCallback(() => {
    if (!input.trim()) return;
    
    if (worker.current) {
      setDisabled(true);
      setOutput('');
      
      worker.current.postMessage({
        text: input,
        src_lang: sourceLanguage,
        tgt_lang: targetLanguage,
      });
    } else {
      console.error('Worker not initialized');
    }
  }, [input, sourceLanguage, targetLanguage]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'translator':
        return (
          <div className="translator-card">
            <div className="translator-section">
              <h2 className="section-title">Languages</h2>
              <div className="language-controls">
                <LanguageSelector 
                  type={"Source"} 
                  defaultLanguage={"eng_Latn"} 
                  onChange={x => setSourceLanguage(x.target.value)}
                />
                <LanguageSelector 
                  type={"Target"} 
                  defaultLanguage={"fra_Latn"} 
                  onChange={x => setTargetLanguage(x.target.value)}
                />
              </div>
            </div>

            <div className="translator-section">
              <div className="textbox-container">
                <textarea 
                  value={input} 
                  rows={3} 
                  onChange={e => setInput(e.target.value)}
                  placeholder="Enter text to translate..."
                  className="translation-textarea"
                />
                <textarea 
                  value={output} 
                  rows={3} 
                  readOnly
                  placeholder="Translation will appear here..."
                  className="translation-textarea"
                />
              </div>
            </div>

            <button 
              disabled={disabled} 
              onClick={translate}
              className="btn-primary"
            >
              {disabled ? (
                <>
                  <div className="loading-spinner" />
                  Translating...
                </>
              ) : (
                'Translate'
              )}
            </button>

            {ready === false && (
              <div className="progress-container">
                <h3 className="section-title">Loading Model</h3>
                <label>Loading models... (only run once)</label>
                {progressItems.map(data => (
                  <div key={data.file} style={{ marginBottom: '12px' }}>
                    <Progress text={data.file} percentage={data.progress} />
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      
      case 'whisper':
        return (
          <div className="translator-card">
            <WhisperTab />
          </div>
        );
      
        case 'direct':
  return (
    <div className="translator-card">
      <h2 className="section-title">Direct Whisper Model Test</h2>
      <div style={{ marginBottom: 16 }}>
        Select an audio file (webm, mp3, wav, etc) and run the Whisper model <b>directly in-browser</b>. This bypasses your worker and UI.
      </div>
      <input
        type="file"
        accept="audio/*,video/*"
        disabled={directLoading}
        onChange={handleDirectFileChange}
        style={{marginBottom: 12}}
      />
      {directFile && (
        <div style={{ margin: '10px 0' }}>
          <strong>Selected file:</strong> {directFile.name}
          <audio controls src={URL.createObjectURL(directFile)} style={{ display: 'block', marginTop: 8 }} />
          <button
            disabled={directLoading}
            className="btn-primary"
            onClick={handleDirectTranscribe}
            style={{ marginTop: 10 }}
          >
            {directLoading ? 'Transcribing…' : 'Direct Transcribe'}
          </button>
        </div>
      )}
      {directResult && (
        <pre style={{
          background: '#f4f4f4',
          maxHeight: 250,
          overflow: 'auto',
          marginTop: 10,
          border: '1px solid #DDD',
          padding: 10,
          borderRadius: 4
        }}>{directResult}</pre>
      )}
    </div>
  );
      default:
        return (
          <div className="translator-card">
            <div className="translator-section">
              <h2 className="section-title">Languages</h2>
              <div className="language-controls">
                <LanguageSelector 
                  type={"Source"} 
                  defaultLanguage={"eng_Latn"} 
                  onChange={x => setSourceLanguage(x.target.value)}
                />
                <LanguageSelector 
                  type={"Target"} 
                  defaultLanguage={"fra_Latn"} 
                  onChange={x => setTargetLanguage(x.target.value)}
                />
              </div>
            </div>

            <div className="translator-section">
              <div className="textbox-container">
                <textarea 
                  value={input} 
                  rows={3} 
                  onChange={e => setInput(e.target.value)}
                  placeholder="Enter text to translate..."
                  className="translation-textarea"
                />
                <textarea 
                  value={output} 
                  rows={3} 
                  readOnly
                  placeholder="Translation will appear here..."
                  className="translation-textarea"
                />
              </div>
            </div>

            <button 
              disabled={disabled} 
              onClick={translate}
              className="btn-primary"
            >
              {disabled ? (
                <>
                  <div className="loading-spinner" />
                  Translating...
                </>
              ) : (
                'Translate'
              )}
            </button>

            {ready === false && (
              <div className="progress-container">
                <h3 className="section-title">Loading Model</h3>
                <label>Loading models... (only run once)</label>
                {progressItems.map(data => (
                  <div key={data.file} style={{ marginBottom: '12px' }}>
                    <Progress text={data.file} percentage={data.progress} />
                  </div>
                ))}
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="pa-branding">
          <svg className="pa-logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 451.14 400">
            <defs>
              <style>
                {`.cls-1{fill:#f62b44;}.cls-2{fill:#fff;}.cls-3{fill:#7c8b9a;}`}
              </style>
            </defs>
            <path className="cls-1" d="M352.39,105.79c-15.54,0-30.15-6.05-41.14-17.04-10.99-10.99-17.04-25.6-17.04-41.14,0-7.58,1.44-14.94,4.19-21.76C269.35,9.4,235.77,0,200,0,89.54,0,0,89.54,0,200s89.54,200,200,200,200-89.54,200-200c0-35.77-9.39-69.35-25.85-98.41-6.83,2.75-14.18,4.19-21.76,4.19Z"></path>
            <path className="cls-2" d="M143.02,120.52H77.39v147.98h30.03v-44.82h35.6c34.53,0,57.26-20.59,57.26-51.48s-22.73-51.68-57.26-51.68Zm.21,75.27h-35.81v-47.39h35.81c17.59,0,26.6,9.43,26.6,23.8s-9.01,23.59-26.6,23.59Z"></path>
            <path className="cls-2" d="M285.21,120.52h-36.67l-62.63,147.98h31.96l11.58-28.74h74.42l11.59,28.74h31.95l-62.2-147.98Zm-45.03,91.36l26.59-65.2,26.38,65.2h-52.97Z"></path>
            <g>
              <circle className="cls-3" cx="352.39" cy="47.61" r="47.61"></circle>
              <circle className="cls-3" cx="424.68" cy="108.43" r="25.74"></circle>
              <circle className="cls-3" cx="436.13" cy="47.61" r="15.02"></circle>
            </g>
          </svg>
        </div>
        <h1 className="app-title">PA Consulting Utilities Hub</h1>
        <p className="app-subtitle">Bringing ingenuity to multilingual communication & speech recognition</p>
        <p className="pa-tagline">Innovation that brings life to ideas</p>
      </header>

      <TabNavigation 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
      />

      {renderTabContent()}
    </div>
  );
}

export default App;
