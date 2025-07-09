import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import 'katex/dist/katex.min.css';
import { FaMoon, FaSun } from 'react-icons/fa';
import ChatPanel from './components/ChatPanel';
import VideoPanel from './components/VideoPanel';
import MarkdownSummary from './components/MarkdownSummary';
import QuizPanel from './components/QuizPanel';

const INPUT_TABS = ['URL', 'Text', 'File'];
const OUTPUT_TABS = ['Transcript', 'Summary'];

export default function MainApp({ theme, toggleTheme }) {
    const [inputTab, setInputTab] = useState('URL');
    const [outputTab, setOutputTab] = useState('Transcript');
    const [url, setUrl] = useState('');
    const [textInput, setTextInput] = useState('');
    const [file, setFile] = useState(null);
    const [transcript, setTranscript] = useState('');
    const [summary, setSummary] = useState('');
    const [qnaText, setQnaText] = useState('');
    const [loading, setLoading] = useState(false);
    const [chatInput, setChatInput] = useState('');
    const [chatLoading, setChatLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [copiedPanel, setCopiedPanel] = useState('');
    const [chatHistory, setChatHistory] = useState([]);
    const [suggestedData, setSuggestedData] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const chatContainerRef = useRef(null);
    const inputRef = useRef(null);
    const [suggestionsLoading, setSuggestionsLoading] = useState(false);
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
    const abortControllerRef = useRef(null);
    const [loadingType, setLoadingType] = useState(null); // 'summary' | 'quiz' | 'transcript' | 'chat' | null
    const [websiteUrl, setWebsiteUrl] = useState('');

    // Helper to determine if the current file is a document
    const documentExtensions = ['.pdf', '.docx', '.doc', '.txt'];
    const isDocumentFile = file && file.name && documentExtensions.some(ext => file.name.toLowerCase().endsWith(ext));

    useEffect(() => {
        // Removed auto-focus
    }, []);

    useEffect(() => {
        if (transcript && embedUrl && isTranscriptComplete && inputTab === 'URL') {
            const videoId = extractVideoId(embedUrl);
            if (videoId && videoId !== lastVideoId) {
                const fetchVideoSummary = async () => {
                    setLoadingType('videoSummary');
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
                    } finally {
                        setLoadingType(null);
                    }
                };
                fetchVideoSummary();
            }
        }
    }, [transcript, embedUrl, isTranscriptComplete, lastVideoId, inputTab]);

    const isAudioFileUrl = (url) => {
        try {
            if (!url || !url.trim() || !url.match(/^https?:\/\//)) {
                return false;
            }
            const urlLower = url.toLowerCase();
            // Check for common audio file extensions (including MP4 which can contain audio)
            const audioExtensions = ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.flac', '.wma', '.aiff', '.mp4'];
            return audioExtensions.some(ext => urlLower.includes(ext));
        } catch (e) {
            return false;
        }
    };

    const isAudioPlatformUrl = (url) => {
        try {
            if (!url || !url.trim() || !url.match(/^https?:\/\//)) {
                return false;
            }
            const urlLower = url.toLowerCase();
            const audioPlatforms = [
                'spotify.com', 'soundcloud.com', 'apple.co', 'music.apple.com',
                'deezer.com', 'tidal.com', 'amazon.com/music', 'youtube.com/music',
                'bandcamp.com', 'audiomack.com', 'reverbnation.com'
            ];
            return audioPlatforms.some(platform => urlLower.includes(platform));
        } catch (e) {
            return false;
        }
    };

    const isGoogleDriveUrl = (url) => {
        if (!url) return false;
        try {
            const urlObj = new URL(url);
            return urlObj.hostname.includes('drive.google.com') && (
                urlObj.pathname.includes('/file/d/') ||
                urlObj.pathname.includes('/open?') ||
                urlObj.pathname.includes('/view?')
            );
        } catch {
            return false;
        }
    };

    const getEmbedUrl = (url) => {
        try {
            if (!url || !url.trim() || !url.match(/^https?:\/\//)) {
                return '';
            }

            // Check for audio file URLs first
            if (isAudioFileUrl(url)) {
                return url; // Return the URL as-is for audio files
            }

            // Check for audio platform URLs
            if (isAudioPlatformUrl(url)) {
                return url; // Return the URL as-is for audio platforms
            }

            // Check for Google Drive URLs
            if (isGoogleDriveUrl(url)) {
                return url; // Return the URL as-is for Google Drive
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
            outputTab === 'Summary' ? 'summary-content' :
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
            abortControllerRef.current = new AbortController();
            const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/transcript/segments?url=${encodeURIComponent(videoUrl)}`, {
                signal: abortControllerRef.current.signal
            });
            const contentType = response.headers.get('content-type') || '';
            let isStream = contentType.includes('text/event-stream');
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
                                        // Stream transcript chunks in real-time like Summary/Summary
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
                                                // Stream transcript chunks in real-time like Summary/Summary
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
        } catch (error) {
            if (error.name === 'AbortError') return;
            alert('Failed to fetch transcript. Please try again.');
        }
        setLoading(false);
    };

    const handleGetTranscript = async () => {
        // Reset all content first
        setTranscript('');
        setSummary('');
        setQnaText('');
        setChatInput('');
        setChatHistory([]);
        setSuggestedData([]);
        setCopied(false);
        setShowDropdown(false);
        setLoading(true);
        setLoadingType('transcript');
        setLoadingMessage('Processing...');
        setChatLoading(false);
        setSuggestionsLoading(false);
        setIsTranscriptComplete(false);
        setVideoSummary('');
        setLastVideoId('');
        // Only clear embedUrl for non-video inputs
        if (inputTab !== 'URL' || !isVideoUrl(url)) {
            setEmbedUrl('');
        }
        setTranscriptSegments([]);
        suggestionsFetchedRef.current = false;

        try {
            if (inputTab === 'Text') {
                setTranscript(textInput);
                setOutputTab('Summary');
                setRightPanelTab('Chat');
                setLoading(false);
                setLoadingMessage('');
                setIsTranscriptComplete(true);
                console.log('Text input complete:', { source: 'Text', textLength: textInput.length });

                // Immediately generate summary for text input
                setLoadingMessage('Generating summary...');
                await streamOutput('summary');
                return;
            }

            if (inputTab === 'File') {
                const formData = new FormData();
                formData.append('file', file);

                // Check if it's a large audio file
                const isLargeAudioFile = file.name && (file.name.toLowerCase().endsWith('.mp4') || file.name.toLowerCase().endsWith('.mp3')) && file.size > 24 * 1024 * 1024;
                const loadingMessage = isLargeAudioFile ? 'Processing large audio file (this may take a while)...' : 'Processing file...';
                setLoadingMessage(loadingMessage);

                const res = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/transcript/upload`, formData);

                if (res?.data?.transcript) {
                    setTranscript(res.data.transcript);

                    // Check if it's a document file (PDF, DOCX, DOC, TXT) or audio file
                    const documentExtensions = ['.pdf', '.docx', '.doc', '.txt'];
                    const audioExtensions = ['.mp4', '.mp3', '.wav', '.m4a', '.aac', '.ogg', '.flac', '.wma', '.aiff'];

                    const isDocumentFile = file.name && documentExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
                    const isAudioFile = file.name && audioExtensions.some(ext => file.name.toLowerCase().endsWith(ext));

                    if (isDocumentFile) {
                        // For document uploads: hide transcript tab, show only Quiz and Chat, highlight Chat, auto-start summary
                        setOutputTab('Summary'); // Don't show transcript tab for documents
                        setRightPanelTab('Chat'); // Highlight Chat tab

                        // Auto-start summary generation for documents
                        setLoadingMessage('Generating summary...');
                        await streamOutput('summary');
                    } else if (isAudioFile) {
                        // For audio files: show transcript tab, no auto-summary, no video tab, highlight Chat
                        setOutputTab('Transcript'); // Show transcript tab for audio
                        setRightPanelTab('Chat'); // Highlight Chat tab (no video tab for audio files)
                    }

                    setIsTranscriptComplete(true);
                    console.log('File upload complete:', { source: 'File', transcriptLength: res.data.transcript.length, isDocument: isDocumentFile, isAudio: isAudioFile });

                } else {
                    alert('No transcript found or failed to extract data.');
                    setIsTranscriptComplete(true);
                }
                setLoading(false);
                setLoadingMessage('');
                return;
            }

            // For YouTube video, fetch segments
            if (inputTab === 'URL' && url) {
                setOutputTab('Transcript');
                setRightPanelTab('Video');

                // Use segments endpoint which handles both timestamped segments and streaming fallback
                setLoadingMessage('Extracting transcript...');

                try {
                    await fetchTranscriptSegments(url);
                } catch (error) {
                    console.error('Transcript extraction error:', error);
                    alert('Failed to extract transcript. Please try again.');
                }

                setLoading(false);
                setLoadingMessage('');
                return;
            }

            // For Audio URLs (direct audio files or audio platforms)
            if (inputTab === 'URL' && url) {
                setOutputTab('Transcript');
                setRightPanelTab('Chat'); // No video tab for audio

                // Use stream endpoint for audio files and platforms
                setLoadingMessage('Processing audio...');

                try {
                    abortControllerRef.current = new AbortController();
                    const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/transcript/stream`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ url: url }),
                        signal: abortControllerRef.current.signal
                    });

                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }

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
                                        if (data.type === 'transcript_chunk' && data.content) {
                                            // Stream transcript chunks in real-time
                                            setTranscript(prev => prev + data.content + '\n');
                                        } else if (data.type === 'progress' && data.message) {
                                            setLoadingMessage(data.message);
                                        } else if (data.type === 'complete') {
                                            setIsTranscriptComplete(true);
                                        } else if (data.type === 'error') {
                                            alert(data.message || 'Failed to process audio. Please ensure the URL provides direct access to an audio file.');
                                        }
                                    } catch (e) {
                                        // Ignore parse errors for incomplete chunks
                                    }
                                }
                            });
                        }
                        done = isDone;
                    }
                } catch (error) {
                    if (error.name === 'AbortError') return;
                    alert('Failed to process audio. Please try again.');
                }

                setLoading(false);
                setLoadingMessage('');
                return;
            }

            // fallback for other types (if any)
        } catch (err) {
            alert('Error extracting transcript.');
            setIsTranscriptComplete(true);
        }
        setLoading(false);
        setLoadingMessage('');
    };

    const streamOutput = useCallback(async (type, force = false) => {
        if (!transcript) return;
        const url = type === 'summary' ? '/summary/summarize-stream' : '/summary/qna-stream';
        const setter = type === 'summary' ? setSummary : setQnaText;
        const value = type === 'summary' ? summary : qnaText;
        if (!force && value) return;
        setter('');
        setLoading(true);
        setLoadingType(type);
        setLoadingMessage(type === 'summary' ? 'Preparing summary...' : 'Preparing Quiz...');
        try {
            abortControllerRef.current = new AbortController();
            const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}${url}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transcript, refresh: force, use_openai: true }),
                signal: abortControllerRef.current.signal
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
            }
        } catch (err) {
            if (err.name === 'AbortError') return;
            alert(`Error generating ${type}`);
        }
        setLoading(false);
        setLoadingMessage('');
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
        setChatLoading(true);
        setShowDropdown(false);
        try {
            if (!transcript) {
                console.warn('No transcript available, sending empty transcript');
            }
            abortControllerRef.current = new AbortController();
            const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/chat/on-topic`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transcript: transcript || '', chatHistory: newHistory }),
                signal: abortControllerRef.current.signal
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
                }
                done = isDone;
            }
            setChatHistory(prev => [...prev, { role: 'assistant', content: answer }]);
            console.log(`Assistant response added: ${answer.slice(0, 50)}...`);
        } catch (err) {
            if (err.name === 'AbortError') return;
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
        if (!isTranscriptComplete || !transcript) return;
        if (outputTab === 'Summary') streamOutput('summary');
        if (outputTab === 'Quiz') streamOutput('qna');
    }, [outputTab, streamOutput, isTranscriptComplete, transcript]);

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
        if (tab === 'Summary') streamOutput('summary', true);
        if (tab === 'Quiz') streamOutput('qna', true);
    };

    useEffect(() => {
        if (outputTab === 'Transcript' && transcriptContainerRef.current) {
            transcriptContainerRef.current.scrollTop = transcriptContainerRef.current.scrollHeight;
        } else if (outputTab === 'Summary' && summaryContainerRef.current) {
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
            } else if (outputTab === 'Summary' && summaryContainerRef.current) {
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

    // Removed problematic useEffect that was auto-switching from Video to Chat

    useEffect(() => {
        if (inputTab === 'File' && file && file.name && (file.name.toLowerCase().endsWith('.pdf') || file.name.toLowerCase().endsWith('.docx') || file.name.toLowerCase().endsWith('.doc') || file.name.toLowerCase().endsWith('.txt')) && outputTab === 'Transcript') {
            setOutputTab('Summary');
        }
    }, [inputTab, outputTab, file]);

    useEffect(() => {
        setUrl('');
        setWebsiteUrl('');
        setTextInput('');
        setFile(null);
        setTranscript('');
        setSummary('');
        setQnaText('');
        setTranscriptSegments([]);
        setChatInput('');
        setChatHistory([]);
        setSuggestedData([]);
        setOutputTab('Transcript');
        setIsTranscriptComplete(false);
        setVideoSummary('');
        setLastVideoId('');
    }, [inputTab]);

    // Auto-switch to Summary tab for document files
    useEffect(() => {
        if (isDocumentFile) {
            setOutputTab('Summary');
        }
    }, [isDocumentFile]);

    useEffect(() => {
        if (embedUrl && isVideoUrl(url)) {
            setRightPanelTab('Video');
        }
    }, [embedUrl, url]);

    const handleCancel = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        setLoading(false);
        setLoadingMessage('');
        setChatLoading(false);
        setSuggestionsLoading(false);
        setIsTranscriptComplete(false);
        setTranscriptSegments([]);
        suggestionsFetchedRef.current = false;
        if (loadingType === 'summary') setSummary('');
        if (loadingType === 'quiz') setQnaText('');
        if (loadingType === 'transcript') setTranscript('');
        setLoadingType(null);
    };

    // Modularize jsPDF export logic
    function exportToPDF(content, label, transcript) {
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
    }

    // Helper to detect website scraping (not video, not audio, not Google Drive)
    const isWebsiteUrl = (url) => {
        return url && !isVideoUrl(url) && !isAudioUrl(url) && !isGoogleDriveUrl(url);
    };

    // Update handleWebsiteScrape to immediately fetch summary and skip transcript tab
    const handleWebsiteScrape = async () => {
        if (!websiteUrl.trim()) return;
        setTranscript('');
        setSummary('');
        setQnaText('');
        setTranscriptSegments([]);
        setOutputTab('Summary'); // Directly show summary
        setRightPanelTab('Chat');
        setChatInput('');
        setChatHistory([]);
        setSuggestedData([]);
        setLoading(true);
        setLoadingMessage('Scraping website...');
        setIsTranscriptComplete(false);
        try {
            const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/scrape`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: websiteUrl.trim() })
            });
            const data = await response.json();
            if (!response.ok) {
                setTranscript(data.error || 'Error scraping website.');
                setIsTranscriptComplete(true);
                setLoading(false);
                setLoadingMessage('');
                return;
            }
            setTranscript(data.transcript || 'No content could be scraped from the website.');
            setIsTranscriptComplete(true);
            setLoadingMessage('Generating summary...');
            // Immediately fetch summary after transcript
            await streamOutput('summary');
            // Fetch chat suggestions after summary is generated
            setSuggestionsLoading(true);
            fetch(`${process.env.REACT_APP_API_BASE_URL}/chat/suggested-questions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ summary: data.transcript.slice(0, 10000) })
            })
                .then(res => {
                    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
                    return res.json();
                })
                .then(data => {
                    console.log('Questions received for website:', data.questions);
                    if (Array.isArray(data.questions)) {
                        setSuggestedData(data.questions);
                    }
                })
                .catch(err => console.error('Error loading suggestions for website:', err))
                .finally(() => setSuggestionsLoading(false));
            setLoading(false);
            setLoadingMessage('');
        } catch (err) {
            setTranscript('Error scraping website.');
            setIsTranscriptComplete(true);
            setLoading(false);
            setLoadingMessage('');
        }
    };

    useEffect(() => {
        // Reset all state on tab switch
        setUrl('');
        setWebsiteUrl('');
        setTextInput('');
        setFile(null);
        setTranscript('');
        setSummary('');
        setQnaText('');
        setTranscriptSegments([]);
        setChatInput('');
        setChatHistory([]);
        setSuggestedData([]);
        setOutputTab('Transcript');
        setRightPanelTab(inputTab === 'URL' ? 'Video' : 'Chat');
        setIsTranscriptComplete(false);
        setEmbedUrl('');
        setVideoSummary('');
        setLastVideoId('');
    }, [inputTab]);

    // Helper to detect video URLs
    const isVideoUrl = (url) => {
        if (!url) return false;
        try {
            const urlObj = new URL(url);
            return (
                urlObj.hostname.includes('youtube.com') ||
                urlObj.hostname.includes('youtu.be') ||
                urlObj.hostname.includes('vimeo.com') ||
                urlObj.hostname.includes('ted.com') ||
                urlObj.hostname.includes('instagram.com') ||
                urlObj.hostname.includes('tiktok.com')
            );
        } catch {
            return false;
        }
    };

    // Helper to detect audio URLs
    const isAudioUrl = (url) => {
        if (!url) return false;
        return isAudioFileUrl(url) || isAudioPlatformUrl(url);
    };

    // Add handleUrlSubmit function
    const handleUrlSubmit = () => {
        if (!url || !url.trim()) {
            alert('Invalid URL!');
            return;
        }
        // Always reset state before handling new input
        setTranscript('');
        setSummary('');
        setQnaText('');
        setTranscriptSegments([]);
        setIsTranscriptComplete(false);
        setVideoSummary('');
        setLastVideoId('');
        setWebsiteUrl('');
        if (isVideoUrl(url)) {
            const embed = getEmbedUrl(url);
            setEmbedUrl(embed);
            handleGetTranscript();
        } else if (isAudioUrl(url) || isGoogleDriveUrl(url)) {
            setEmbedUrl('');
            setRightPanelTab('Chat');
            handleGetTranscript();
        } else {
            setWebsiteUrl(url);
            setEmbedUrl('');
            setRightPanelTab('Chat');
            handleWebsiteScrape();
        }
    };

    // Adjust tab rendering logic for output tabs
    const getOutputTabs = () => {
        if (inputTab === 'File' && isDocumentFile) return ['Summary'];
        if (inputTab === 'URL' && isWebsiteUrl(url)) return ['Summary'];
        return OUTPUT_TABS;
    };

    // Update getRightPanelTabs to always include 'Video' for video URLs (after Analyze)
    const getRightPanelTabs = () => {
        if (inputTab === 'File') return ['Quiz', 'Chat'];
        if (inputTab === 'URL' && isVideoUrl(url)) return ['Video', 'Quiz', 'Chat'];
        return ['Quiz', 'Chat'];
    };

    return (
        <>
            <div className={`${theme === 'dark' ? 'dark bg-gray-800' : 'bg-gradient-to-br from-gray-50 via-purple-50/50 to-gray-50'} min-h-screen h-screen font-sans overflow-hidden relative`}>
                {/* Absolutely positioned theme toggle button */}
                <button
                    onClick={toggleTheme}
                    className={`absolute top-4 right-4 p-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all duration-200 ${theme === 'dark' ? 'bg-gray-800 text-yellow-400' : 'bg-white text-gray-800'} hover:scale-110 z-50`}
                    aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                    {theme === 'dark' ? <FaSun size={20} /> : <FaMoon size={20} />}
                </button>
                <div className="flex flex-col h-screen">
                    <div className="w-full px-3 pt-2">
                        <div className="flex flex-col items-start">
                            <h1 className={`text-2xl font-extrabold ${theme === 'dark' ? 'text-purple-300' : 'text-purple-600'} tracking-tight`}>QuickLearn</h1>
                            <span className={`text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} font-medium`}>Your AI-powered learning companion</span>
                            <br />
                        </div>
                        <div className={`shadow-xl rounded-xl p-4 glassmorphism ${theme === 'dark' ? 'bg-gray-800/30' : 'bg-white/50'}`}>
                            <div className="flex gap-2 mb-4 relative">
                                {INPUT_TABS.map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setInputTab(tab)}
                                        className={`relative px-3 py-1.5 rounded-lg text-xs font-normal transition-all duration-300 ease-in-out ${inputTab === tab
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
                            {/* Input sections with reduced spacing */}
                            {inputTab === 'URL' && (
                                <div className="flex flex-row gap-2 mb-3 items-center w-full">
                                    <input
                                        className="px-3 py-1.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm w-full"
                                        placeholder="Paste a URL here (YouTube, Vimeo, Spotify, Website, etc.)..."
                                        value={url}
                                        onChange={e => setUrl(e.target.value)}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter' && url.trim()) {
                                                handleUrlSubmit();
                                            }
                                        }}
                                        aria-label="Enter URL"
                                    />
                                    <button
                                        className={`px-3 py-1.5 rounded-lg text-xs font-normal transition-all duration-200 ${theme === 'dark' ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-purple-500 hover:bg-purple-600 text-white'} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        onClick={handleUrlSubmit}
                                        aria-label="Analyze input"
                                        style={{ whiteSpace: 'nowrap' }}
                                        disabled={loading || !url.trim()}
                                    >
                                        Analyze
                                    </button>
                                </div>
                            )}
                            {inputTab === 'Text' && (
                                <div className="flex flex-row gap-2 mb-3 items-center w-full">
                                    <textarea
                                        className="px-3 py-1.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm w-full"
                                        rows={2}
                                        placeholder="Paste raw text here..."
                                        value={textInput}
                                        onChange={e => setTextInput(e.target.value)}
                                        aria-label="Enter text input"
                                        style={{ resize: 'vertical' }}
                                    />
                                    <button
                                        className={`px-3 py-1.5 rounded-lg text-xs font-normal transition-all duration-200 ${theme === 'dark' ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-purple-500 hover:bg-purple-600 text-white'} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        onClick={handleGetTranscript}
                                        aria-label="Submit text"
                                        style={{ whiteSpace: 'nowrap' }}
                                        disabled={loading || !textInput.trim()}
                                    >
                                        Submit Text
                                    </button>
                                </div>
                            )}
                            {inputTab === 'File' && (
                                <div className="flex flex-row gap-2 mb-3 items-center w-full">
                                    <input
                                        type="file"
                                        accept=".pdf,.doc,.docx,.txt,.mp4,.mp3,.wav,.m4a,.aac,.ogg,.flac,.wma,.aiff"
                                        className="px-3 py-1.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm w-full"
                                        onChange={e => {
                                            const selectedFile = e.target.files[0];
                                            setFile(selectedFile);
                                            setTranscript('');
                                            setTranscriptSegments([]);
                                            setSummary('');
                                            setQnaText('');
                                            setIsTranscriptComplete(false);
                                            setOutputTab('Transcript');
                                            setRightPanelTab('Chat');
                                        }}
                                        aria-label="Upload file"
                                    />
                                    <button
                                        className={`px-3 py-1.5 rounded-lg text-xs font-normal transition-all duration-200 ${theme === 'dark' ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-purple-500 hover:bg-purple-600 text-white'} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        onClick={handleGetTranscript}
                                        aria-label="Upload and extract"
                                        style={{ whiteSpace: 'nowrap' }}
                                        disabled={loading || !file}
                                    >
                                        Upload & Extract
                                    </button>
                                </div>
                            )}
                            {/* Loading modal with smaller size */}
                            {loading && (
                                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
                                    <div className="flex flex-col items-center justify-center p-6 rounded-xl glassmorphism">
                                        <div className="w-8 h-8 border-4 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                                        <p className="text-white text-sm font-medium mt-3">
                                            {loadingMessage}
                                        </p>
                                        <button
                                            className={`mt-4 px-4 py-1.5 rounded-lg text-xs font-semibold text-white ${theme === 'dark' ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'}`}
                                            onClick={handleCancel}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                        {/* Main content area with reduced spacing */}
                        <div className="flex flex-col md:flex-row gap-3 h-[calc(100vh-12rem)] sm:h-[calc(100vh-14rem)] mt-3">
                            <div
                                className={`w-full md:w-3/5 flex flex-col shadow-xl rounded-xl p-4 glassmorphism ${theme === 'dark' ? 'bg-gray-800/30 border-gray-700' : 'bg-white/50 border-gray-300'}`}
                                style={{ maxHeight: '80vh', minHeight: 0, flexBasis: 0, flexGrow: 1 }}
                            >
                                <div
                                    id="output-container"
                                    className="flex-1 min-h-0 rounded-lg p-4 shadow-inner text-sm prose max-w-none bg-opacity-50 transition-all duration-300"
                                    style={{ display: 'flex', flexDirection: 'column', flexBasis: 0, flexGrow: 1, minHeight: 0, maxHeight: '70vh' }}
                                >
                                    {outputTab === 'Transcript' && (
                                        <h2 className="topic-title text-base">Transcript<br></br></h2>
                                    )}


                                    {outputTab === 'Transcript' && (
                                        <div
                                            id="transcript-content"
                                            ref={transcriptContainerRef}
                                            className={`whitespace-pre-wrap text-sm custom-scrollbar overflow-y-auto max-h-[60vh] pr-2 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}
                                        >
                                            {transcriptSegments.length > 0 ? (
                                                <div>
                                                    {transcriptSegments.map((seg, idx) => (
                                                        <div key={idx} style={{ marginBottom: 6 }}>
                                                            <span
                                                                style={{ color: 'blue', cursor: 'pointer', marginRight: 6, fontSize: '0.75rem' }}
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
                                                <div className={`whitespace-pre-wrap text-sm ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`} style={{ width: '100%' }}>
                                                    {transcript || 'Your transcript will appear here once processed.'}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {outputTab === 'Summary' && summary && (
                                        <div className="flex flex-col h-full" style={{ minHeight: 0, flex: 1 }}>
                                            {/* Sticky Header */}
                                            <div className="sticky top-0 z-10 flex items-center justify-between bg-opacity-80 backdrop-blur-md py-2 px-2 rounded-t-xl"
                                                style={{ background: theme === 'dark' ? 'rgba(36,18,60,0.85)' : 'rgba(255,255,255,0.85)', marginTop: 0, paddingTop: 0 }}>
                                                <span className="text-base font-bold text-purple-700 dark:text-purple-200 tracking-tight">Summary</span>
                                                <button
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-normal transition-all duration-200 ${theme === 'dark' ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-purple-500 hover:bg-purple-600 text-white'}`}
                                                    onClick={() => handleRefresh('Summary')}
                                                    title="Refresh Summary"
                                                    aria-label="Refresh Summary"
                                                >
                                                    🔄
                                                </button>
                                            </div>
                                            {/* Scrollable Content */}
                                            <div
                                                id="summary-content"
                                                ref={summaryContainerRef}
                                                style={{ flex: 1, minHeight: 0, overflowY: 'auto', maxHeight: '60vh' }}
                                            >
                                                <MarkdownSummary summary={summary} theme={theme} />
                                            </div>
                                        </div>
                                    )}
                                    {outputTab === 'Quiz' && qnaText && (
                                        <div className="flex flex-col h-full" style={{ minHeight: 0, flex: 1 }}>
                                            {/* Sticky Header */}
                                            <div className="sticky top-0 z-10 flex items-center justify-between bg-opacity-80 backdrop-blur-md py-2 px-2 rounded-t-xl"
                                                style={{ background: theme === 'dark' ? 'rgba(36,18,60,0.85)' : 'rgba(255,255,255,0.85)' }}>
                                                <span className="text-base font-bold text-purple-700 dark:text-purple-200 tracking-tight">Quiz</span>
                                                <button
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-normal transition-all duration-200 ${theme === 'dark' ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-purple-500 hover:bg-purple-600 text-white'}`}
                                                    onClick={() => handleRefresh('Quiz')}
                                                    title="Refresh Quiz"
                                                    aria-label="Refresh Quiz"
                                                >
                                                    🔄
                                                </button>
                                            </div>
                                            {/* Scrollable Content */}
                                            <div
                                                id="right-quiz-content"
                                                ref={quizContainerRef}
                                                className="flex-1 overflow-y-auto custom-scrollbar"
                                                style={{ minHeight: 0, maxHeight: '60vh' }}
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
                                                        <div key={idx} className="mb-3 flex flex-col w-full animate-fade-in">
                                                            <div className="flex flex-col w-full max-w-full">
                                                                {question && (
                                                                    <div className={`px-3 py-1.5 rounded-t-lg rounded-br-lg w-full max-w-full text-xs font-extrabold ${theme === 'dark' ? 'text-purple-300 bg-purple-900/50' : 'text-purple-600 bg-purple-200/50'}`}
                                                                        style={{ fontWeight: 800 }}>{question}</div>
                                                                )}
                                                                {answer && (
                                                                    <div className={`px-3 py-1.5 rounded-b-lg rounded-tl-lg w-full max-w-full text-xs ${theme === 'dark' ? 'text-gray-100 bg-gray-800/50' : 'text-gray-900 bg-gray-200/50'}`} style={{ marginTop: question ? '-2px' : undefined }}>{answer}</div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {/* Action buttons with smaller size */}
                                <div className="flex flex-wrap gap-2 items-center mt-4 mb-3">
                                    {getOutputTabs().map(tab => (
                                        <div key={tab} className="flex items-center gap-2">
                                            <button
                                                onClick={() => setOutputTab(tab)}
                                                className={`relative px-3 py-1.5 rounded-lg text-xs font-normal transition-all duration-300 ease-in-out ${outputTab === tab ? (theme === 'dark' ? 'bg-green-600 text-white' : 'bg-green-500 text-white') : (theme === 'dark' ? 'bg-gray-800/50 text-green-300 hover:bg-gray-700/50' : 'bg-gray-200 text-green-600 hover:bg-gray-300')}`}
                                                aria-label={`Select ${tab} output`}
                                            >
                                                {tab}
                                                {outputTab === tab && (
                                                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-green-400 transform scale-x-100 transition-transform duration-300" />
                                                )}
                                            </button>
                                        </div>
                                    ))}
                                    {/* Action buttons with smaller size */}
                                    {outputTab === 'Summary' && (
                                        <>
                                            <button
                                                onClick={() => {
                                                    if (!summary) return;
                                                    const content = summary;
                                                    const label = 'Summary';
                                                    exportToPDF(content, label, transcript);
                                                }}
                                                className={`ml-auto px-3 py-1.5 rounded-lg text-xs font-normal transition-all duration-200 ${theme === 'dark' ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-purple-500 hover:bg-purple-600 text-white'} ${!summary ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                title={summary ? 'Download PDF' : 'No summary to download'}
                                                aria-label="Download as PDF"
                                                disabled={!summary}
                                            >
                                                ⬇️
                                            </button>
                                            <button
                                                onClick={copyRenderedContent}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-normal transition-all duration-200 ${theme === 'dark' ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-purple-500 hover:bg-purple-600 text-white'} ${!summary ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                title={summary ? 'Copy content with formatting' : 'No summary to copy'}
                                                aria-label="Copy content"
                                                disabled={!summary}
                                            >
                                                📄
                                            </button>
                                            <button
                                                className={`px-3 py-1.5 rounded-lg text-xs font-normal transition-all duration-200 ${theme === 'dark' ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-purple-500 hover:bg-purple-600 text-white'}`}
                                                onClick={() => handleRefresh('Summary')}
                                                title={`Refresh Summary`}
                                                aria-label={`Refresh Summary`}
                                            >
                                                🔄
                                            </button>
                                            {copied && copiedPanel === 'left' && (
                                                <span className="ml-2 text-green-400 font-normal animate-fade-in text-xs">Copied!</span>
                                            )}
                                        </>
                                    )}
                                    {outputTab === 'Transcript' && (
                                        <>
                                            <button
                                                onClick={() => {
                                                    if (!transcript) return;
                                                    const content = transcript;
                                                    const label = 'Transcript';
                                                    exportToPDF(content, label, transcript);
                                                }}
                                                className={`ml-auto px-3 py-1.5 rounded-lg text-xs font-normal transition-all duration-200 ${theme === 'dark' ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-purple-500 hover:bg-purple-600 text-white'} ${!transcript ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                title={transcript ? 'Download PDF' : 'No transcript to download'}
                                                aria-label="Download as PDF"
                                                disabled={!transcript}
                                            >
                                                ⬇️
                                            </button>
                                            <button
                                                onClick={copyRenderedContent}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-normal transition-all duration-200 ${theme === 'dark' ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-purple-500 hover:bg-purple-600 text-white'} ${!transcript ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                title={transcript ? 'Copy content with formatting' : 'No transcript to copy'}
                                                aria-label="Copy content"
                                                disabled={!transcript}
                                            >
                                                📄
                                            </button>
                                            <button
                                                className={`px-3 py-1.5 rounded-lg text-xs font-normal transition-all duration-200 ${theme === 'dark' ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-purple-500 hover:bg-purple-600 text-white'}`}
                                                onClick={() => handleRefresh('Transcript')}
                                                title={`Refresh Transcript`}
                                                aria-label={`Refresh Transcript`}
                                            >
                                                🔄
                                            </button>
                                            {copied && copiedPanel === 'left' && (
                                                <span className="ml-2 text-green-400 font-normal animate-fade-in text-xs">Copied!</span>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                            {/* Right panel with reduced spacing */}
                            <div className={`w-full md:w-2/5 flex flex-col shadow-xl rounded-xl p-4 glassmorphism ${theme === 'dark' ? 'bg-gray-800/30 border-gray-700' : 'bg-white/50 border-gray-300'}`}>
                                <div className="flex flex-col h-full min-h-0" style={{ flex: 1 }}>
                                    {rightPanelTab === 'Video' && embedUrl && (
                                        <VideoPanel key={`video-${embedUrl}`} theme={theme} embedUrl={embedUrl} videoSummary={videoSummary} />
                                    )}
                                    {rightPanelTab === 'Quiz' && qnaText && (
                                        <div className="flex flex-col h-full" style={{ minHeight: 0, flex: 1 }}>
                                            {/* Sticky Header */}
                                            <div className="sticky top-0 z-10 flex items-center justify-between bg-opacity-80 backdrop-blur-md py-2 px-2 rounded-t-xl"
                                                style={{ background: theme === 'dark' ? 'rgba(36,18,60,0.85)' : 'rgba(255,255,255,0.85)' }}>
                                                <span className="text-base font-bold text-purple-700 dark:text-purple-200 tracking-tight">Quiz</span>
                                                <button
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-normal transition-all duration-200 ${theme === 'dark' ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-purple-500 hover:bg-purple-600 text-white'}`}
                                                    onClick={() => handleRefresh('Quiz')}
                                                    title="Refresh Quiz"
                                                    aria-label="Refresh Quiz"
                                                >
                                                    🔄
                                                </button>
                                            </div>
                                            {/* Scrollable Content */}
                                            <div
                                                id="right-quiz-content"
                                                ref={quizContainerRef}
                                                className="flex-1 overflow-y-auto custom-scrollbar"
                                                style={{ minHeight: 0, maxHeight: '60vh' }}
                                            >
                                                <QuizPanel qnaText={qnaText} />
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
                                {/* Right panel tabs with smaller size */}
                                <div className="flex flex-row items-center justify-between gap-2 mt-4 mb-3 w-full">
                                    <div className="flex gap-2">
                                        {getRightPanelTabs().map(tab => (
                                            <button
                                                key={tab}
                                                onClick={() => setRightPanelTab(tab)}
                                                className={`relative px-3 py-1.5 rounded-lg text-xs font-normal transition-all duration-300 ease-in-out ${rightPanelTab === tab ? (theme === 'dark' ? 'bg-green-600 text-white' : 'bg-green-500 text-white') : (theme === 'dark' ? 'bg-gray-800/50 text-green-300 hover:bg-gray-700/50' : 'bg-gray-200 text-green-600 hover:bg-gray-300')}`}
                                                aria-label={`${tab} Tab`}
                                                disabled={rightPanelTab === tab}
                                                style={{ minWidth: 80 }}
                                            >
                                                {tab}
                                                {rightPanelTab === tab && (
                                                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-green-400 transform scale-x-100 transition-transform duration-300" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                    {/* Quiz action buttons ONLY in right panel, always visible */}
                                    {rightPanelTab === 'Quiz' && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => {
                                                    if (!qnaText) return;
                                                    const content = qnaText;
                                                    const label = 'Quiz';
                                                    exportToPDF(content, label, transcript);
                                                }}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-normal transition-all duration-200 ${theme === 'dark' ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-purple-500 hover:bg-purple-600 text-white'} ${!qnaText ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                title={qnaText ? 'Download PDF' : 'No quiz to download'}
                                                aria-label="Download as PDF"
                                                disabled={!qnaText}
                                            >
                                                ⬇️
                                            </button>
                                            <button
                                                onClick={copyRightQuizContent}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-normal transition-all duration-200 ${theme === 'dark' ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-purple-500 hover:bg-purple-600 text-white'} ${!qnaText ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                title={qnaText ? 'Copy Quiz' : 'No quiz to copy'}
                                                aria-label="Copy Quiz"
                                                disabled={!qnaText}
                                            >
                                                📄
                                            </button>
                                            <button
                                                onClick={() => handleRefresh('Quiz')}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-normal transition-all duration-200 ${theme === 'dark' ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-purple-500 hover:bg-purple-600 text-white'}`}
                                                title="Regenerate Quiz"
                                                aria-label="Regenerate Quiz"
                                            >
                                                🔄
                                            </button>
                                            {copied && copiedPanel === 'right' && (
                                                <span className="ml-2 text-green-400 font-normal animate-fade-in self-center text-xs">Copied!</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
