import React, { useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import LandingPage from './LandingPage';
import MainApp from './MainApp';

// Placeholder components for new routes
function About() {
  return <div className="p-6 text-center"><h1 className="text-3xl font-bold">About Us</h1><p>Learn more about QuickLearn.AI.</p></div>;
}
function Contact() {
  return <div className="p-6 text-center"><h1 className="text-3xl font-bold">Contact</h1><p>Get in touch with us.</p></div>;
}
function Privacy() {
  return <div className="p-6 text-center"><h1 className="text-3xl font-bold">Privacy Policy</h1><p>Our privacy policy details.</p></div>;
}

function App() {
  const [theme, setTheme] = useState('light');
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
              <LandingPage theme={theme} toggleTheme={toggleTheme} onStart={() => setShowLandingPage(false)} />
            ) : (
              <MainApp theme={theme} toggleTheme={toggleTheme} />
            )
          }
        />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/app" element={<MainApp theme={theme} toggleTheme={toggleTheme} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;