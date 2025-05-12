
"use client";
import React, { useEffect, useState, useRef } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function LivePreview() {
  const { activeFileId, getFormattedContent, fileContents, fileSystem } = useAppContext();
  const [iframeContent, setIframeContent] = useState<string>('');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (activeFileId) {
      const handler = setTimeout(() => {
        const content = getFormattedContent(activeFileId);
        setIframeContent(content);
      }, 300);

      return () => clearTimeout(handler);
    } else {
      setIframeContent('');
    }
  }, [activeFileId, getFormattedContent, fileContents]);

  const handleOpenInNewTab = () => {
    if (iframeContent) {
      const newTab = window.open('', '_blank');
      if (newTab) {
        newTab.document.open();
        const activeFileName = activeFileId ? fileSystem[activeFileId]?.name : "Preview";
        newTab.document.title = `${activeFileName} - Preview - Code NO`;
        newTab.document.write(iframeContent);
        newTab.document.close();
      } else {
        toast({
          title: "Popup Blocked",
          description: "Please allow popups for this site to open the preview in a new tab.",
          variant: "destructive",
        });
      }
    }
  };

  const activeFile = activeFileId ? fileSystem[activeFileId] : null;
  const canPreview = activeFile && activeFile.name.endsWith('.html');


  return (
    <div className="h-full w-full flex flex-col bg-background">
      <div className="p-2 border-b flex justify-between items-center bg-card h-12 shrink-0">
        <span className="text-sm font-medium text-card-foreground">
          {activeFile && canPreview ? `${activeFile.name} - Preview` : "Live Preview"}
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleOpenInNewTab}
          disabled={!iframeContent || !canPreview}
          title="Open preview in new tab"
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex-grow overflow-auto bg-white">
        {iframeContent && canPreview ? (
          <iframe
            ref={iframeRef}
            srcDoc={iframeContent}
            title="Live Preview Panel"
            className="h-full w-full border-none"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-muted text-muted-foreground p-4 text-center">
            <p>
              {activeFile ? 
                (canPreview ? "Generating preview..." : `Live preview is only available for HTML files. Select an HTML file to see its preview.`) :
                "Select an HTML file to see its live preview."
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

