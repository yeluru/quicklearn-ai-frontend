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

export default function MainApp({ theme, toggleTheme }) {
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
    const [progress, setProgress] = useState(0);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [rightPanelTab, setRightPanelTab] = useState('Video');
    const [embedUrl, setEmbedUrl] = useState('');
    const [videoSummary, setVideoSummary] = useState('');
    const [isTranscriptComplete, setIsTranscriptComplete] = useState(false);
    const [lastVideoId, setLastVideoId] = useState('');

    useEffect(() => {
        // Removed auto-focus
    }, []);

    useEffect(() => {
        if (transcript && embedUrl && isTranscriptComplete && inputTab === 'Video') {
            const videoId = extractVideoId(embedUrl);
            if (videoId && videoId !== lastVideoId) {
                const fetchVideoSummary = async () => {
                    try {
                        const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/summary/summarize-video`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ transcript: transcript.slice(0, 10000), url: embedUrl })
                        });
                        if (!response.ok) {
                            throw new Error(`HTTP ${response.status}: ${await response.text()}`);
                        }
                        const data = await response.json();
                        setVideoSummary(data.summary || 'No summary available.');
                        setLastVideoId(videoId);
                    } catch (error) {
                        console.error('Error fetching video summary:', error.message);
                        setVideoSummary(transcript.slice(0, 200).replace(/\n\s*\n/g, ' ') + '...');
                        setLastVideoId(videoId);
                    }
                };
                fetchVideoSummary();
            }
        }
    }, [transcript, embedUrl, isTranscriptComplete, lastVideoId, inputTab]);

    const getEmbedUrl = (url) => {
        try {
            if (!url || !url.trim() || !url.match(/^https?:\/\//)) {
                return '';
            }
            const urlObj = new URL(url);
            if (urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be')) {
                const videoId = extractVideoId(url);
                return videoId ? `https://www.youtube.com/embed/${videoId}` : '';
            } else if (urlObj.hostname.includes('ted.com')) {
                const talkId = urlObj.pathname.match(/talks\/([^/?]+)/)?.[1];
                return talkId ? `https://embed.ted.com/talks/${talkId}` : '';
            } else if (urlObj.hostname.includes('instagram.com')) {
                const shortCode = urlObj.pathname.match(/reel\/([A-Za-z0-9_-]+)/)?.[1] || urlObj.pathname.match(/p\/([A-Za-z0-9_-]+)/)?.[1];
                return shortCode ? `https://www.instagram.com/reel/${shortCode}/embed` : '';
            } else if (urlObj.hostname.includes('tiktok.com')) {
                const videoId = urlObj.pathname.match(/@[^/]+\/video\/(\d+)/)?.[1];
                return videoId ? `https://www.tiktok.com/embed/${videoId}` : '';
            } else if (urlObj.hostname.includes('vimeo.com')) {
                const videoId = urlObj.pathname.match(/\/(\d+)/)?.[1];
                return videoId ? `https://player.vimeo.com/video/${videoId}` : '';
            }
            return '';
        } catch (e) {
            console.error('Invalid URL:', url, e);
            return '';
        }
    };

    const extractVideoId = (url) => {
        const urlObj = new URL(url);
        const videoId = urlObj.searchParams.get('v') || urlObj.pathname.split('/').pop();
        return videoId || '';
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
        setInputTab('Video');
        setOutputTab('Transcript');
        if (inputTab === 'Text' || inputTab === 'File') {
            setUrl('');
        }
        setTextInput('');
        setFile(null);
        setTranscript('');
        setSummary('');
        setQnaText('');
        setChatInput('');
        setChatResponse('');
        setChatHistory([]);
        setSuggestedData([]);
        setTopicTitle('QuickLearn');
        setCopied(false);
        setShowDropdown(false);
        setLoading(true);
        setLoadingMessage('Extracting transcript...');
        setProgress(0);
        setSummaryCompleted(false);
        setChatLoading(false);
        setSuggestionsLoading(false);
        setIsTranscriptComplete(false); // Reset transcript completion
        setVideoSummary(''); // Reset video summary
        setLastVideoId(''); // Reset last video ID

        try {
            const embedUrl = getEmbedUrl(url);
            setEmbedUrl(embedUrl);

            if (inputTab === 'Text') {
                setTranscript(textInput);
                setOutputTab('Transcript');
                setLoading(false);
                setLoadingMessage('');
                setProgress(0);
                setIsTranscriptComplete(true);
                return;
            }

            if (inputTab === 'File') {
                const formData = new FormData();
                formData.append('file', file);
                const interval = setInterval(() => {
                    setProgress(prev => {
                        if (prev >= 90) {
                            clearInterval(interval);
                            return prev;
                        }
                        return prev + 10;
                    });
                }, 300);
                const res = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/transcript/upload`, formData);
                clearInterval(interval);
                if (res?.data?.transcript) {
                    setTranscript(res.data.transcript);
                    setTopicTitle(res.data.title || 'QuickLearn');
                    setOutputTab('Transcript');
                    setProgress(100);
                    setIsTranscriptComplete(true);
                } else {
                    alert('No transcript found or failed to extract data.');
                    setIsTranscriptComplete(true);
                }
                setLoading(false);
                setLoadingMessage('');
                setProgress(0);
                return;
            }

            let endpoint = '/transcript/stream';
            let normalizedUrl = url;
            if (inputTab === 'Video') {
                const matchLive = url.match(/youtube\.com\/live\/([a-zA-Z0-9_-]{11})/);
                if (matchLive) {
                    normalizedUrl = `https://www.youtube.com/watch?v=${matchLive[1]}`;
                }
            }
            const requestBody = JSON.stringify({ url: normalizedUrl });

            const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: requestBody
            });

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let done = false;
            let fullTranscript = '';

            while (!done) {
                const { value, done: isDone } = await reader.read();
                if (value) {
                    const chunk = decoder.decode(value);
                    const lines = chunk.split('\n').filter(line => line.trim());

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const jsonStr = line.replace('data: ', '');
                            try {
                                const data = JSON.parse(jsonStr);
                                if (data.type === 'title') {
                                    setTopicTitle(data.content || 'QuickLearn');
                                } else if (data.type === 'transcript_chunk') {
                                    fullTranscript += data.content + ' ';
                                    setTranscript(fullTranscript.trim());
                                } else if (data.type === 'progress') {
                                    setProgress(prev => Math.min(prev + 10, 90));
                                } else if (data.type === 'complete') {
                                    setTranscript(fullTranscript.trim());
                                    setProgress(100);
                                    setIsTranscriptComplete(true); // Mark transcript complete
                                } else if (data.type === 'error') {
                                    throw new Error(data.message || 'Unknown streaming error');
                                }
                            } catch (parseError) {
                                console.warn('Failed to parse chunk as JSON:', parseError);
                                fullTranscript += chunk.replace('data: ', '') + ' ';
                                setTranscript(fullTranscript.trim());
                            }
                        }
                    }
                }
                done = isDone;
            }

            if (fullTranscript.trim()) {
                setOutputTab('Transcript');
            } else {
                alert('No transcript extracted. Please check the URL and try again.');
                setIsTranscriptComplete(true);
            }
        } catch (err) {
            console.error('Transcript streaming error:', err);
            alert(`Failed to fetch transcript: ${err.message}. Please try again.`);
            setIsTranscriptComplete(true);
        } finally {
            setLoading(false);
            setLoadingMessage('');
            setProgress(0);
        }
    };

    const streamOutput = useCallback(async (type, force = false) => {
        setSummaryCompleted(false);
        if (!transcript) return;
        const url = type === 'summary' ? '/summary/summarize-stream' : '/summary/qna-stream';
        const setter = type === 'summary' ? setSummary : setQnaText;
        const value = type === 'summary' ? summary : qnaText;
        if (!force && value) return;
        setter('');
        setLoading(true);
        setLoadingMessage(type === 'summary' ? 'Preparing summary...' : 'Preparing Quiz...');
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 90) {
                    clearInterval(interval);
                    return prev;
                }
                return prev + 10;
            });
        }, 300);
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
                setSummaryCompleted(true); // Ensure this is set
            }
            setProgress(100);
        } catch (err) {
            alert(`Error generating ${type}`);
        }
        clearInterval(interval);
        setLoading(false);
        setLoadingMessage('');
        setProgress(0);
        setSummaryCompleted(true); // Double-check completion
    }, [transcript, summary, qnaText]);

    const handleChatSubmit = useCallback(async (customMessage = null) => {
        const input = (typeof customMessage === 'string' ? customMessage : chatInput).trim();
        if (!input || chatLoading) return;
        if (handleChatSubmit.lastInput === input && chatLoading) return;
        handleChatSubmit.lastInput = input;
        console.log(`Submitting chat: ${input}`);
        const newHistory = [...chatHistory, { role: 'user', content: input }];
        setChatHistory(newHistory);
        setChatInput('');
        setChatResponse('');
        setChatLoading(true);
        setShowDropdown(false);
        try {
            const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/chat/on-topic`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ summary, chatHistory: newHistory })
            });
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}: ${await res.text()}`);
            }
            console.log('Received response from /chat/on-topic');
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
            console.log(`Assistant response added: ${answer.slice(0, 50)}...`);
        } catch (err) {
            console.error('Chat error:', err.message);
            setChatResponse("❌ Unable to respond.");
            setChatHistory(prev => [...prev, { role: 'assistant', content: "❌ Unable to respond." }]);
        } finally {
            setChatLoading(false);
            handleChatSubmit.lastInput = null;
        }
    }, [chatHistory, chatInput, chatLoading, summary]);

    // Initialize the static property outside the function
    handleChatSubmit.lastInput = null;

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = 0; // Scroll to top
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
            fetch(`${process.env.REACT_APP_API_BASE_URL}/chat/suggested-questions`, {
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
                .catch(err => console.error("Error loading suggestions", err))
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
            const lines = block.split('\n');
            let cleanedQuestion = '';
            let cleanedAnswer = '';

            // Find the question (first line starting with ###) and clean it
            const questionLine = lines.find(line => line.trim().startsWith('###'));
            if (questionLine) {
                cleanedQuestion = questionLine
                    .replace(/^###\s*Question\s*/, '')
                    .replace(/\*\*Answer:\*\*/g, '') // Remove **Answer:** from question
                    .trim();
            }

            // Collect and clean the answer (remaining lines)
            const answerLines = lines.filter(line => !line.trim().startsWith('###'));
            cleanedAnswer = answerLines
                .join('\n')
                .replace(/\*\*Answer:\*\*/g, '') // Remove **Answer:** from answer
                .trim();

            return (
                <div key={idx} className="transition-all duration-200 hover:bg-gray-800/30 p-1 rounded-lg mb-4">
                    <p className={`font-bold text-xl ${theme === 'dark' ? 'text-purple-300' : 'text-purple-600'} m-0 p-1 bg-opacity-20 ${theme === 'dark' ? 'bg-purple-900' : 'bg-purple-200'} rounded-md`}>{cleanedQuestion}</p>
                    <p className={`font-normal text-base whitespace-pre-line ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'} m-0`}>{cleanedAnswer}</p>
                </div>
            );
        });
    };

    return (
        <div className={`${theme === 'dark' ? 'dark bg-gray-800' : 'bg-gradient-to-br from-gray-50 via-purple-50/50 to-gray-50'} min-h-[calc(100vh-2rem)] font-sans flex justify-center`}>
            <div className={`min-h-[calc(100vh-2rem)] ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'} px-4 sm:px-6 lg:px-8 py-6 w-[90%]`}>
                <button
                    onClick={toggleTheme}
                    className={`fixed top-4 right-4 p-2 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110 ${theme === 'dark' ? 'bg-gray-800 text-yellow-400' : 'bg-white text-gray-800'}`}
                    title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                    {theme === 'dark' ? <FaSun size={24} /> : <FaMoon size={24} />}
                </button>
                <div className="w-full">
                    <h1 className={`text-5xl font-extrabold text-center ${theme === 'dark' ? 'text-purple-300' : 'text-purple-600'} mb-3 tracking-tight`}>QuickLearn.AI</h1>
                    <p className={`text-xl text-center ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mb-6 font-medium`}>Your AI-powered learning companion</p>
                    <div className={`shadow-2xl rounded-2xl p-6 glassmorphism ${theme === 'dark' ? 'bg-gray-800/30' : 'bg-white/50'}`}>
                        <div className="flex gap-3 mb-6 relative">
                            {INPUT_TABS.map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setInputTab(tab)}
                                    className={`relative px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ease-in-out ${inputTab === tab
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
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') handleGetTranscript();
                                    }}
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
                                    <p className="text-white text-lg font-medium mt-4">
                                        {loadingMessage}
                                    </p>
                                    {progress > 0 && (
                                        <>
                                            <div className="w-64 bg-gray-700 rounded-full h-2 mt-4">
                                                <div
                                                    className="bg-purple-400 h-2 rounded-full transition-all duration-300"
                                                    style={{ width: `${progress}%` }}
                                                ></div>
                                            </div>
                                            <p className="text-white text-sm mt-2">{progress}% complete</p>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col md:flex-row gap-4 h-[calc(100vh-20rem)] sm:h-[calc(100vh-22rem)] mt-6">
                        <div className={`w-full md:w-3/5 flex flex-col shadow-2xl rounded-2xl p-6 glassmorphism ${theme === 'dark' ? 'bg-gray-800/30 border-gray-700' : 'bg-white/50 border-gray-300'} overflow-auto custom-scrollbar h-full`}>
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
                            <div className="flex-1 overflow-auto rounded-xl p-6 shadow-inner text-base prose max-w-none custom-scrollbar bg-opacity-50 transition-all duration-300" id="output-container">
                                {topicTitle && <h2 className="topic-title">{topicTitle}</h2>}
                                {outputTab === 'Transcript' && (
                                    <p id="transcript-content" className={`whitespace-pre-wrap text-lg ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                                        {transcript || 'Your transcript will appear here once processed.'}
                                    </p>
                                )}
                                {outputTab === 'Notes' && summary && (() => {
                                    const cleanedSummary = summary.replace(/^#{1,6}\s*$/gm, '');
                                    return (
                                        <div id="notes-content" className={`prose max-w-none ${theme === 'dark' ? 'prose-invert dark:prose-dark text-gray-100' : 'text-gray-900'} text-lg`}>
                                            <ReactMarkdown
                                                remarkPlugins={[remarkMath]}
                                                rehypePlugins={[rehypeKatex]}
                                                components={{
                                                    h1: ({ node, children, ...props }) =>
                                                        children && children.length > 0 ? (
                                                            <h1
                                                                className={`text-3xl font-bold relative p-2 mb-2 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'} rounded-lg before:content-[''] before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:bg-purple-500 before:rounded-l-lg before:transition-all before:duration-300 ${theme === 'dark' ? 'before:bg-purple-500' : 'before:bg-purple-400'}`}
                                                                {...props}
                                                            >
                                                                {children}
                                                            </h1>
                                                        ) : null,
                                                    h2: ({ node, children, ...props }) =>
                                                        children && children.length > 0 ? (
                                                            <h2
                                                                className={`text-2xl font-semibold relative p-2 mb-2 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'} rounded-lg before:content-[''] before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:bg-purple-500 before:rounded-l-lg before:transition-all before:duration-300 ${theme === 'dark' ? 'before:bg-purple-500' : 'before:bg-purple-400'}`}
                                                                {...props}
                                                            >
                                                                {children}
                                                            </h2>
                                                        ) : null,
                                                    h3: ({ node, children, ...props }) =>
                                                        children && children.length > 0 ? (
                                                            <h3
                                                                className={`text-xl font-medium relative p-2 mb-2 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'} rounded-lg before:content-[''] before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:bg-purple-500 before:rounded-l-lg before:transition-all before:duration-300 ${theme === 'dark' ? 'before:bg-purple-500' : 'before:bg-purple-400'}`}
                                                                {...props}
                                                            >
                                                                {children}
                                                            </h3>
                                                        ) : null,
                                                    h4: ({ node, children, ...props }) =>
                                                        children && children.length > 0 ? (
                                                            <h4
                                                                className={`text-lg font-medium relative p-2 mb-2 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'} rounded-lg before:content-[''] before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:bg-purple-500 before:rounded-l-lg before:transition-all before:duration-300 ${theme === 'dark' ? 'before:bg-purple-500' : 'before:bg-purple-400'}`}
                                                                {...props}
                                                            >
                                                                {children}
                                                            </h4>
                                                        ) : null,
                                                    h5: ({ node, children, ...props }) =>
                                                        children && children.length > 0 ? (
                                                            <h5
                                                                className={`text-base font-medium relative p-2 mb-2 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'} rounded-lg before:content-[''] before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:bg-purple-500 before:rounded-l-lg before:transition-all before:duration-300 ${theme === 'dark' ? 'before:bg-purple-500' : 'before:bg-purple-400'}`}
                                                                {...props}
                                                            >
                                                                {children}
                                                            </h5>
                                                        ) : null,
                                                    h6: ({ node, children, ...props }) =>
                                                        children && children.length > 0 ? (
                                                            <h6
                                                                className={`text-sm font-medium relative p-2 mb-2 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'} rounded-lg before:content-[''] before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:bg-purple-500 before:rounded-l-lg before:transition-all before:duration-300 ${theme === 'dark' ? 'before:bg-purple-500' : 'before:bg-purple-400'}`}
                                                                {...props}
                                                            >
                                                                {children}
                                                            </h6>
                                                        ) : null,
                                                    p: ({ node, children, ...props }) =>
                                                        <p className={`mb-4 leading-relaxed ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`} {...props}>{children}</p>,
                                                    ul: ({ node, children, ...props }) =>
                                                        <ul className={`list-disc pl-6 mb-4 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`} {...props}>{children}</ul>,
                                                    ol: ({ node, children, ...props }) =>
                                                        <ol className={`list-decimal pl-6 mb-4 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`} {...props}>{children}</ol>,
                                                    li: ({ node, children, ...props }) =>
                                                        <li className={`mb-2 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`} {...props}>{children}</li>,
                                                    code: ({ node, inline, children, ...props }) =>
                                                        inline ? (
                                                            <code className={`bg-gray-800 text-purple-300 px-1 rounded ${theme === 'dark' ? 'text-purple-300' : 'text-purple-600'}`} {...props}>{children}</code>
                                                        ) : (
                                                            <pre className={`bg-gray-800 border border-gray-700 p-4 rounded-lg mb-4 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`} {...props}>
                                                                <code>{children}</code>
                                                            </pre>
                                                        ),
                                                    strong: ({ node, children, ...props }) =>
                                                        <strong className={`${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'} font-semibold`} {...props}>{children}</strong>,
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
                            <div className="flex gap-3 mb-4">
                                {transcript && (
                                    <button
                                        onClick={() => setRightPanelTab('Video')}
                                        className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${rightPanelTab === 'Video'
                                            ? `${theme === 'dark' ? 'bg-purple-600 text-white' : 'bg-purple-500 text-white'}`
                                            : `${theme === 'dark' ? 'bg-gray-800/50 text-purple-300 hover:bg-gray-700/50' : 'bg-gray-200 text-purple-600 hover:bg-gray-300'}`}`}
                                        aria-label="Switch to Video tab"
                                    >
                                        Video
                                    </button>
                                )}
                                <button
                                    onClick={() => setRightPanelTab('Chat')}
                                    className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${rightPanelTab === 'Chat'
                                        ? `${theme === 'dark' ? 'bg-purple-600 text-white' : 'bg-purple-500 text-white'}`
                                        : `${theme === 'dark' ? 'bg-gray-800/50 text-purple-300 hover:bg-gray-700/50' : 'bg-gray-200 text-purple-600 hover:bg-gray-300'}`}`}
                                    aria-label="Switch to Chat tab"
                                >
                                    Chat
                                </button>
                            </div>
                            <div className="min-h-0">
                                {rightPanelTab === 'Video' && transcript && (
                                    <div className={`w-full ${theme === 'dark' ? 'bg-gray-800/50' : 'bg-white/50'} rounded-xl p-4 flex flex-col gap-4`}>
                                        <h2 className={`text-lg font-semibold mb-2 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>Video</h2>
                                        <div className="relative w-full aspect-video">
                                            <iframe
                                                className="absolute top-0 left-0 w-full h-full rounded-lg"
                                                src={embedUrl}
                                                frameBorder="0"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                                title="Embedded Video"
                                            />
                                        </div>
                                        <div className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                            <p>{videoSummary || 'Loading summary...'}</p>
                                        </div>
                                    </div>
                                )}
                                {rightPanelTab === 'Chat' && (
                                    <div className={`w-full min-h-0 ${theme === 'dark' ? 'bg-gray-800/50' : 'bg-white/50'} rounded-xl p-4 flex flex-col`}>
                                        <div className="relative flex-shrink-0">
                                            <div className="flex gap-3 mb-2">
                                                <input
                                                    className={`flex-1 h-12 px-5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all duration-300 ${theme === 'dark' ? 'bg-gray-800/50 border-gray-700 text-gray-100 placeholder-gray-400' : 'bg-white/50 border-gray-300 text-gray-900 placeholder-gray-500'}`}
                                                    placeholder="💡 Ask anything or choose from the list below ..."
                                                    value={chatInput}
                                                    ref={inputRef}
                                                    onChange={e => {
                                                        const value = e.target.value;
                                                        setChatInput(value);
                                                        setShowDropdown(value.trim() === '');
                                                    }}
                                                    onFocus={() => {
                                                        if (!chatInput.trim()) setShowDropdown(true);
                                                    }}
                                                    onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                                                    onKeyDown={e => {
                                                        if (e.key === 'Enter') {
                                                            handleChatSubmit();
                                                            setShowDropdown(false);
                                                        }
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
                                        <div className="flex-1 overflow-y-auto rounded-xl p-4 shadow-inner custom-scrollbar" ref={chatContainerRef}>
                                            {chatLoading && (
                                                <div className={`text-center text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mb-4`}>Loading response...</div>
                                            )}
                                            {(() => {
                                                const grouped = [];
                                                for (let i = 0; i < chatHistory.length; i += 2) {
                                                    const userMsg = chatHistory[i];
                                                    const botMsg = chatHistory[i + 1];
                                                    if (userMsg && botMsg) {
                                                        grouped.push({ userMsg, botMsg });
                                                    }
                                                }
                                                return grouped.reverse().map((pair, index) => (
                                                    <div key={index} className="mb-4">
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
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}