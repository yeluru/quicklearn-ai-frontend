import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

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
    chatLoading
}) {
    return (
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
    );
}