import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

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

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

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
        alert('No transcript found.');
      }
    } catch (err) {
      alert('Error fetching transcript.');
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
        <div key={idx} className="mb-4 border-l-4 border-purple-500 pl-4">
          <p className="font-semibold text-purple-400">{q}</p>
          <p className="text-gray-300 whitespace-pre-line">{a.join('\n')}</p>
        </div>
      );
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-4 py-2 text-gray-200 font-sans overflow-hidden">
      <div className="w-full px-4">
        <h1 className="text-center text-4xl font-bold text-purple-400 mb-2">QuickLearn.ai</h1>
        <p className="text-center text-lg text-gray-400 mb-2">AI-powered learning companion</p>
        <div className="bg-gray-800 shadow-lg rounded-2xl p-4 mb-4">
          <div className="flex gap-1 mb-4"> {/* Changed justify-between gap-2 to gap-1 */}
            {INPUT_TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setInputTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all duration-200 ${inputTab === tab ? 'bg-purple-600 text-white' : 'bg-gray-700 text-purple-400 border-purple-600'}`}
              >
                {tab}
              </button>
            ))}
          </div>
          {inputTab === 'Video' || inputTab === 'Audio' ? (
            <div className="flex gap-3">
              <input
                className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder={`Paste a ${inputTab} URL here...`}
                value={url}
                onChange={e => setUrl(e.target.value)}
              />
              <button
                className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-4 py-2 rounded-lg shadow-sm transition-all"
                onClick={handleGetTranscript}
              >
                Analyze
              </button>
            </div>
          ) : inputTab === 'Text' ? (
            <div>
              <textarea
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                rows={5}
                placeholder="Paste raw text here..."
                value={textInput}
                onChange={e => setTextInput(e.target.value)}
              />
              <div className="text-right mt-2">
                <button
                  className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-4 py-2 rounded-lg shadow-sm transition-all"
                  onClick={handleGetTranscript}
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
                className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                onChange={e => setFile(e.target.files[0])}
              />
              <button
                className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-4 py-2 rounded-lg shadow-sm transition-all"
                onClick={handleGetTranscript}
              >
                Upload & Extract
              </button>
            </div>
          )}
        </div>
        {loading && (
          <div className="flex justify-left items-center mb-2 text-purple-400">
            ⏳ Loading... please wait.
          </div>
        )}
        <div className="flex flex-col md:flex-row gap-4 h-[calc(100vh-15rem)]">
          <div className="w-full md:w-3/5 flex flex-col bg-gray-800 shadow-md border border-gray-700 rounded-2xl p-4">
            <div className="flex flex-wrap gap-2 items-center mb-2">
              {OUTPUT_TABS.map(tab => (
                <div key={tab} className="flex items-center gap-1">
                  <button
                    onClick={() => setOutputTab(tab)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all duration-200 ${outputTab === tab ? 'bg-green-600 text-white' : 'bg-gray-700 text-green-400 border-green-600'}`}
                  >
                    {tab}
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
                    className="ml-auto bg-purple-600 text-white px-2 py-1 rounded hover:bg-purple-700"
                    title="Download PDF"
                  >
                    ⬇️
                  </button>
                  <div className="flex flex-col items-center relative">
                    <button
                      onClick={copyRenderedContent}
                      className="bg-purple-600 text-white px-2 py-1 rounded hover:bg-purple-700"
                      title="Copy content with formatting"
                    >
                      📄
                    </button>
                    {copied && (
                      <span className="text-xs text-green-400 mt-1">
                        Copied!
                      </span>
                    )}
                  </div>

                  {(outputTab === 'Notes' || outputTab === 'Quiz') && (
                    <button
                      onClick={() => handleRefresh(outputTab)}
                      className="bg-purple-600 text-white px-2 py-1 rounded hover:bg-purple-700"
                      title={`Refresh ${outputTab}`}
                    >
                      🔄
                    </button>
                  )}
                </>
              ) : null}
            </div>

            <div className="flex-1 overflow-auto border border-gray-700 rounded-md p-3 bg-gray-900 shadow-inner text-sm prose max-w-none" id="output-container">
              {outputTab === 'Transcript' && (
                <p id="transcript-content" className="text-gray-400 whitespace-pre-wrap">
                  {transcript || 'Your transcript will appear here once processed.'}
                </p>
              )}
              {outputTab === 'Notes' && summary && (() => {
                const cleanedSummary = summary.replace(/^#{1,6}\s*$/gm, '');

                return (
                  <div id="notes-content" className="prose prose-invert dark:prose-dark max-w-none text-gray-200">
                    <ReactMarkdown
                      remarkPlugins={[remarkMath]}
                      rehypePlugins={[rehypeKatex]}
                      components={{
                        h1: ({ node, children, ...props }) =>
                          children && children.length > 0 ? <h1 className="text-gray-200 bg-gray-800 p-2 mb-2" {...props}>{children}</h1> : null,
                        h2: ({ node, children, ...props }) =>
                          children && children.length > 0 ? <h2 className="text-gray-200 bg-gray-800 p-2 mb-2" {...props}>{children}</h2> : null,
                        h3: ({ node, children, ...props }) =>
                          children && children.length > 0 ? <h3 className="text-gray-200 bg-gray-800 p-2 mb-2" {...props}>{children}</h3> : null,
                        h4: ({ node, children, ...props }) =>
                          children && children.length > 0 ? <h4 className="text-gray-200 bg-gray-800 p-2 mb-2" {...props}>{children}</h4> : null,
                        h5: ({ node, children, ...props }) =>
                          children && children.length > 0 ? <h5 className="text-gray-200 bg-gray-800 p-2 mb-2" {...props}>{children}</h5> : null,
                        h6: ({ node, children, ...props }) =>
                          children && children.length > 0 ? <h6 className="text-gray-200 bg-gray-800 p-2 mb-2" {...props}>{children}</h6> : null,
                      }}
                    >
                      {cleanedSummary}
                    </ReactMarkdown>
                  </div>
                );
              })()}

              {outputTab === 'Quiz' && qnaText && (
                <div id="quiz-content">
                  {renderQna()}
                </div>
              )}
            </div>
          </div>

          <div className="w-full md:w-2/5 flex flex-col bg-gray-800 shadow-md border border-gray-700 rounded-2xl p-4">
            <div className="mb-4 relative">
              <div className="flex gap-2">
                <input
                  className="flex-1 h-11 bg-gray-700 border border-gray-600 px-4 rounded-md text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                />
                <button
                  disabled={!chatInput.trim()}
                  className={`h-11 px-6 rounded-md text-sm font-semibold transition-colors ${chatInput.trim()
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    }`}
                  onClick={handleChatSubmit}
                >
                  Send
                </button>
              </div>

              {showDropdown && suggestedData.length > 0 && (
                <div className="absolute z-10 w-full max-h-60 overflow-auto bg-gray-800 shadow-lg rounded-md mt-1 border border-gray-700">
                  {suggestedData.map((item, idx) => (
                    <div key={idx} className="border-b border-gray-700 px-3 py-2">
                      <div
                        className="font-semibold text-purple-400 cursor-pointer"
                        onClick={() => setChatInput(item.topic)}
                      >
                        {item.topic}
                      </div>
                      <div
                        className="pl-4 text-sm text-gray-300 cursor-pointer hover:underline"
                        onClick={() => setChatInput(item.question)}
                      >
                        {item.question}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex-1 overflow-auto border border-gray-700 rounded-md p-3 bg-gray-900 shadow-inner" ref={chatContainerRef}>
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
                      <div className="text-right text-purple-400 bg-purple-900 px-3 py-2 rounded-lg mb-1 inline-block max-w-full prose text-sm">
                        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                          {pair.userMsg.content}
                        </ReactMarkdown>
                      </div>
                    )}
                    {pair.botMsg && (
                      <div className="text-left text-gray-200 bg-gray-800 px-3 py-2 rounded-lg inline-block max-w-full prose text-sm">
                        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
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
  );
}