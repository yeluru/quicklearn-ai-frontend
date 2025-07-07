import React from 'react';
import { FaFileAlt, FaBook, FaQuestionCircle, FaComments, FaFileUpload, FaMoon, FaSun, FaUserGraduate, FaBriefcase, FaBrain } from 'react-icons/fa';
import { Link } from 'react-router-dom';

function LandingPage({ theme, toggleTheme, onStart }) {
  return (
    <div className={`${theme === 'dark' ? 'dark bg-gray-800' : 'bg-gradient-to-br from-gray-50 via-purple-50/50 to-gray-50'} min-h-screen font-sans`}>
      {/* Navbar */}
      <nav className="flex justify-between items-center p-6">
        <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-purple-300' : 'text-purple-600'}`}>QuickLearn.AI</h1>
        <button
          onClick={toggleTheme}
          className={`p-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all duration-200 ${theme === 'dark' ? 'bg-gray-800 text-yellow-400' : 'bg-white text-gray-800'} hover:scale-110`}
          aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <FaSun size={24} /> : <FaMoon size={24} />}
        </button>
      </nav>

      {/* Main Content (Hero + Features) */}
      <main className="flex flex-col items-center h-[calc(100vh-96px)] px-4 pt-2 pb-4 mb-8">
        {/* Hero Section */}
        <section className="flex flex-col items-center justify-center text-center mb-4 flex-shrink-0">
          <h1 className={`text-4xl md:text-5xl font-extrabold ${theme === 'dark' ? 'text-purple-300' : 'text-purple-600'} mb-2`}>Supercharge Your Learning with AI</h1>
          <p className={`text-lg md:text-xl ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mb-4 max-w-xl`}>Transform videos, audio, text, or files into transcripts, notes, and quizzes in seconds!</p>
          <br />
          <button
            onClick={onStart}
            className={`px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400 text-base font-semibold transition-all duration-200 ${theme === 'dark' ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-purple-500 hover:bg-purple-600 text-white'} transform hover:scale-105`}
          >
            Dive In Now!
          </button>
          <br />

        </section>

        {/* Features Section with Widgets */}
        <section className="flex-1 w-full overflow-y-auto custom-scrollbar mt-12">
          <h3 className={`text-3xl font-bold text-center ${theme === 'dark' ? 'text-purple-300' : 'text-purple-600'} mb-6`}>Explore Our Powerful Features</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <FeatureWidget
              icon={<FaFileAlt size={40} />}
              title="Transcript Extraction"
              description="Instantly convert audio and video content into accurate, searchable text transcripts."
              theme={theme}
            />
            <FeatureWidget
              icon={<FaBook size={40} />}
              title="Smart Summaries"
              description="Generate concise, structured notes from any content to focus on key insights."
              theme={theme}
            />
            <FeatureWidget
              icon={<FaQuestionCircle size={40} />}
              title="Interactive Quizzes"
              description="Test your knowledge with AI-generated quizzes tailored to your content."
              theme={theme}
            />
            <FeatureWidget
              icon={<FaComments size={40} />}
              title="Chat with Content"
              description="Ask questions about your content and get instant, relevant answers."
              theme={theme}
            />
            <FeatureWidget
              icon={<FaFileUpload size={40} />}
              title="Multi-Format Support"
              description="Process videos, audio, text, or files like PDFs and Word documents with ease."
              theme={theme}
            />
            <FeatureWidget
              icon={<FaMoon size={40} />}
              title="Dark Mode"
              description="Switch to a comfortable dark theme for learning in any environment."
              theme={theme}
            />
          </div>
        </section>
      </main>

      {/* How It Works Section */}
      <section className="py-16 px-6 bg-gray-100 dark:bg-gray-700">
        <h3 className={`text-4xl font-bold text-center ${theme === 'dark' ? 'text-purple-300' : 'text-purple-600'} mb-12`}>How It Works</h3>
        <div className="max-w-4xl mx-auto space-y-8 relative">
          <StepCard
            number="1"
            title="Drop Your Content"
            description="Upload a file, paste a URL, or type text to start the process."
            theme={theme}
          />
          <StepCard
            number="2"
            title="AI Does the Magic"
            description="Our AI creates transcripts, notes, and quizzes in seconds."
            theme={theme}
          />
          <StepCard
            number="3"
            title="Learn & Engage"
            description="Interact with your content, chat, and download resources."
            theme={theme}
          />
        </div>
      </section>

      {/* Perfect For Section */}
      <section className="py-16 px-6">
        <h3 className={`text-4xl font-bold text-center ${theme === 'dark' ? 'text-purple-300' : 'text-purple-600'} mb-12`}>Perfect For...</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <UseCaseCard
            icon={<FaUserGraduate size={32} />}
            title="Students"
            description="Turn lectures into study gold and ace your exams."
            theme={theme}
            offset="translate-y-4"
          />
          <UseCaseCard
            icon={<FaBriefcase size={32} />}
            title="Professionals"
            description="Master webinars and talks in record time."
            theme={theme}
            offset="-translate-y-4"
          />
          <UseCaseCard
            icon={<FaBrain size={32} />}
            title="Curious Minds"
            description="Explore any topic with AI-powered ease."
            theme={theme}
            offset="translate-y-4"
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-6 text-center">
        <h3 className={`text-4xl font-bold ${theme === 'dark' ? 'text-purple-300' : 'text-purple-600'} mb-6`}>Ready to Revolutionize Learning?</h3>
        <button
          onClick={onStart}
          className={`px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400 text-xl font-semibold transition-all duration-200 ${theme === 'dark' ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-purple-500 hover:bg-purple-600 text-white'} transform hover:scale-105`}
        >
          Start Your Journey!
        </button>
      </section>

      {/* Footer */}
      <footer className={`py-8 px-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'} text-center`}>
        <div className="flex justify-center space-x-6">
          <Link to="/about" className={`${theme === 'dark' ? 'text-gray-300 hover:text-purple-300' : 'text-gray-600 hover:text-purple-600'} font-medium`}>About Us</Link>
          <Link to="/contact" className={`${theme === 'dark' ? 'text-gray-300 hover:text-purple-300' : 'text-gray-600 hover:text-purple-600'} font-medium`}>Contact</Link>
          <Link to="/privacy" className={`${theme === 'dark' ? 'text-gray-300 hover:text-purple-300' : 'text-gray-600 hover:text-purple-600'} font-medium`}>Privacy</Link>
        </div>
        <p className={`mt-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>© 2025 learn-quickly.ai. All rights reserved.</p>
      </footer>
    </div>
  );
}

function FeatureWidget({ icon, title, description, theme }) {
  return (
    <div
      className={`flex flex-col items-center p-6 rounded-2xl shadow-lg ${theme === 'dark' ? 'bg-gray-800/50 text-gray-100 glassmorphism' : 'bg-white text-gray-900'
        } hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 hover:scale-105`}
      role="article"
      aria-label={`Feature: ${title}`}
    >
      <div className={`p-4 rounded-full mb-4 ${theme === 'dark' ? 'bg-purple-900/50 text-purple-300' : 'bg-purple-100 text-purple-600'}`}>
        {icon}
      </div>
      <h4 className="text-xl font-semibold text-center mb-3">{title}</h4>
      <p className={`text-center text-base ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{description}</p>
    </div>
  );
}

