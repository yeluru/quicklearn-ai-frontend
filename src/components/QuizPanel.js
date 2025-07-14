import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

// Fix common LaTeX mistakes and improve math equivalence formatting
function fixLatexCommonErrors(str) {
  let s = str
    .replace(/\\left\(/g, '(')
    .replace(/\\right\)/g, ')')
    .replace(/\\left\[/g, '[')
    .replace(/\\right\]/g, ']')
    .replace(/\\left\{/g, '{')
    .replace(/\\right\}/g, '}')
    .replace(/\\left\|/g, '|')
    .replace(/\\right\|/g, '|');
  // Replace 'is equivalent to' or 'equals' between math expressions (LaTeX or plain)
  // 1. $...$ is equivalent to $...$
  s = s.replace(/(\$[^$]+\$)\s*(is equivalent to|equals)\s*(\$[^$]+\$)/gi, '$1 \\iff $3');
  // 2. $...$ is equivalent to ... (plain math)
  s = s.replace(/(\$[^$]+\$)\s*(is equivalent to|equals)\s*([a-zA-Z0-9_\\^{}=+\-*/ ()]+)/gi, '$1 \\iff $$ $3 $$');
  // 3. ... (plain math) is equivalent to $...$
  s = s.replace(/([a-zA-Z0-9_\\^{}=+\-*/ ()]+)\s*(is equivalent to|equals)\s*(\$[^$]+\$)/gi, '$$ $1 $$ \\iff $3');
  // 4. plain math is equivalent to plain math
  s = s.replace(/([a-zA-Z0-9_\\^{}=+\-*/ ()]+)\s*(is equivalent to|equals)\s*([a-zA-Z0-9_\\^{}=+\-*/ ()]+)/gi, '$$ $1 $$ \\iff $$ $3 $$');
  return s;
}

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

// Heuristic: wrap likely math phrases in $...$ if not already in LaTeX
function autoWrapMath(str) {
  return str.replace(/(?<![$\\])\b(\d+\s*(?:\^|\*|\+|\-|\/|=|log|factor|base|to the power of|\()\s*\d+)(?![$\\])/gi, (match) => `$${match}$`);
}

function QuizPanel({ qnaText }) {
    const [hasError, setHasError] = useState(false);

    // Helper to split Q/A blocks more robustly
    function splitQnABlocks(text) {
        // Split by 'Question' markers or by two or more newlines
        // This will help if multiple questions are in one block
        return text.split(/(?:\n+|^)(?:#+\s*)?(?:Question:?|Q:|\*\*Question:?\*\*)/gi)
            .map(s => s.trim())
            .filter(Boolean);
    }

    // Helper to extract question and answer from a block
    function extractQA(block) {
        // Remove redundant prefixes and headings
        let cleaned = block
            .replace(/#+\s*Answer:?/gi, '')
            .replace(/Answer:?/gi, '')
            .replace(/\*\*Answer:?\*\*/gi, '')
            .trim();
        // Try to split by first question mark followed by space or newline
        let match = cleaned.match(/(.+?[\?\uff1f])([\s\S]*)/);
        let question = '';
        let answer = '';
        if (match) {
            question = match[1].trim();
            answer = match[2].trim();
        } else {
            // fallback: treat first line as question, rest as answer
            let [q, ...a] = cleaned.split(/\n/);
            question = q ? q.trim() : '';
            answer = a.join(' ').trim();
        }
        // If answer contains another question, split it off
        const nextQ = answer.match(/(?:#+\s*)?(?:Question:?|Q:|\*\*Question:?\*\*)/i);
        if (nextQ) {
            answer = answer.slice(0, nextQ.index).trim();
        }
        return { question, answer };
    }

    const renderMarkdown = (text) => {
        try {
            if (!text || typeof text !== 'string') {
                return <p className="text-red-500">No valid Q&A content to display.</p>;
            }
            const fixed = fixLatexCommonErrors(text);
            const normalized = normalizeMathUnicode(fixed);
            const mathWrapped = autoWrapMath(normalized);
            return (
                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{mathWrapped}</ReactMarkdown>
            );
        } catch (err) {
            console.error('Error rendering Q&A Markdown:', err);
            setHasError(true);
            return <p className="text-red-500">Error rendering Q&A content. Please try again later.</p>;
        }
    };

    if (hasError) {
        return <p className="text-red-500">Something went wrong while rendering the quiz.</p>;
    }

    const blocks = splitQnABlocks(qnaText);

    return (
        <div className="flex flex-col gap-1">
            {blocks.map((block, idx) => {
                const { question, answer } = extractQA(block);
                if (!question && !answer) return null;
                return (
                    <div key={idx} className="mb-1 flex flex-col w-full animate-fade-in">
                        {question && (
                            <div className="px-3 py-1.5 rounded-t-lg rounded-br-lg w-full max-w-full text-base sm:text-xs font-extrabold bg-purple-200/50 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300" style={{ fontWeight: 800 }}>
                                {renderMarkdown(question)}
                            </div>
                        )}
                        {answer && (
                            <div className="px-3 py-1.5 rounded-b-lg rounded-tl-lg w-full max-w-full text-base sm:text-xs bg-gray-200/50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100" style={{ marginTop: question ? '-1px' : undefined }}>
                                {renderMarkdown(answer)}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

export default QuizPanel;
