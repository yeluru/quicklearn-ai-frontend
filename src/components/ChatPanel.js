import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

// Map Unicode math italic letters to ASCII
function normalizeMathUnicode(str) {
  const mathMap = {};
  for (let i = 0; i < 26; i++) {
    mathMap[String.fromCodePoint(0x1D434 + i)] = String.fromCharCode(65 + i);
    mathMap[String.fromCodePoint(0x1D44E + i)] = String.fromCharCode(97 + i);
  }
  for (let i = 0; i < 10; i++) {
    mathMap[String.fromCodePoint(0x1D7CE + i)] = String.fromCharCode(48 + i);
  }
  const greekLower = 'αβγδεζηθικλμνξοπρστυφχψω';
  for (let i = 0; i < greekLower.length; i++) {
    mathMap[String.fromCodePoint(0x1D6FC + i)] = greekLower[i];
  }
  const greekUpper = 'ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ';
  for (let i = 0; i < greekUpper.length; i++) {
    mathMap[String.fromCodePoint(0x1D6A8 + i)] = greekUpper[i];
  }
  return str.replace(/[\u{1D400}-\u{1D7FF}]/gu, c => mathMap[c] || c);
}

export default function ChatPanel({
    theme,
    chatInput,
    setChatInput,
    handleChatSubmit,
    showDropdown,
    setShowDropdown,
    suggestedData,
    inputRef,
    chatContainerRef,
    chatHistory,
    chatLoading,
    isMobile // <-- add this
}) {
    return (
        <div className={`w-full min-h-0 ${theme === 'dark' ? 'bg-gray-800/50' : 'bg-white/50'} rounded-lg p-3 flex flex-col`}>
            <div className={`relative flex-shrink-0 ${isMobile ? 'overflow-visible' : ''}`}>
                <div className="flex gap-2 mb-2">
                    <input
                        className={`px-3 py-1.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400 text-base sm:text-xs w-full` + (theme === 'dark' ? ' bg-gray-800/50 border-gray-700 text-gray-100 placeholder-gray-400' : ' bg-white/50 border-gray-300 text-gray-900 placeholder-gray-500')}
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
                        className={`px-3 py-1.5 rounded-lg text-base sm:text-xs font-normal transition-all duration-200 ${chatInput.trim()
                            ? (theme === 'dark' ? 'bg-purple-600 text-white hover:bg-purple-700' : 'bg-purple-500 text-white hover:bg-purple-600')
                            : (theme === 'dark' ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-gray-400 text-gray-600 cursor-not-allowed')}`}
                        onClick={handleChatSubmit}
                        aria-label="Submit question"
                        style={{ whiteSpace: 'nowrap', height: 'auto' }}
                    >
                        Send
                    </button>
                </div>
                {showDropdown && suggestedData.length > 0 && (
                    <div
                        className="fixed left-0 right-0 w-full z-30 max-h-[50vh] overflow-y-auto shadow-xl rounded-lg mt-1 glassmorphism"
                        style={{
                            top: inputRef.current ? inputRef.current.getBoundingClientRect().bottom + window.scrollY : '100px',
                        }}
                    >
                        <div className={`${theme === 'dark' ? 'bg-gray-800/70 border-gray-700' : 'bg-white/70 border-gray-300'} animate-fade-in`}>
                            {suggestedData.map((item, idx) => (
                                <div key={idx} className={`border-b px-3 py-2 transition-all duration-200 hover:bg-purple-500/20 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-300'}`}>
                                    <div
                                        className={`font-semibold cursor-pointer text-base sm:text-xs ${theme === 'dark' ? 'text-white' : 'text-purple-600'}`}
                                        onClick={() => setChatInput(item.topic)}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={e => { if (e.key === 'Enter') setChatInput(item.topic); }}
                                    >
                                        {item.topic}
                                    </div>
                                    <div
                                        className={`pl-3 text-base sm:text-xs cursor-pointer hover:underline ${theme === 'dark' ? 'text-gray-100' : 'text-gray-600'}`}
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
            <div className="flex-1 overflow-y-auto rounded-lg p-3 shadow-inner custom-scrollbar" ref={chatContainerRef}>
                {chatLoading && (
                    <div className={`text-center text-base sm:text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mb-3`}>Loading response...</div>
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
                        <div key={index} className="mb-3">
                            {pair.userMsg && (
                                <div className={`text-right px-3 py-1.5 rounded-lg mb-1 inline-block max-w-full prose text-base sm:text-xs ${theme === 'dark' ? 'text-purple-300 bg-purple-900/50' : 'text-purple-600 bg-purple-200/50'}`}>
                                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}
                                        components={{
                                            strong: ({ node, children, ...props }) =>
                                                <strong className={`${theme === 'dark' ? 'text-purple-300' : 'text-purple-600'}`} {...props}>{children}</strong>,
                                        }}
                                    >
                                        {normalizeMathUnicode(pair.userMsg.content)}
                                    </ReactMarkdown>
                                </div>
                            )}
                            {pair.botMsg && (
                                <div className={`text-left px-3 py-1.5 rounded-lg inline-block max-w-full prose text-base sm:text-xs ${theme === 'dark' ? 'text-gray-100 bg-gray-800/50' : 'text-gray-900 bg-gray-200/50'}`}>
                                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}
                                        components={{
                                            strong: ({ node, children, ...props }) =>
                                                <strong className={`${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`} {...props}>{children}</strong>,
                                        }}
                                    >
                                        {normalizeMathUnicode(pair.botMsg.content)}
                                    </ReactMarkdown>
                                </div>
                            )}
                        </div>
                    ));
                })()}
            </div>
        </div>
    );
}