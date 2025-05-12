
"use client";
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from "react-resizable-panels";
import dynamic from 'next/dynamic';
import { FileExplorer } from '@/components/FileExplorer';
import { EditorPane } from '@/components/EditorPane';
import { LivePreview } from '@/components/LivePreview';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Skeleton } from "@/components/ui/skeleton";
import { Save, Terminal, Download } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';

const TerminalComponentWithNoSSR = dynamic(
  () => import('@/components/TerminalComponent').then(mod => mod.TerminalComponent),
  {
    ssr: false,
    loading: () => <Skeleton className="w-full h-full" />
  }
);

export function AppLayout() {
  const { saveActiveFile, isTerminalOpen, toggleTerminal, downloadProject } = useAppContext();

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      <header className="h-12 border-b px-4 flex items-center justify-between shrink-0 bg-card">
        <div className="flex items-center gap-2">
          <Terminal className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-semibold text-foreground">Code NO</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={saveActiveFile} title="Save Active File (Ctrl+S)">
            <Save className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={downloadProject} title="Download Project as ZIP">
            <Download className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={toggleTerminal} title="Toggle Terminal Panel">
            <Terminal className="h-5 w-5" />
          </Button>
          <ThemeToggle />
        </div>
      </header>
      <main className="flex-grow overflow-hidden">
        <PanelGroup direction="horizontal" className="h-full w-full">
          {/* Left Panel: File Explorer */}
          <Panel id="file-explorer" defaultSize={20} minSize={15} maxSize={35} collapsible={true} className="bg-card">
            <FileExplorer />
          </Panel>
          <PanelResizeHandle className="resize-handle-horizontal w-[1px] bg-border data-[resize-handle-active]:bg-primary transition-colors">
            <div className="w-full h-full" />
          </PanelResizeHandle>

          {/* Middle Panel: Editor and Terminal */}
          <Panel id="middle-content" defaultSize={50} minSize={30}>
            {isTerminalOpen ? (
              <PanelGroup direction="vertical" className="h-full">
                <Panel id="editor-pane" defaultSize={65} minSize={30}>
                  <EditorPane />
                </Panel>
                <PanelResizeHandle className="resize-handle-vertical h-[1px] bg-border data-[resize-handle-active]:bg-primary transition-colors">
                  <div className="w-full h-full" />
                </PanelResizeHandle>
                <Panel id="terminal-pane" defaultSize={35} minSize={20} collapsible={true}>
                  <TerminalComponentWithNoSSR />
                </Panel>
              </PanelGroup>
            ) : (
              <EditorPane />
            )}
          </Panel>
          <PanelResizeHandle className="resize-handle-horizontal w-[1px] bg-border data-[resize-handle-active]:bg-primary transition-colors">
            <div className="w-full h-full" />
          </PanelResizeHandle>

          {/* Right Panel: Preview */}
          <Panel id="preview-pane" defaultSize={30} minSize={20} collapsible={true}>
            <LivePreview />
          </Panel>
        </PanelGroup>
      </main>
    </div>
  );
}

