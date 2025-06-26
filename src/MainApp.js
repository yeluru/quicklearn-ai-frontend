import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import 'katex/dist/katex.min.css';
import { FaMoon, FaSun } from 'react-icons/fa';
import ChatPanel from './components/ChatPanel';
import VideoPanel from './components/VideoPanel';
import QuizPanel from './components/QuizPanel';
import MarkdownSummary from './components/MarkdownSummary';

const INPUT_TABS = ['Video', 'Audio', 'Text', 'File'];
const OUTPUT_TABS = ['Transcript', 'Notes'];

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
    const [copiedPanel, setCopiedPanel] = useState('');
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
    const suggestionsFetchedRef = useRef(false);
    const transcriptContainerRef = useRef(null);
    const summaryContainerRef = useRef(null);
    const quizContainerRef = useRef(null);
    const [transcriptSegments, setTranscriptSegments] = useState([]);

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
            setCopiedPanel('left');
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
                    setCopiedPanel('left');
                    setTimeout(() => setCopied(false), 2000);
                } else throw new Error();
            } catch {
                alert("❌ Failed to copy. Try Ctrl+C manually.");
            }
            selection.removeAllRanges();
        }
    };

    const copyRightQuizContent = async () => {
        const el = document.getElementById('right-quiz-content');
        if (!el) return;
        try {
            await navigator.clipboard.write([
                new ClipboardItem({
                    'text/plain': new Blob([el.innerText], { type: 'text/plain' }),
                    'text/html': new Blob([el.innerHTML], { type: 'text/html' })
                })
            ]);
            setCopied(true);
            setCopiedPanel('right');
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
                    setCopiedPanel('right');
                    setTimeout(() => setCopied(false), 2000);
                } else throw new Error();
            } catch {
                alert("❌ Failed to copy. Try Ctrl+C manually.");
            }
            selection.removeAllRanges();
        }
    };

    // Helper to format seconds as hh:mm:ss or mm:ss
    function formatTime(seconds) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        return h > 0
            ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
            : `${m}:${s.toString().padStart(2, '0')}`;
    }

    // Seek the YouTube player to a given time (in seconds)
    function seekTo(seconds) {
        if (window.player && typeof window.player.seekTo === 'function') {
            window.player.seekTo(seconds, true);
        }
    }

    // Fetch transcript segments for YouTube videos
    const fetchTranscriptSegments = async (videoUrl) => {
        setLoading(true);
        setTranscriptSegments([]);
        setTranscript("");
        try {
            const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/transcript/segments?url=${encodeURIComponent(videoUrl)}`);
            const contentType = response.headers.get('content-type') || '';
            let isStream = contentType.includes('text/event-stream');
            let isJson = contentType.includes('application/json');
            if (isStream) {
                // Streaming mode - append chunks in real-time
                const reader = response.body.getReader();
                const decoder = new TextDecoder('utf-8');
                let done = false;
                while (!done) {
                    const { value, done: isDone } = await reader.read();
                    if (value) {
                        const chunk = decoder.decode(value);
                        chunk.split(/\n\n+/).forEach(line => {
                            if (line.trim().startsWith('data:')) {
                                try {
                                    const data = JSON.parse(line.replace(/^data:\s*/, ''));
                                    if (data.segments && data.segments.length > 0) {
                                        setTranscriptSegments(data.segments);
                                        setTranscript(data.segments.map(seg => seg.text).join(' '));
                                    } else if (data.transcript) {
                                        setTranscriptSegments([]);
                                        setTranscript(data.transcript);
                                    } else if (data.type === 'transcript_chunk' && data.content) {
                                        // Stream transcript chunks in real-time like Summary/Notes
                                        setTranscript(prev => prev + data.content + '\n');
                                    } else if (data.type === 'segments' && data.segments) {
                                        // Handle timestamped segments
                                        setTranscriptSegments(data.segments);
                                        setTranscript(data.segments.map(seg => seg.text).join(' '));
                                    } else if (data.type === 'complete') {
                                        setIsTranscriptComplete(true);
                                    } else if (data.type === 'error') {
                                        alert(data.message || 'Failed to fetch transcript segments.');
                                        setTranscriptSegments([]);
                                        setTranscript('');
                                    }
                                } catch (e) {
                                    // Ignore parse errors for incomplete chunks
                                }
                            }
                        });
                    }
                    done = isDone;
                }
                setIsTranscriptComplete(true);
            } else {
                // Try to parse as JSON
                try {
                    const data = await response.json();
                    if (data.segments && data.segments.length > 0) {
                        setTranscriptSegments(data.segments);
                        setTranscript(data.segments.map(seg => seg.text).join(' '));
                    } else if (data.transcript) {
                        setTranscriptSegments([]);
                        setTranscript(data.transcript);
                    } else {
                        setTranscriptSegments([]);
                        setTranscript('');
                    }
                    setIsTranscriptComplete(true);
                } catch (jsonErr) {
                    // If JSON parsing fails, fallback to streaming parser
                    try {
                        const reader = response.body.getReader();
                        const decoder = new TextDecoder('utf-8');
                        let done = false;
                        while (!done) {
                            const { value, done: isDone } = await reader.read();
                            if (value) {
                                const chunk = decoder.decode(value);
                                chunk.split(/\n\n+/).forEach(line => {
                                    if (line.trim().startsWith('data:')) {
                                        try {
                                            const data = JSON.parse(line.replace(/^data:\s*/, ''));
                                            if (data.segments && data.segments.length > 0) {
                                                setTranscriptSegments(data.segments);
                                                setTranscript(data.segments.map(seg => seg.text).join(' '));
                                            } else if (data.transcript) {
                                                setTranscriptSegments([]);
                                                setTranscript(data.transcript);
                                            } else if (data.type === 'transcript_chunk' && data.content) {
                                                // Stream transcript chunks in real-time like Summary/Notes
                                                setTranscript(prev => prev + data.content + '\n');
                                            } else if (data.type === 'complete') {
                                                setIsTranscriptComplete(true);
                                            } else if (data.type === 'error') {
                                                alert(data.message || 'Failed to fetch transcript segments.');
                                                setTranscriptSegments([]);
                                                setTranscript('');
                                            }
                                        } catch (e) {
                                            // Ignore parse errors for incomplete chunks
                                        }
                                    }
                                });
                            }
                            done = isDone;
                        }
                        setIsTranscriptComplete(true);
                    } catch (streamErr) {
                        alert('Failed to fetch transcript segments.');
                        setTranscriptSegments([]);
                        setTranscript('');
                    }
                }
            }
        } catch (err) {
            alert('Failed to fetch transcript segments.');
            setTranscriptSegments([]);
            setTranscript('');
        }
        setLoading(false);
    };

    const handleGetTranscript = async () => {
        setInputTab('Video');
        setOutputTab('Transcript');
        setRightPanelTab('Video');
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
        suggestionsFetchedRef.current = false;

        try {
            if (inputTab === 'Text') {
                setTranscript(textInput);
                setOutputTab('Transcript');
                setLoading(false);
                setLoadingMessage('');
                setProgress(0);
                setIsTranscriptComplete(true);
                setTranscriptSegments([]); // Clear segments for text
                console.log('Transcript complete:', { source: 'Text', transcriptLength: textInput.length });
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
                    setTranscriptSegments([]); // Clear segments for file
                    console.log('Transcript complete:', { source: 'File', transcriptLength: res.data.transcript.length });
                } else {
                    alert('No transcript found or failed to extract data.');
                    setIsTranscriptComplete(true);
                }
                setLoading(false);
                setLoadingMessage('');
                setProgress(0);
                return;
            }

            // For YouTube video, fetch segments
            if (inputTab === 'Video' && url) {
                await fetchTranscriptSegments(url);
                setIsTranscriptComplete(true);
                setLoading(false);
                setLoadingMessage('');
                setProgress(0);
                return;
            }

            // fallback for other types (if any)
        } catch (err) {
            alert('Error extracting transcript.');
            setIsTranscriptComplete(true);
        }
        setLoading(false);
        setLoadingMessage('');
        setProgress(0);
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
        console.log(`Submitting chat: ${input}`, { transcriptLength: transcript?.length || 0 });
        const newHistory = [...chatHistory, { role: 'user', content: input }];
        setChatHistory(newHistory);
        setChatInput('');
        setChatResponse('');
        setChatLoading(true);
        setShowDropdown(false);
        try {
            if (!transcript) {
                console.warn('No transcript available, sending empty transcript');
            }
            const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/chat/on-topic`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transcript: transcript || '', chatHistory: newHistory })
            });
            if (!res.ok) {
                const errorText = await res.text();
                console.error(`Chat error: HTTP ${res.status}: ${errorText}`);
                throw new Error(`HTTP ${res.status}: ${errorText}`);
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
    }, [chatHistory, chatInput, chatLoading, transcript]);

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
        if (isTranscriptComplete && transcript && !suggestionsLoading && !suggestionsFetchedRef.current) {
            console.log('useEffect triggered:', { transcriptLength: transcript.length, suggestionsFetched: suggestionsFetchedRef.current });
            suggestionsFetchedRef.current = true; // Prevent future runs
            setSuggestionsLoading(true);
            fetch(`${process.env.REACT_APP_API_BASE_URL}/chat/suggested-questions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ summary: transcript.slice(0, 10000) })
            })
                .then(res => {
                    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
                    return res.json();
                })
                .then(data => {
                    console.log('Questions received:', data.questions);
                    if (Array.isArray(data.questions)) {
                        setSuggestedData(data.questions);
                    }
                })
                .catch(err => console.error('Error loading suggestions:', err))
                .finally(() => setSuggestionsLoading(false));
        }
    }, [isTranscriptComplete, transcript, suggestionsLoading]);

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

    useEffect(() => {
        if (outputTab === 'Transcript' && transcriptContainerRef.current) {
            transcriptContainerRef.current.scrollTop = transcriptContainerRef.current.scrollHeight;
        } else if (outputTab === 'Notes' && summaryContainerRef.current) {
            summaryContainerRef.current.scrollTop = summaryContainerRef.current.scrollHeight;
        } else if (outputTab === 'Quiz' && quizContainerRef.current) {
            quizContainerRef.current.scrollTop = quizContainerRef.current.scrollHeight;
        }
    }, [transcript, summary, qnaText, outputTab]);

    // Scroll to top when streaming completes
    useEffect(() => {
        if (isTranscriptComplete) {
            if (outputTab === 'Transcript' && transcriptContainerRef.current) {
                transcriptContainerRef.current.scrollTop = 0;
            } else if (outputTab === 'Notes' && summaryContainerRef.current) {
                summaryContainerRef.current.scrollTop = 0;
            } else if (outputTab === 'Quiz' && quizContainerRef.current) {
                quizContainerRef.current.scrollTop = 0;
            }
        }
    }, [isTranscriptComplete, outputTab]);

    // Add useEffect to trigger quiz endpoint when rightPanelTab is 'Quiz'
    useEffect(() => {
        if (rightPanelTab === 'Quiz' && transcript && !qnaText) {
            streamOutput('qna');
        }
        // Optionally, refresh quiz if transcript changes
        // eslint-disable-next-line
    }, [rightPanelTab, transcript]);

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
                                    className={`relative px-5 py-2 rounded-lg text-sm font-normal transition-all duration-300 ease-in-out ${inputTab === tab
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
                                        if (e.key === 'Enter') {
                                          const embed = getEmbedUrl(url);
                                          if (embed) {
                                            setEmbedUrl(embed);
                                            handleGetTranscript();
                                          } else {
                                            alert('Invalid URL!');
                                          }
                                        }
                                      }}
                                    aria-label={`Enter ${inputTab} URL`}
                                />
                                <button
                                    className={`font-semibold px-5 py-3 rounded-xl shadow-sm transition-all duration-300 ${theme === 'dark' ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-purple-500 hover:bg-purple-600 text-white'}`}
                                    onClick={() => {
                                        const embed = getEmbedUrl(url);
                                        if (embed) {
                                            setEmbedUrl(embed);
                                            handleGetTranscript();
                                        } else {
                                            alert('Invalid URL!');
                                        }
                                    }}
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
                        <div
                            className={`w-full md:w-3/5 flex flex-col shadow-2xl rounded-2xl p-6 glassmorphism ${theme === 'dark' ? 'bg-gray-800/30 border-gray-700' : 'bg-white/50 border-gray-300'}`}
                            style={{ maxHeight: '70vh', minHeight: 0, flexBasis: 0, flexGrow: 1 }}
                        >
                            <div
                                id="output-container"
                                className="flex-1 min-h-0 rounded-xl p-6 shadow-inner text-base prose max-w-none bg-opacity-50 transition-all duration-300"
                                style={{ display: 'flex', flexDirection: 'column', flexBasis: 0, flexGrow: 1, minHeight: 0, maxHeight: '60vh' }}
                            >
                                {outputTab === 'Transcript' && (
                                    <h2 className="topic-title">Transcript<br></br></h2>
                                )}
                                {outputTab === 'Notes' && (
                                    <h2 className="topic-title">Summary<br></br></h2>
                                )}
                                {outputTab === 'Transcript' && (
                                    <div
                                        id="transcript-content"
                                        ref={transcriptContainerRef}
                                        className={`whitespace-pre-wrap text-lg custom-scrollbar overflow-y-auto max-h-[50vh] pr-2 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}
                                    >
                                        {transcriptSegments.length > 0 ? (
                                            <div>
                                                {transcriptSegments.map((seg, idx) => (
                                                    <div key={idx} style={{ marginBottom: 8 }}>
                                                        <span
                                                            style={{ color: 'blue', cursor: 'pointer', marginRight: 8 }}
                                                            onClick={() => seekTo(seg.start)}
                                                            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') seekTo(seg.start); }}
                                                            role="button"
                                                            tabIndex={0}
                                                            aria-label={`Jump to ${formatTime(seg.start)}`}
                                                        >
                                                            [{formatTime(seg.start)}]
                                                        </span>
                                                        {seg.text}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className={`whitespace-pre-wrap text-lg ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`} style={{ width: '100%' }}>
                                                {transcript || 'Your transcript will appear here once processed.'}
                                            </div>
                                        )}
                                    </div>
                                )}
                                {outputTab === 'Notes' && summary && (
                                    <div
                                        id="notes-content"
                                        ref={summaryContainerRef}
                                        style={{ flex: 1, minHeight: 0, overflowY: 'auto', maxHeight: '50vh' }}
                                    >
                                        <MarkdownSummary summary={summary} theme={theme} />
                                    </div>
                                )}
                                {outputTab === 'Quiz' && qnaText && (
                                    <div className="flex flex-col h-full" style={{ minHeight: 0, flex: 1 }}>
                                        <div
                                            id="right-quiz-content"
                                            ref={quizContainerRef}
                                            className="flex-1 overflow-y-auto custom-scrollbar mb-4"
                                            style={{ minHeight: 0, maxHeight: '50vh' }}
                                        >
                                            {qnaText.split(/\n{2,}/).filter(Boolean).map((block, idx) => {
                                                let lines = block.split('\n').map(l => l.trim()).filter(Boolean);
                                                let question = '';
                                                let answer = '';
                                                if (lines.length > 0) {
                                                    const qIdx = lines.findIndex(l => l.startsWith('###'));
                                                    if (qIdx !== -1) {
                                                        question = lines[qIdx].replace(/^###\s*:?\s*/, '').replace(/\*\*Answer:\*\*/g, '').trim();
                                                        answer = lines.slice(qIdx + 1).join(' ').replace(/\*\*Answer:\*\*/g, '').trim();
                                                    } else {
                                                        question = lines[0].replace(/^###\s*:?\s*/, '').replace(/\*\*Answer:\*\*/g, '').trim();
                                                        answer = lines.slice(1).join(' ').replace(/\*\*Answer:\*\*/g, '').trim();
                                                    }
                                                    const nextQIdx = answer.indexOf('###');
                                                    if (nextQIdx !== -1) {
                                                        answer = answer.slice(0, nextQIdx).trim();
                                                    }
                                                }
                                                const isJunkQuestion = !question || /^#+$/.test(question) || !question.replace(/#/g, '').trim();
                                                if (isJunkQuestion && !answer) return null;
                                                if (isJunkQuestion) question = '';
                                                if (!question && !answer) return null;
                                                return (
                                                    <div key={idx} className="mb-4 flex flex-col w-full animate-fade-in">
                                                        <div className="flex flex-col w-full max-w-full">
                                                            {question && (
                                                                <div className={`px-4 py-2 rounded-t-lg rounded-br-lg w-full max-w-full text-sm font-extrabold ${theme === 'dark' ? 'text-purple-300 bg-purple-900/50' : 'text-purple-600 bg-purple-200/50'}`}
                                                                    style={{ fontWeight: 800 }}>{question}</div>
                                                            )}
                                                            {answer && (
                                                                <div className={`px-4 py-2 rounded-b-lg rounded-tl-lg w-full max-w-full text-sm ${theme === 'dark' ? 'text-gray-100 bg-gray-800/50' : 'text-gray-900 bg-gray-200/50'}`} style={{marginTop: question ? '-2px' : undefined}}>{answer}</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-3 items-center mt-6 mb-4">
                                {OUTPUT_TABS.map(tab => (
                                    <div key={tab} className="flex items-center gap-2">
                                        <button
                                            onClick={() => setOutputTab(tab)}
                                            className={`relative px-5 py-2 rounded-lg text-sm font-normal transition-all duration-300 ease-in-out ${outputTab === tab ? (theme === 'dark' ? 'bg-green-600 text-white' : 'bg-green-500 text-white') : (theme === 'dark' ? 'bg-gray-800/50 text-green-300 hover:bg-gray-700/50' : 'bg-gray-200 text-green-600 hover:bg-gray-300')}`}
                                            aria-label={`Select ${tab} output`}
                                        >
                                            {tab}
                                            {outputTab === tab && (
                                                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-green-400 transform scale-x-100 transition-transform duration-300" />
                                            )}
                                        </button>
                                    </div>
                                ))}
                                {outputTab === 'Notes' && summary && (
                                    <>
                                        <button
                                            onClick={() => {
                                                const content = summary;
                                                const label = 'Notes';
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
                                            className={`ml-auto px-4 py-2 rounded-lg text-sm font-normal transition-all duration-200 ${theme === 'dark' ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-purple-500 hover:bg-purple-600 text-white'}`}
                                            title="Download PDF"
                                            aria-label="Download as PDF"
                                        >
                                            ⬇️
                                        </button>
                                        <button
                                            onClick={copyRenderedContent}
                                            className={`px-4 py-2 rounded-lg text-sm font-normal transition-all duration-200 ${theme === 'dark' ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-purple-500 hover:bg-purple-600 text-white'}`}
                                            title="Copy content with formatting"
                                            aria-label="Copy content"
                                        >
                                            📄
                                        </button>
                                        <button
                                            className={`px-4 py-2 rounded-lg text-sm font-normal transition-all duration-200 ${theme === 'dark' ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-purple-500 hover:bg-purple-600 text-white'}`}
                                            onClick={() => handleRefresh('Notes')}
                                            title={`Refresh Notes`}
                                            aria-label={`Refresh Notes`}
                                        >
                                            🔄
                                        </button>
                                        {copied && copiedPanel === 'left' && (
                                            <span className="ml-2 text-green-400 font-normal animate-fade-in">Copied!</span>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                        <div className={`w-full md:w-2/5 flex flex-col shadow-2xl rounded-2xl p-6 glassmorphism ${theme === 'dark' ? 'bg-gray-800/30 border-gray-700' : 'bg-white/50 border-gray-300'}`}>
                            <div className="flex flex-col h-full min-h-0" style={{ flex: 1 }}>
                                {rightPanelTab === 'Video' && embedUrl && (
                                    <VideoPanel theme={theme} embedUrl={embedUrl} videoSummary={videoSummary} />
                                )}
                                {rightPanelTab === 'Quiz' && qnaText && (
                                    <div className="flex flex-col h-full" style={{ minHeight: 0, flex: 1 }}>
                                        <div
                                            id="right-quiz-content"
                                            ref={quizContainerRef}
                                            className="flex-1 overflow-y-auto custom-scrollbar mb-4"
                                            style={{ minHeight: 0, maxHeight: '50vh' }}
                                        >
                                            {qnaText.split(/\n{2,}/).filter(Boolean).map((block, idx) => {
                                                let lines = block.split('\n').map(l => l.trim()).filter(Boolean);
                                                let question = '';
                                                let answer = '';
                                                if (lines.length > 0) {
                                                    const qIdx = lines.findIndex(l => l.startsWith('###'));
                                                    if (qIdx !== -1) {
                                                        question = lines[qIdx].replace(/^###\s*:?\s*/, '').replace(/\*\*Answer:\*\*/g, '').trim();
                                                        answer = lines.slice(qIdx + 1).join(' ').replace(/\*\*Answer:\*\*/g, '').trim();
                                                    } else {
                                                        question = lines[0].replace(/^###\s*:?\s*/, '').replace(/\*\*Answer:\*\*/g, '').trim();
                                                        answer = lines.slice(1).join(' ').replace(/\*\*Answer:\*\*/g, '').trim();
                                                    }
                                                    const nextQIdx = answer.indexOf('###');
                                                    if (nextQIdx !== -1) {
                                                        answer = answer.slice(0, nextQIdx).trim();
                                                    }
                                                }
                                                const isJunkQuestion = !question || /^#+$/.test(question) || !question.replace(/#/g, '').trim();
                                                if (isJunkQuestion && !answer) return null;
                                                if (isJunkQuestion) question = '';
                                                if (!question && !answer) return null;
                                                return (
                                                    <div key={idx} className="mb-4 flex flex-col w-full animate-fade-in">
                                                        <div className="flex flex-col w-full max-w-full">
                                                            {question && (
                                                                <div className={`px-4 py-2 rounded-t-lg rounded-br-lg w-full max-w-full text-sm font-extrabold ${theme === 'dark' ? 'text-purple-300 bg-purple-900/50' : 'text-purple-600 bg-purple-200/50'}`}
                                                                    style={{ fontWeight: 800 }}>{question}</div>
                                                            )}
                                                            {answer && (
                                                                <div className={`px-4 py-2 rounded-b-lg rounded-tl-lg w-full max-w-full text-sm ${theme === 'dark' ? 'text-gray-100 bg-gray-800/50' : 'text-gray-900 bg-gray-200/50'}`} style={{marginTop: question ? '-2px' : undefined}}>{answer}</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                                {rightPanelTab === 'Chat' && (
                                    <ChatPanel
                                        theme={theme}
                                        chatInput={chatInput}
                                        setChatInput={setChatInput}
                                        handleChatSubmit={handleChatSubmit}
                                        showDropdown={showDropdown}
                                        setShowDropdown={setShowDropdown}
                                        suggestedData={suggestedData}
                                        inputRef={inputRef}
                                        chatContainerRef={chatContainerRef}
                                        chatHistory={chatHistory}
                                        chatLoading={chatLoading}
                                    />
                                )}
                            </div>
                            <div className="flex flex-row items-center justify-between gap-2 mt-6 mb-4 w-full">
                                {/* Left: Tab buttons */}
                                <div className="flex gap-2">
                                    {['Video', 'Quiz', 'Chat'].map(tab => (
                                        <button
                                            key={tab}
                                            onClick={() => setRightPanelTab(tab)}
                                            className={`relative px-5 py-2 rounded-lg text-sm font-normal transition-all duration-300 ease-in-out ${rightPanelTab === tab ? (theme === 'dark' ? 'bg-green-600 text-white' : 'bg-green-500 text-white') : (theme === 'dark' ? 'bg-gray-800/50 text-green-300 hover:bg-gray-700/50' : 'bg-gray-200 text-green-600 hover:bg-gray-300')}`}
                                            aria-label={`${tab} Tab`}
                                            disabled={rightPanelTab === tab}
                                            style={{ minWidth: 100 }}
                                        >
                                            {tab}
                                            {rightPanelTab === tab && (
                                                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-green-400 transform scale-x-100 transition-transform duration-300" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                                {/* Right: Action buttons (only for Quiz) */}
                                {rightPanelTab === 'Quiz' && qnaText && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                const content = qnaText;
                                                const label = 'Quiz';
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
                                            className={`px-4 py-2 rounded-lg text-sm font-normal transition-all duration-200 ${theme === 'dark' ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-purple-500 hover:bg-purple-600 text-white'}`}
                                            title="Download PDF"
                                            aria-label="Download as PDF"
                                        >
                                            ⬇️
                                        </button>
                                        <button
                                            onClick={copyRightQuizContent}
                                            className={`px-4 py-2 rounded-lg text-sm font-normal transition-all duration-200 ${theme === 'dark' ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-purple-500 hover:bg-purple-600 text-white'}`}
                                            title="Copy Quiz"
                                            aria-label="Copy Quiz"
                                        >
                                            📄
                                        </button>
                                        <button
                                            onClick={() => handleRefresh('Quiz')}
                                            className={`px-4 py-2 rounded-lg text-sm font-normal transition-all duration-200 ${theme === 'dark' ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-purple-500 hover:bg-purple-600 text-white'}`}
                                            title="Regenerate Quiz"
                                            aria-label="Regenerate Quiz"
                                        >
                                            🔄
                                        </button>
                                        {copied && copiedPanel === 'right' && (
                                            <span className="ml-2 text-green-400 font-normal animate-fade-in self-center">Copied!</span>
                                        )}
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