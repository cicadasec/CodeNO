
"use client";
import React, { useEffect, useState, useRef } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Skeleton } from '@/components/ui/skeleton';

export function LivePreview() {
  const { activeFileId, getFormattedContent, fileContents } = useAppContext(); // Using fileContents to trigger updates
  const [iframeContent, setIframeContent] = useState<string>('');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (activeFileId) {
      // Use a timeout to debounce updates for performance, especially on fast typing
      const handler = setTimeout(() => {
        const content = getFormattedContent(activeFileId);
        setIframeContent(content);
      }, 300); // Adjust delay as needed

      return () => clearTimeout(handler);
    } else {
      setIframeContent('');
    }
  }, [activeFileId, getFormattedContent, fileContents]); // Depend on fileContents to re-render when any file changes

  // Security note: While srcDoc is generally safer than src with data URI for same-origin content,
  // sandboxing is still a good idea if user-generated content could be malicious.
  // For this app, assuming local code editing, it's less critical but good practice.
  return (
    <div className="h-full w-full bg-white">
      {iframeContent ? (
        <iframe
          ref={iframeRef}
          srcDoc={iframeContent}
          title="Live Preview"
          className="h-full w-full border-none"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals" // Adjust sandbox rules as needed
        />
      ) : (
         <div className="flex items-center justify-center h-full bg-muted text-muted-foreground">
            <p>Preview will appear here for HTML files.</p>
        </div>
      )}
    </div>
  );
}
