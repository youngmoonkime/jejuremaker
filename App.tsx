import React, { useState, useEffect } from 'react';
import Discovery from './components/Discovery';
import ProjectDetail from './components/ProjectDetail';
import Workspace from './components/Workspace';

type ViewState = 'discovery' | 'detail' | 'workspace';
export type Language = 'ko' | 'en';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('discovery');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [language, setLanguage] = useState<Language>('ko');

  // Apply dark mode class to html element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);
  const toggleLanguage = () => setLanguage(prev => prev === 'ko' ? 'en' : 'ko');

  // Simple view router
  const renderView = () => {
    switch (currentView) {
      case 'discovery':
        return (
          <Discovery 
            onNavigate={(view) => setCurrentView(view)} 
            isDarkMode={isDarkMode}
            toggleDarkMode={toggleDarkMode}
            language={language}
            toggleLanguage={toggleLanguage}
          />
        );
      case 'detail':
        return (
          <ProjectDetail 
            onBack={() => setCurrentView('discovery')} 
            onOpenWorkspace={() => setCurrentView('workspace')} 
            isDarkMode={isDarkMode}
            toggleDarkMode={toggleDarkMode}
            language={language}
            toggleLanguage={toggleLanguage}
          />
        );
      case 'workspace':
        return (
          <Workspace 
            onExit={() => setCurrentView('detail')} 
            language={language}
          />
        );
      default:
        return (
          <Discovery 
            onNavigate={(view) => setCurrentView(view)} 
            isDarkMode={isDarkMode}
            toggleDarkMode={toggleDarkMode}
            language={language}
            toggleLanguage={toggleLanguage}
          />
        );
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'dark bg-background-dark' : 'bg-background-light'}`}>
      {renderView()}
    </div>
  );
};

export default App;
