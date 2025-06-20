import React from "react";

export default function VideoPanel({ theme, embedUrl, videoSummary }) {
  return (
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
  );
}
