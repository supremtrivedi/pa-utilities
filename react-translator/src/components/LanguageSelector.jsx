import { LANGUAGES } from '../languages.js';

function LanguageSelector({ type, defaultLanguage, onChange }) {
  return (
    <div className="language-selector-container">
      <label className="section-title">{type}: </label>
      <select 
        className="language-selector"
        onChange={onChange} 
        defaultValue={defaultLanguage}
      >
        {Object.entries(LANGUAGES).map(([key, value]) => {
          return <option key={key} value={value}>{key}</option>
        })}
      </select>
    </div>
  );
}

export default LanguageSelector;
