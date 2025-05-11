
"use client";
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from "react-resizable-panels";
import { FileExplorer } from '@/components/FileExplorer';
import { EditorPane } from '@/components/EditorPane';
import { OutputPane } from '@/components/OutputPane';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';

export function AppLayout() {
  const { saveActiveFile } = useAppContext();

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      <header className="h-12 border-b px-4 flex items-center justify-between shrink-0 bg-card">
        <div className="flex items-center gap-2">
          {/* You can use an actual SVG/Image logo here if you have one */}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-primary">
            <path d="M10 10l4 4m0-4l-4 4"/>
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          </svg>
          <h1 className="text-xl font-semibold text-foreground">CodeMirror Lite</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={saveActiveFile} title="Save Active File (Ctrl+S)">
            <Save className="h-5 w-5" />
          </Button>
          <ThemeToggle />
        </div>
      </header>
      <main className="flex-grow_overflow-hidden"> {/* Ensure PanelGroup takes remaining space */}
        <PanelGroup direction="horizontal" className="h-full w-full">
          <Panel id="file-explorer" defaultSize={20} minSize={15} maxSize={40} collapsible={true} className="bg-card">
            <FileExplorer />
          </Panel>
          <PanelResizeHandle className="resize-handle-horizontal w-[1px] bg-border data-[resize-handle-active]:bg-primary transition-colors">
            <div className="w-full h-full" />
          </PanelResizeHandle>
          <Panel id="main-content" defaultSize={80}>
            <PanelGroup direction="vertical" className="h-full">
              <Panel id="editor-pane" defaultSize={65} minSize={30}>
                <EditorPane />
              </Panel>
              <PanelResizeHandle className="resize-handle-vertical h-[1px] bg-border data-[resize-handle-active]:bg-primary transition-colors">
                <div className="w-full h-full" />
              </PanelResizeHandle>
              <Panel id="output-pane" defaultSize={35} minSize={20} collapsible={true}>
                <OutputPane />
              </Panel>
            </PanelGroup>
          </Panel>
        </PanelGroup>
      </main>
    </div>
  );
}
