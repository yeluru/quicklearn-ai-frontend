import React, { useEffect, useRef } from "react";
import MarkdownSummary from "./MarkdownSummary";

export default function VideoPanel({ theme, embedUrl, videoSummary }) {
  const iframeRef = useRef(null);

  useEffect(() => {
    // Force iframe to reload when component mounts or embedUrl changes
    if (iframeRef.current && embedUrl) {
      const iframe = iframeRef.current;

      // Temporarily clear src and set it back to force reload
      iframe.src = '';
      setTimeout(() => {
        iframe.src = embedUrl;
      }, 100);
    }
  }, [embedUrl]);

  return (
    <div className={`w-full ${theme === 'dark' ? 'bg-gray-800/50' : 'bg-white/50'} rounded-xl p-4 flex flex-col gap-4`}>
      <div className="relative w-full aspect-video">
        <iframe
          ref={iframeRef}
          className="absolute top-0 left-0 w-full h-full rounded-lg"
          src={embedUrl}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="Embedded Video"
        />
      </div>
      <div className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
        <MarkdownSummary summary={videoSummary || 'Loading summary...'} theme={theme} />
      </div>
    </div>
  );
}
