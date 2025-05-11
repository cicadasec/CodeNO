
"use client";
import { EditorTabs } from './EditorTabs';
import { CodeEditor } from './CodeEditor';

export function EditorPane() {
  return (
    <div className="h-full flex flex-col bg-background">
      <EditorTabs />
      <div className="flex-grow_h-full_overflow-hidden"> {/* Ensure CodeEditor takes remaining space */}
         <CodeEditor />
      </div>
    </div>
  );
}
