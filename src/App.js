import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { FaMoon, FaSun } from 'react-icons/fa';

const INPUT_TABS = ['Video', 'Audio', 'Text', 'File'];
const OUTPUT_TABS = ['Transcript', 'Notes', 'Quiz'];

export default function App() {
  const [inputTab, setInputTab] = useState('Video');
  const [outputTab, setOutputTab] = useState('Transcript');
  const [url, setUrl] = useState('');
  const [textInput, setTextInput] = useState('');
  const [file, setFile] = useState(null);
  const [transcript, setTranscript] = useState('');
  const [summary, setSummary] = useState('');
  const [summaryCompleted, setSummaryCompleted] = useState(false);
  const [qnaText, setQnaText] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatResponse, setChatResponse] = useState('');
  const [topicTitle, setTopicTitle] = useState('QuickLearn');
  const [chatLoading, setChatLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [suggestedData, setSuggestedData] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    // Removed auto-focus
  }, []);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'dark' ? 'light' : 'dark'));
  };

  const copyRenderedContent = async () => {
    const elementId =
      outputTab === 'Notes' ? 'notes-content' :
      outputTab === 'Quiz' ? 'quiz-content' :
      'transcript-content';

    const el = document.getElementById(elementId);
    if (!el) return;

    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/plain': new Blob([el.innerText], { type: 'text/plain' }),
          'text/html': new Blob([el.innerHTML], { type: 'text/html' })
        })
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      const range = document.createRange();
      range.selectNodeContents(el);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);

      try {
        const success = document.execCommand('copy');
        if (success) {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } else throw new Error();
      } catch {
        alert("❌ Failed to copy. Try Ctrl+C manually.");
      }
      selection.removeAllRanges();
    }
  };

  const handleGetTranscript = async () => {
    setLoading(true);
    setTranscript('');
    setChatHistory([]);
    setChatResponse('');
    setChatInput('');
    setSuggestedData([]);
    setSummary('');
    setQnaText('');
    try {
      let res;
      if (inputTab === 'Video') {
        let normalizedUrl = url;
        const matchLive = url.match(/youtube\.com\/live\/([a-zA-Z0-9_-]{11})/);
        if (matchLive) {
          normalizedUrl = `https://www.youtube.com/watch?v=${matchLive[1]}`;
        }
        res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/transcript`, { params: { url: normalizedUrl } });
      } else if (inputTab === 'Audio') {
        res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/transcribe-audio`, { params: { url } });
      } else if (inputTab === 'Text') {
        setTranscript(textInput);
        setOutputTab('Transcript');
        setLoading(false);
        return;
      } else if (inputTab === 'File') {
        const formData = new FormData();
        formData.append('file', file);
        res = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/upload`, formData);
      }
      if (res && res.data.transcript) {
        setTranscript(res.data.transcript);
        setTopicTitle(res.data.title || 'QuickLearn');
        setOutputTab('Transcript');
      } else {
        alert('No transcript found or failed to extract data.');
      }
    } catch (err) {
      alert('Error fetching transcript. Please check the URL or try again later.');
    }
    setLoading(false);
  };

  const streamOutput = useCallback(async (type, force = false) => {
    setSummaryCompleted(false);
    if (!transcript) return;

    const url = type === 'summary' ? '/summarize-stream' : '/qna-stream';
    const setter = type === 'summary' ? setSummary : setQnaText;
    const value = type === 'summary' ? summary : qnaText;
    if (!force && value) return;

    setter('');
    setLoading(true);
    try {
      const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}${url}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, refresh: force, use_openai: true })
      });

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let done = false;
      let content = '';

      while (!done) {
        const { value, done: isDone } = await reader.read();
        if (value) {
          const text = decoder.decode(value);
          content += text;
          setter(prev => prev + text);
        }
        done = isDone;
      }

      if (type === 'summary') {
        setSummary(content);
        setSummaryCompleted(true);
      }
    } catch (err) {
      alert(`Error generating ${type}`);
    }
    setLoading(false);
    setSummaryCompleted(true);
  }, [transcript, summary, qnaText]);

  const handleChatSubmit = async (customMessage = null) => {
    const input = (typeof customMessage === 'string' ? customMessage : chatInput).trim();
    if (!input) return;

    const newHistory = [...chatHistory, { role: 'user', content: input }];
    setChatHistory(newHistory);
    setChatInput('');
    setChatResponse('');
    setChatLoading(true);

    try {
      const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/chat-on-topic`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary, chatHistory: newHistory })
      });
      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let done = false;
      let answer = '';

      while (!done) {
        const { value, done: isDone } = await reader.read();
        if (value) {
          const text = decoder.decode(value);
          answer += text;
          setChatResponse(answer);
        }
        done = isDone;
      }

      setChatHistory(prev => [...prev, { role: 'assistant', content: answer }]);
    } catch (err) {
      setChatResponse("❌ Unable to respond.");
    }
    setChatLoading(false);
  };

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = 0;
    }
  }, [chatHistory]);

  useEffect(() => {
    if (outputTab === 'Notes') streamOutput('summary');
    if (outputTab === 'Quiz') streamOutput('qna');
  }, [outputTab, streamOutput]);

  const prevSummaryRef = useRef('');

  useEffect(() => {
    const trimmedSummary = summary?.trim();

    if (
      summaryCompleted &&
      trimmedSummary &&
      trimmedSummary !== prevSummaryRef.current &&
      !suggestionsLoading
    ) {
      prevSummaryRef.current = trimmedSummary;
      setSuggestionsLoading(true);

      fetch(`${process.env.REACT_APP_API_BASE_URL}/suggested-questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary: trimmedSummary })
      })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data.questions)) {
            setSuggestedData(data.questions);
          }
        })
        .catch(err => console.error("❌ Error loading suggestions", err))
        .finally(() => setSuggestionsLoading(false));
    }
  }, [summaryCompleted, summary, suggestionsLoading]);

  const handleRefresh = (tab) => {
    if (tab === 'Notes') streamOutput('summary', true);
    if (tab === 'Quiz') streamOutput('qna', true);
  };

  const renderQna = () => {
    const blocks = qnaText.split(/\n{2,}/).filter(Boolean);
    return blocks.map((block, idx) => {
      const [q, ...a] = block.split('\n');
      return (
        <div key={idx} className="mb-4 border-l-4 border-purple-400 pl-4">
          <p className="font-semibold text-purple-300">{q}</p>
          <p className="whitespace-pre-line">{a.join('\n')}</p>
        </div>
      );
    });
  };

  return (
    <div className={`${theme === 'dark' ? 'dark bg-gray-800' : 'bg-gradient-to-br from-gray-50 via-purple-50/50 to-gray-50'} min-h-screen font-inter`}>
      <div className={`min-h-screen ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'} overflow-hidden px-4 sm:px-6 lg:px-8 py-6`}>
        <button
          onClick={toggleTheme}
          className={`fixed top-4 right-4 p-2 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110 ${theme === 'dark' ? 'bg-gray-800 text-yellow-400' : 'bg-white text-gray-800'}`}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <FaSun size={24} /> : <FaMoon size={24} />}
        </button>
        <div className="w-full max-w-7xl mx-auto">
          <h1 className={`text-5xl font-extrabold text-center ${theme === 'dark' ? 'text-purple-300' : 'text-purple-600'} mb-3 tracking-tight`}>learn-quickly.ai</h1>
          <p className={`text-xl text-center ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mb-6 font-medium`}>Your AI-powered learning companion</p>
          <div className={`shadow-2xl rounded-2xl p-6 glassmorphism ${theme === 'dark' ? 'bg-gray-800/30' : 'bg-white/50'}`}>
            <div className="flex gap-3 mb-6 relative">
              {INPUT_TABS.map(tab => (
                <button
                  key={tab}
                  onClick={() => setInputTab(tab)}
                  className={`relative px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ease-in-out ${
                    inputTab === tab
                      ? `${theme === 'dark' ? 'bg-purple-600 text-white' : 'bg-purple-500 text-white'}`
                      : `${theme === 'dark' ? 'bg-gray-800/50 text-purple-300 hover:bg-gray-700/50' : 'bg-gray-200 text-purple-600 hover:bg-gray-300'}`
                  }`}
                  aria-label={`Select ${tab} input`}
                >
                  {tab}
                  {inputTab === tab && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-400 transform scale-x-100 transition-transform duration-300" />
                  )}
                </button>
              ))}
            </div>
            {inputTab === 'Video' || inputTab === 'Audio' ? (
              <div className="flex gap-3">
                <input
                  className={`flex-1 px-5 py-3 ${theme === 'dark' ? 'bg-gray-800/50 border-gray-700 text-gray-100 placeholder-gray-400' : 'bg-white/50 border-gray-300 text-gray-900 placeholder-gray-500'} rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all duration-300`}
                  placeholder={`Paste a ${inputTab} URL here...`}
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  aria-label={`Enter ${inputTab} URL`}
                />
                <button
                  className={`font-semibold px-5 py-3 rounded-xl shadow-sm transition-all duration-300 ${theme === 'dark' ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-purple-500 hover:bg-purple-600 text-white'}`}
                  onClick={handleGetTranscript}
                  aria-label="Analyze input"
                >
                  Analyze
                </button>
              </div>
            ) : inputTab === 'Text' ? (
              <div>
                <textarea
                  className={`w-full px-5 py-3 ${theme === 'dark' ? 'bg-gray-800/50 border-gray-700 text-gray-100 placeholder-gray-400' : 'bg-white/50 border-gray-300 text-gray-900 placeholder-gray-500'} rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all duration-300`}
                  rows={3}
                  placeholder="Paste raw text here..."
                  value={textInput}
                  onChange={e => setTextInput(e.target.value)}
                  aria-label="Enter text input"
                />
                <div className="text-right mt-3">
                  <button
                    className={`font-semibold px-5 py-3 rounded-xl shadow-sm transition-all duration-300 ${theme === 'dark' ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-purple-500 hover:bg-purple-600 text-white'}`}
                    onClick={handleGetTranscript}
                    aria-label="Submit text"
                  >
                    Submit Text
                  </button>
                </div>
              </div>
            ) : inputTab === 'File' && (
              <div className="flex gap-3">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  className={`flex-1 px-5 py-3 ${theme === 'dark' ? 'bg-gray-800/50 border-gray-700 text-gray-100' : 'bg-white/50 border-gray-300 text-gray-900'} rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all duration-300`}
                  onChange={e => setFile(e.target.files[0])}
                  aria-label="Upload file"
                />
                <button
                  className={`font-semibold px-5 py-3 rounded-xl shadow-sm transition-all duration-300 ${theme === 'dark' ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-purple-500 hover:bg-purple-600 text-white'}`}
                  onClick={handleGetTranscript}
                  aria-label="Upload and extract"
                >
                  Upload & Extract
                </button>
              </div>
            )}
            {loading && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
                <div className="flex flex-col items-center justify-center p-8 rounded-2xl glassmorphism">
                  <div className="w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-white text-lg font-medium mt-4">Processing...</p>
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-col md:flex-row gap-4 h-[calc(100vh-16rem)] sm:h-[calc(100vh-18rem)] mt-6">
            <div className={`w-full md:w-3/5 flex flex-col shadow-2xl rounded-2xl p-6 glassmorphism ${theme === 'dark' ? 'bg-gray-800/30 border-gray-700' : 'bg-white/50 border-gray-300'} overflow-auto custom-scrollbar`}>
              <div className="flex flex-wrap gap-3 items-center mb-4">
                {OUTPUT_TABS.map(tab => (
                  <div key={tab} className="flex items-center gap-2">
                    <button
                      onClick={() => setOutputTab(tab)}
                      className={`relative px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ease-in-out ${outputTab === tab ? (theme === 'dark' ? 'bg-green-600 text-white' : 'bg-green-500 text-white') : (theme === 'dark' ? 'bg-gray-800/50 text-green-300 hover:bg-gray-700/50' : 'bg-gray-200 text-green-600 hover:bg-gray-300')}`}
                      aria-label={`Select ${tab} output`}
                    >
                      {tab}
                      {outputTab === tab && (
                        <span className="absolute bottom-0 left-0 w-full h-0.5 bg-green-400 transform scale-x-100 transition-transform duration-300" />
                      )}
                    </button>
                  </div>
                ))}
                {(outputTab === 'Notes' && summary) || (outputTab === 'Quiz' && qnaText) || (outputTab === 'Transcript' && transcript) ? (
                  <>
                    <button
                      onClick={() => {
                        const content = outputTab === 'Notes' ? summary : outputTab === 'Quiz' ? qnaText : transcript;
                        const label = outputTab;
                        const topicTitle = transcript.split(" ").slice(0, 4).join("_").replace(/[^a-zA-Z0-9_]/g, "");
                        const doc = new jsPDF();
                        const lines = doc.splitTextToSize(content, 180);
                        let y = 10;
                        lines.forEach(line => {
                          if (y > 270) {
                            doc.addPage();
                            y = 10;
                          }
                          doc.text(line, 10, y);
                          y += 10;
                        });
                        doc.save(`${topicTitle || 'QuickLearn'}_${label}.pdf`);
                      }}
                      className={`ml-auto px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${theme === 'dark' ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-purple-500 hover:bg-purple-600 text-white'}`}
                      title="Download PDF"
                      aria-label="Download as PDF"
                    >
                      ⬇️ PDF
                    </button>
                    <div className="flex flex-col items-center relative">
                      <button
                        onClick={copyRenderedContent}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${theme === 'dark' ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-purple-500 hover:bg-purple-600 text-white'}`}
                        title="Copy content with formatting"
                        aria-label="Copy content"
                      >
                        📄 Copy
                      </button>
                      {copied && (
                        <span className={`text-xs ${theme === 'dark' ? 'text-green-400' : 'text-green-600'} mt-1 animate-fade-in`}>
                          Copied!
                        </span>
                      )}
                    </div>
                    {(outputTab === 'Notes' || outputTab === 'Quiz') && (
                      <button
                        onClick={() => handleRefresh(outputTab)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${theme === 'dark' ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-purple-500 hover:bg-purple-600 text-white'}`}
                        title={`Refresh ${outputTab}`}
                        aria-label={`Refresh ${outputTab}`}
                      >
                        🔄 Refresh
                      </button>
                    )}
                  </>
                ) : null}
              </div>
              <div className="flex-1 overflow-auto rounded-xl p-4 shadow-inner text-base prose max-w-none custom-scrollbar bg-opacity-50 transition-all duration-300" id="output-container">
                {outputTab === 'Transcript' && (
                  <p id="transcript-content" className={`whitespace-pre-wrap ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                    {transcript || 'Your transcript will appear here once processed.'}
                  </p>
                )}
                {outputTab === 'Notes' && summary && (() => {
                  const cleanedSummary = summary.replace(/^#{1,6}\s*$/gm, '');
                  return (
                    <div id="notes-content" className={`prose max-w-none ${theme === 'dark' ? 'prose-invert dark:prose-dark text-gray-100' : 'text-gray-900'}`}>
                      <ReactMarkdown
                        remarkPlugins={[remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                        components={{
                          h1: ({ node, children, ...props }) =>
                            children && children.length > 0 ? <h1 className={`p-2 mb-2 ${theme === 'dark' ? 'text-gray-100 bg-gray-800/50' : 'text-gray-900 bg-gray-200/50'}`} {...props}>{children}</h1> : null,
                          h2: ({ node, children, ...props }) =>
                            children && children.length > 0 ? <h2 className={`p-2 mb-2 ${theme === 'dark' ? 'text-gray-100 bg-gray-800/50' : 'text-gray-900 bg-gray-200/50'}`} {...props}>{children}</h2> : null,
                          h3: ({ node, children, ...props }) =>
                            children && children.length > 0 ? <h3 className={`p-2 mb-2 ${theme === 'dark' ? 'text-gray-100 bg-gray-800/50' : 'text-gray-900 bg-gray-200/50'}`} {...props}>{children}</h3> : null,
                          h4: ({ node, children, ...props }) =>
                            children && children.length > 0 ? <h4 className={`p-2 mb-2 ${theme === 'dark' ? 'text-gray-100 bg-gray-800/50' : 'text-gray-900 bg-gray-200/50'}`} {...props}>{children}</h4> : null,
                          h5: ({ node, children, ...props }) =>
                            children && children.length > 0 ? <h5 className={`p-2 mb-2 ${theme === 'dark' ? 'text-gray-100 bg-gray-800/50' : 'text-gray-900 bg-gray-200/50'}`} {...props}>{children}</h5> : null,
                          h6: ({ node, children, ...props }) =>
                            children && children.length > 0 ? <h6 className={`p-2 mb-2 ${theme === 'dark' ? 'text-gray-100 bg-gray-800/50' : 'text-gray-900 bg-gray-200/50'}`} {...props}>{children}</h6> : null,
                          strong: ({ node, children, ...props }) =>
                            <strong className={`${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`} {...props}>{children}</strong>,
                        }}
                      >
                        {cleanedSummary}
                      </ReactMarkdown>
                    </div>
                  );
                })()}
                {outputTab === 'Quiz' && qnaText && (
                  <div id="quiz-content" className={`text-base ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                    {renderQna()}
                  </div>
                )}
              </div>
            </div>
            <div className={`w-full md:w-2/5 flex flex-col shadow-2xl rounded-2xl p-6 glassmorphism ${theme === 'dark' ? 'bg-gray-800/30 border-gray-700' : 'bg-white/50 border-gray-300'} overflow-auto custom-scrollbar h-full`}>
              <div className="relative">
                <div className="flex gap-3 mb-2">
                  <input
                    className={`flex-1 h-12 px-5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all duration-300 ${theme === 'dark' ? 'bg-gray-800/50 border-gray-700 text-gray-100 placeholder-gray-400' : 'bg-white/50 border-gray-300 text-gray-900 placeholder-gray-500'}`}
                    placeholder="💡 Ask anything about the content..."
                    value={chatInput}
                    ref={inputRef}
                    onChange={e => {
                      setChatInput(e.target.value);
                      setShowDropdown(true);
                    }}
                    onFocus={() => setShowDropdown(true)}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleChatSubmit();
                    }}
                    aria-label="Ask a question about the content"
                  />
                  <button
                    disabled={!chatInput.trim()}
                    className={`h-12 px-6 rounded-xl text-sm font-semibold transition-all duration-300 ${chatInput.trim()
                      ? `${theme === 'dark' ? 'bg-purple-600 text-white hover:bg-purple-700' : 'bg-purple-500 text-white hover:bg-purple-600'}`
                      : `${theme === 'dark' ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-gray-400 text-gray-600 cursor-not-allowed'}`}`}
                    onClick={handleChatSubmit}
                    aria-label="Submit question"
                  >
                    Send
                  </button>
                </div>
                {showDropdown && suggestedData.length > 0 && (
                  <div className="absolute z-20 w-full max-h-64 overflow-auto shadow-xl rounded-xl mt-1 glassmorphism" style={{ top: '100%' }}>
                    <div className={`${theme === 'dark' ? 'bg-gray-800/70 border-gray-700' : 'bg-white/70 border-gray-300'} animate-fade-in`}>
                      {suggestedData.map((item, idx) => (
                        <div key={idx} className={`border-b px-4 py-3 transition-all duration-200 hover:bg-purple-500/20 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-300'}`}>
                          <div
                            className={`font-semibold cursor-pointer ${theme === 'dark' ? 'text-white' : 'text-purple-600'}`}
                            onClick={() => setChatInput(item.topic)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={e => { if (e.key === 'Enter') setChatInput(item.topic); }}
                          >
                            {item.topic}
                          </div>
                          <div
                            className={`pl-4 text-sm cursor-pointer hover:underline ${theme === 'dark' ? 'text-gray-100' : 'text-gray-600'}`}
                            onClick={() => setChatInput(item.question)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={e => { if (e.key === 'Enter') setChatInput(item.question); }}
                          >
                            {item.question}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className={`flex-1 overflow-auto rounded-xl p-4 shadow-inner custom-scrollbar ${showDropdown ? 'mt-72' : ''}`} ref={chatContainerRef}>
                {(() => {
                  const grouped = [];
                  for (let i = 0; i < chatHistory.length; i += 2) {
                    const userMsg = chatHistory[i];
                    const botMsg = chatHistory[i + 1];
                    grouped.push({ userMsg, botMsg });
                  }
                  return grouped.reverse().map((pair, i) => (
                    <div key={i} className="mb-4">
                      {pair.userMsg && (
                        <div className={`text-right px-4 py-2 rounded-lg mb-1 inline-block max-w-full prose text-sm ${theme === 'dark' ? 'text-purple-300 bg-purple-900/50' : 'text-purple-600 bg-purple-200/50'}`}>
                          <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}
                            components={{
                              strong: ({ node, children, ...props }) =>
                                <strong className={`${theme === 'dark' ? 'text-purple-300' : 'text-purple-600'}`} {...props}>{children}</strong>,
                            }}
                          >
                            {pair.userMsg.content}
                          </ReactMarkdown>
                        </div>
                      )}
                      {pair.botMsg && (
                        <div className={`text-left px-4 py-2 rounded-lg inline-block max-w-full prose text-sm ${theme === 'dark' ? 'text-gray-100 bg-gray-800/50' : 'text-gray-900 bg-gray-200/50'}`}>
                          <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}
                            components={{
                              strong: ({ node, children, ...props }) =>
                                <strong className={`${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`} {...props}>{children}</strong>,
                            }}
                          >
                            {pair.botMsg.content}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}