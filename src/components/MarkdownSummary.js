import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export default function MarkdownSummary({ summary, theme }) {
  const cleanedSummary = summary.replace(/^#{1,6}\s*$/gm, '');

  return (
    <div id="summary-content" className={`prose max-w-none ${theme === 'dark' ? 'prose-invert dark:prose-dark text-gray-100' : 'text-gray-900'} text-sm`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          h1: ({ children, ...props }) =>
            <h1 className={`text-2xl font-bold mb-2 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`} {...props}>{children}</h1>,
          h2: ({ children, ...props }) =>
            <h2 className={`text-xl font-semibold mb-2 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`} {...props}>{children}</h2>,
          h3: ({ children, ...props }) =>
            <h3 className={`text-lg font-medium mb-2 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`} {...props}>{children}</h3>,
          p: ({ children, ...props }) =>
            <p className={`mb-4 leading-relaxed text-sm ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`} {...props}>{children}</p>,
          ul: ({ children, ...props }) =>
            <ul className={`list-disc pl-6 mb-4 text-sm ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`} {...props}>{children}</ul>,
          ol: ({ children, ...props }) =>
            <ol className={`list-decimal pl-6 mb-4 text-sm ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`} {...props}>{children}</ol>,
          li: ({ children, ...props }) =>
            <li className={`mb-2 text-sm ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`} {...props}>{children}</li>,
          code: ({ inline, children, ...props }) =>
            inline ? (
              <code className={`bg-gray-800 text-purple-300 px-1 rounded text-sm ${theme === 'dark' ? 'text-purple-300' : 'text-purple-600'}`} {...props}>{children}</code>
            ) : (
              <pre className={`bg-gray-800 border border-gray-700 p-4 rounded-lg mb-4 text-sm ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`} {...props}>
                <code>{children}</code>
              </pre>
            ),
          strong: ({ children, ...props }) =>
            <strong className={`text-sm ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'} font-semibold`} {...props}>{children}</strong>,
        }}
      >
        {cleanedSummary}
      </ReactMarkdown>
    </div>
  );
}
