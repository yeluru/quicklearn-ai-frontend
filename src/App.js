import React, { useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import LandingPage from './LandingPage';
import MainApp from './MainApp';
import About from './pages/About';
import Contact from './pages/Contact';
import Privacy from './pages/Privacy';

function App() {
      const [theme, setTheme] = useState('dark');
  const [showLandingPage, setShowLandingPage] = useState(true);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            showLandingPage ? (
              <LandingPage
                theme={theme}
                toggleTheme={toggleTheme}
                onStart={() => setShowLandingPage(false)}
              />
            ) : (
              <MainApp theme={theme} toggleTheme={toggleTheme} />
            )
          }
        />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route
          path="/app"
          element={<MainApp theme={theme} toggleTheme={toggleTheme} />}
        />
        <Route
          path="*"
          element={
            <div className="p-6 text-center text-red-600">
              <h1 className="text-3xl font-bold">404 - Page Not Found</h1>
              <p>The page you’re looking for doesn’t exist.</p>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
