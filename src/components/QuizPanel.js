import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function QuizPanel({ qnaText }) {
    const [hasError, setHasError] = useState(false);

    const renderMarkdown = () => {
  try {
    if (!qnaText || typeof qnaText !== 'string') {
      return <p className="text-red-500">No valid Q&A content to display.</p>;
    }
    return (
      <div className="text-gray-800 dark:text-gray-200">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{qnaText}</ReactMarkdown>
      </div>
    );
  } catch (err) {
    console.error('Error rendering Q&A Markdown:', err);
    setHasError(true);
    return <p className="text-red-500">Error rendering Q&A content. Please try again later.</p>;
  }
};

    return (
        <div>
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Q&A Quiz</h2>
            {hasError ? (
                <p className="text-red-500">Something went wrong while rendering the quiz.</p>
            ) : (
                renderMarkdown()
            )}
        </div>
    );
}

export default QuizPanel;
