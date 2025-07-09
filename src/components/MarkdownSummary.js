import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

// Map Unicode math italic letters to ASCII
function normalizeMathUnicode(str) {
  // Only covers basic Latin and Greek math italic letters
  const mathMap = {};
  // A-Z
  for (let i = 0; i < 26; i++) {
    mathMap[String.fromCodePoint(0x1D434 + i)] = String.fromCharCode(65 + i);
    mathMap[String.fromCodePoint(0x1D44E + i)] = String.fromCharCode(97 + i);
  }
  // Digits 0-9
  for (let i = 0; i < 10; i++) {
    mathMap[String.fromCodePoint(0x1D7CE + i)] = String.fromCharCode(48 + i);
  }
  // Greek lowercase alpha (𝛼) to omega (𝜔)
  const greekLower = 'αβγδεζηθικλμνξοπρστυφχψω';
  for (let i = 0; i < greekLower.length; i++) {
    mathMap[String.fromCodePoint(0x1D6FC + i)] = greekLower[i];
  }
  // Greek uppercase Alpha (𝛢) to Omega (𝛺)
  const greekUpper = 'ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ';
  for (let i = 0; i < greekUpper.length; i++) {
    mathMap[String.fromCodePoint(0x1D6A8 + i)] = greekUpper[i];
  }
  return str.replace(/[\u{1D400}-\u{1D7FF}]/gu, c => mathMap[c] || c);
}

// Heuristic: wrap likely math phrases in $...$ if not already in LaTeX
function autoWrapMath(str) {
  // Only wrap if not already inside $...$ or \(...\)
  // This is a simple heuristic: numbers with operators, exponents, log, factor of, etc.
  // You can expand this as needed.
  return str.replace(/(?<![$\\])\b(\d+\s*(?:\^|\*|\+|\-|\/|=|log|factor|base|to the power of|\()\s*\d+)(?![$\\])/gi, (match) => `$${match}$`);
}

export default function MarkdownSummary({ summary, theme }) {
  const cleanedSummary = summary.replace(/^#{1,6}\s*$/gm, '');
  const normalizedSummary = normalizeMathUnicode(cleanedSummary);
  const mathWrappedSummary = autoWrapMath(normalizedSummary);

  return (
    <div id="summary-content" className={`prose max-w-none ${theme === 'dark' ? 'prose-invert dark:prose-dark text-gray-100' : 'text-gray-900'} text-sm`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          h1: ({ children, ...props }) =>
            <h1 className={`text-xs font-extrabold mb-2 px-3 py-1.5 rounded-t-lg rounded-br-lg w-full max-w-full bg-purple-200/50 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300`} style={{ fontWeight: 800 }} {...props}>{children}</h1>,
          h2: ({ children, ...props }) =>
            <h2 className={`text-xs font-extrabold mb-2 px-3 py-1.5 rounded-t-lg rounded-br-lg w-full max-w-full bg-purple-200/50 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300`} style={{ fontWeight: 800 }} {...props}>{children}</h2>,
          h3: ({ children, ...props }) =>
            <h3 className={`text-xs font-extrabold mb-2 px-3 py-1.5 rounded-t-lg rounded-br-lg w-full max-w-full bg-purple-200/50 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300`} style={{ fontWeight: 800 }} {...props}>{children}</h3>,
          p: ({ children, ...props }) =>
            <p className={`mb-4 leading-relaxed text-xs ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`} {...props}>{children}</p>,
          ul: ({ children, ...props }) =>
            <ul className={`list-disc pl-6 mb-4 text-xs ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`} {...props}>{children}</ul>,
          ol: ({ children, ...props }) =>
            <ol className={`list-decimal pl-6 mb-4 text-xs ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`} {...props}>{children}</ol>,
          li: ({ children, ...props }) =>
            <li className={`mb-2 text-xs ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`} {...props}>{children}</li>,
          code: ({ inline, children, ...props }) =>
            inline ? (
              <code className={`bg-gray-800 text-purple-300 px-1 rounded text-xs ${theme === 'dark' ? 'text-purple-300' : 'text-purple-600'}`} {...props}>{children}</code>
            ) : (
              <pre className={`bg-gray-800 border border-gray-700 p-4 rounded-lg mb-4 text-xs ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`} {...props}>
                <code>{children}</code>
              </pre>
            ),
          strong: ({ children, ...props }) =>
            <strong className={`text-xs ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'} font-semibold`} {...props}>{children}</strong>,
        }}
      >
        {mathWrappedSummary}
      </ReactMarkdown>
    </div>
  );
}