function StepCard({ number, title, description, theme }) {
  return (
    <div
      className={`relative flex items-start p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-800/50 text-gray-100 glassmorphism' : 'bg-white text-gray-900'
        } hover:scale-105 transition-all duration-300 animate-fade-in`}
      role="article"
      aria-label={`Step ${number}: ${title}`}
    >
      {/* Number Badge */}
      <div
        className={`flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full mr-4 ${theme === 'dark' ? 'bg-purple-900/50 text-purple-300' : 'bg-purple-100 text-purple-600'
          } text-2xl font-bold`}
      >
        {number}
      </div>
      {/* Content */}
      <div>
        <h4 className={`text-xl font-semibold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'} mb-2`}>{title}</h4>
        <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{description}</p>
      </div>
      {/* Connecting Line */}
      <div
        className={`absolute left-6 w-1 h-full bg-purple-300/30 dark:bg-purple-300/20 ${number === '3' ? 'hidden' : ''}`}
        style={{ top: '4rem' }}
      ></div>
    </div>
  );
}

function UseCaseCard({ icon, title, description, theme, offset }) {
  return (
    <div
      className={`p-6 rounded-xl shadow-lg ${theme === 'dark' ? 'bg-gray-800/50 text-gray-100 glassmorphism' : 'bg-white text-gray-900'
        } hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 animate-fade-in ${offset}`}
      role="article"
      aria-label={`Use Case: ${title}`}
    >
      <div
        className={`p-3 rounded-full mb-4 w-12 h-12 flex items-center justify-center ${theme === 'dark' ? 'bg-purple-900/50 text-purple-300' : 'bg-purple-100 text-purple-600'
          }`}
      >
        {icon}
      </div>
      <h4 className="text-xl font-semibold mb-2">{title}</h4>
      <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{description}</p>
    </div>
  );
}

export default LandingPage;