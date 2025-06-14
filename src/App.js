import React, { useState } from 'react';
import LandingPage from './LandingPage';
import MainApp from './MainApp';

function App() {
  const [theme, setTheme] = useState('light');
  const [showLandingPage, setShowLandingPage] = useState(true);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <div>
      {showLandingPage ? (
        <LandingPage theme={theme} toggleTheme={toggleTheme} onStart={() => setShowLandingPage(false)} />
      ) : (
        <MainApp theme={theme} toggleTheme={toggleTheme} />
      )}
    </div>
  );
}

export default App;