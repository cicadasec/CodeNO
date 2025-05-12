
"use client";
import { useAppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { FileIcon } from './FileIcon';
import { X } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

export function EditorTabs() {
  const { openFiles, activeFileId, setActiveFileId, closeFile, fileSystem } = useAppContext();

  if (openFiles.length === 0) {
    return null; // Or some placeholder like "No files open"
  }

  return (
    <ScrollArea className="w-full whitespace-nowrap border-b bg-background">
      <div className="flex items-center h-10 px-2 space-x-1">
        {openFiles.map(file => {
          const fileData = fileSystem[file.id];
          return (
            <Button
              key={file.id}
              variant={activeFileId === file.id ? 'secondary' : 'ghost'}
              size="sm"
              className={`h-8 px-3 relative group ${activeFileId === file.id ? 'shadow-sm' : ''}`}
              onClick={() => setActiveFileId(file.id)}
            >
              <FileIcon type="file" name={file.name} className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="text-sm truncate mr-2">{file.name}</span>
              <X
                className="h-4 w-4 text-muted-foreground group-hover:text-foreground opacity-50 group-hover:opacity-100 absolute right-1 top-1/2 -translate-y-1/2 p-0.5 hover:bg-destructive/20 rounded-sm"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent Button onClick from firing
                  closeFile(file.id);
                }}
              />
            </Button>
          );
        })}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
