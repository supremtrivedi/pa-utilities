import React from 'react';
import './TabNavigation.css';

function TabNavigation({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'translator', label: 'Translation', icon: '🌐' },
    { id: 'whisper', label: 'Speech to Text', icon: '🎤' },
    { id: 'direct', label: 'Model Test', icon: '🧪' },
     { id: 'presentation', label: 'Presentation', icon: '📊' }
  ];

  return (
    <div className="tab-navigation">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          <span className="tab-icon">{tab.icon}</span>
          <span className="tab-label">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}

export default TabNavigation;
