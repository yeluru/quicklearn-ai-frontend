import React from 'react';
import { FaFileAlt, FaBook, FaQuestionCircle, FaComments, FaFileUpload, FaUserGraduate, FaBriefcase, FaBrain } from 'react-icons/fa';
import { Link } from 'react-router-dom';

function LandingPage({ theme, toggleTheme, onStart }) {
  return (
    <div className={`${theme === 'dark' ? 'bg-gray-900' : 'bg-white'} min-h-screen font-sans transition-colors`}>
      {/* Navbar */}
      <nav className="flex justify-between items-center px-6 py-4 max-w-6xl mx-auto">
        <h1 className={`text-2xl font-bold tracking-tight ${theme === 'dark' ? 'text-purple-200' : 'text-purple-700'}`}>VibeKnowing</h1>
        <button
          onClick={toggleTheme}
          className={`p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 ${theme === 'dark' ? 'bg-gray-800 text-yellow-400' : 'bg-gray-100 text-gray-700'}`}
          aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </nav>

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center text-center py-20 px-4">
        <h2 className={`text-5xl font-extrabold mb-6 leading-tight tracking-tight ${theme === 'dark' ? 'text-purple-200' : 'text-purple-700'}`}>Supercharge Your Learning with AI</h2>
        <p className={`text-xl mb-10 max-w-3xl mx-auto leading-relaxed ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Transform videos, audio, text, or files into transcripts, notes, and quizzes in seconds.</p>
        <button
          onClick={onStart}
          className={`px-10 py-4 rounded-2xl font-bold text-white bg-purple-600 hover:bg-purple-700 text-2xl shadow-md transition-all duration-200`}
        >
          Get Started
        </button>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 max-w-6xl mx-auto">
        <h3 className={`text-3xl font-semibold text-center mb-12 tracking-tight ${theme === 'dark' ? 'text-purple-200' : 'text-purple-700'}`}>Features</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          <Feature icon={<FaFileAlt size={36} />} title="Transcript Extraction" desc="Convert audio, video, and documents into accurate, searchable text." theme={theme} />
          <Feature icon={<FaBook size={36} />} title="Smart Summaries" desc="AI-generated notes and key insights for any content." theme={theme} />
          <Feature icon={<FaQuestionCircle size={36} />} title="Quiz Generation" desc="Test your knowledge with AI-generated quizzes." theme={theme} />
          <Feature icon={<FaComments size={36} />} title="Interactive Chat" desc="Ask questions about your content and get instant answers." theme={theme} />
          <Feature icon={<FaFileUpload size={36} />} title="Multi-Format Support" desc="Process videos, audio, text, PDFs, Word docs, and URLs." theme={theme} />
          <Feature icon={<FaBook size={36} />} title="Website Scraping" desc="Extract and analyze content from any public website." theme={theme} />
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 px-4 max-w-4xl mx-auto">
        <h3 className={`text-3xl font-semibold text-center mb-12 tracking-tight ${theme === 'dark' ? 'text-purple-200' : 'text-purple-700'}`}>How It Works</h3>
        <div className="flex flex-col md:flex-row justify-center gap-10">
          <Step number="1" title="Drop Your Content" desc="Upload a file, paste a URL, or type text to start." theme={theme} />
          <Step number="2" title="AI Does the Magic" desc="Get transcripts, notes, and quizzes in seconds." theme={theme} />
          <Step number="3" title="Learn & Engage" desc="Interact, chat, and download your resources." theme={theme} />
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-16 px-4 max-w-6xl mx-auto">
        <h3 className={`text-3xl font-semibold text-center mb-12 tracking-tight ${theme === 'dark' ? 'text-purple-200' : 'text-purple-700'}`}>Who Is It For?</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <UseCase icon={<FaUserGraduate size={32} />} title="Students" desc="Turn lectures and readings into study gold." theme={theme} />
          <UseCase icon={<FaBriefcase size={32} />} title="Professionals" desc="Master webinars and meetings quickly." theme={theme} />
          <UseCase icon={<FaBrain size={32} />} title="Curious Minds" desc="Explore any topic with AI-powered ease." theme={theme} />
          <UseCase icon={<FaBook size={32} />} title="Educators" desc="Create interactive learning materials." theme={theme} />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 text-center">
        <button
          onClick={onStart}
          className={`px-12 py-5 rounded-2xl font-extrabold text-white bg-purple-600 hover:bg-purple-700 text-2xl shadow-md transition-all duration-200`}
        >
          Start Learning Now
        </button>
      </section>

      {/* Footer */}
      <footer className={`py-10 text-center ${theme === 'dark' ? 'bg-gray-900 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
        <div className="flex justify-center space-x-8 mb-3">
          <Link to="/about" className={`${theme === 'dark' ? 'hover:text-purple-200' : 'hover:text-purple-700'} font-medium transition-colors`}>About</Link>
          <Link to="/contact" className={`${theme === 'dark' ? 'hover:text-purple-200' : 'hover:text-purple-700'} font-medium transition-colors`}>Contact</Link>
          <Link to="/privacy" className={`${theme === 'dark' ? 'hover:text-purple-200' : 'hover:text-purple-700'} font-medium transition-colors`}>Privacy</Link>
        </div>
        <p>© 2025 VibeKnowing. All rights reserved.</p>
      </footer>
    </div>
  );
}

function Feature({ icon, title, desc, theme }) {
  return (
    <div className={`flex flex-col items-center p-8 rounded-xl shadow-md transition-all duration-200 ${theme === 'dark' ? 'bg-gray-800 text-gray-100' : 'bg-white/95 text-gray-900'} hover:shadow-lg hover:scale-105`}>
      <div className={`mb-4 text-purple-600 dark:text-purple-300`}>{icon}</div>
      <h4 className="text-lg font-semibold mb-2 text-center tracking-tight">{title}</h4>
      <p className="text-center text-base leading-relaxed text-gray-500 dark:text-gray-400">{desc}</p>
    </div>
  );
}

function Step({ number, title, desc, theme }) {
  return (
    <div className={`flex flex-col items-center p-8 rounded-xl shadow-md transition-all duration-200 ${theme === 'dark' ? 'bg-gray-800 text-gray-100' : 'bg-white/95 text-gray-900'} hover:shadow-lg hover:scale-105`}>
      <div className={`w-12 h-12 flex items-center justify-center rounded-full mb-3 font-extrabold text-2xl ${theme === 'dark' ? 'bg-purple-900 text-purple-200' : 'bg-purple-100 text-purple-700'}`}>{number}</div>
      <h4 className="text-base font-semibold mb-2 text-center tracking-tight">{title}</h4>
      <p className="text-center text-base leading-relaxed text-gray-500 dark:text-gray-400">{desc}</p>
    </div>
  );
}

function UseCase({ icon, title, desc, theme }) {
  return (
    <div className={`flex flex-col items-center p-8 rounded-xl shadow-md transition-all duration-200 ${theme === 'dark' ? 'bg-gray-800 text-gray-100' : 'bg-white/95 text-gray-900'} hover:shadow-lg hover:scale-105`}>
      <div className="mb-4 text-purple-600 dark:text-purple-300">{icon}</div>
      <h4 className="text-lg font-semibold mb-2 text-center tracking-tight">{title}</h4>
      <p className="text-center text-base leading-relaxed text-gray-500 dark:text-gray-400">{desc}</p>
    </div>
  );
}

export default LandingPage;