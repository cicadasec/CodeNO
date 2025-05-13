
"use client";
import type { ImperativePanelHandle } from "react-resizable-panels";
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from "react-resizable-panels";
import dynamic from 'next/dynamic';
import React, { useRef, useEffect, useCallback } from 'react';
import { FileExplorer } from '@/components/FileExplorer';
import { EditorPane } from '@/components/EditorPane';
import { LivePreview } from '@/components/LivePreview';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Skeleton } from "@/components/ui/skeleton";
import { Save, Terminal, Download, PanelLeft, PanelRight } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';
import { useIsMobile } from '@/hooks/use-mobile';

const TerminalComponentWithNoSSR = dynamic(
  () => import('@/components/TerminalComponent').then(mod => mod.TerminalComponent),
  {
    ssr: false,
    loading: () => <Skeleton className="w-full h-full" />
  }
);

export function AppLayout() {
  const { saveActiveFile, isTerminalOpen, toggleTerminal, downloadProject } = useAppContext();
  const isMobile = useIsMobile();

  const fileExplorerPanelRef = useRef<ImperativePanelHandle>(null);
  const previewPanelRef = useRef<ImperativePanelHandle>(null);

  const togglePanel = useCallback((panelRef: React.RefObject<ImperativePanelHandle>) => {
    const panel = panelRef.current;
    if (panel) {
      // A panel is collapsed if its size is 0 (given collapsedSize={0})
      if (panel.getSize() === 0) {
        panel.expand();
      } else {
        panel.collapse();
      }
    }
  }, []);

  useEffect(() => {
    // This effect should run after initial mount and `isMobile` is determined.
    // We ensure refs are current before calling methods on them.
    if (isMobile) {
      if (fileExplorerPanelRef.current?.getSize() !== 0) {
        fileExplorerPanelRef.current?.collapse();
      }
      if (previewPanelRef.current?.getSize() !== 0) {
        previewPanelRef.current?.collapse();
      }
    } else {
      // On desktop, expand panels if they are collapsed, or restore previous size if logic was implemented.
      // For now, just expand if they were collapsed (e.g., by mobile view).
      if (fileExplorerPanelRef.current?.getSize() === 0) {
         fileExplorerPanelRef.current?.expand();
      }
      if (previewPanelRef.current?.getSize() === 0) {
         previewPanelRef.current?.expand();
      }
    }
  }, [isMobile]);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      <header className="h-12 border-b px-2 sm:px-4 flex items-center justify-between shrink-0 bg-card text-card-foreground">
        <div className="flex items-center gap-1 sm:gap-2">
          {isMobile && (
            <Button variant="ghost" size="icon" onClick={() => togglePanel(fileExplorerPanelRef)} title="Toggle File Explorer" className="md:hidden">
              <PanelLeft className="h-5 w-5" />
            </Button>
          )}
          <Terminal className="h-6 w-6 text-primary" />
          <h1 className="text-lg sm:text-xl font-semibold hidden sm:block">Code NO</h1>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
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
          {isMobile && (
             <Button variant="ghost" size="icon" onClick={() => togglePanel(previewPanelRef)} title="Toggle Preview Panel" className="md:hidden">
              <PanelRight className="h-5 w-5" />
            </Button>
          )}
        </div>
      </header>
      <main className="flex-grow overflow-hidden">
        <PanelGroup direction="horizontal" className="h-full w-full">
          {/* Left Panel: File Explorer */}
          <Panel 
            id="file-explorer" 
            ref={fileExplorerPanelRef}
            defaultSize={isMobile ? 0 : 20} 
            minSize={isMobile ? 0 : 15} 
            maxSize={35} 
            collapsible={true} 
            collapsedSize={0}
            className="bg-card"
          >
            <FileExplorer />
          </Panel>
          <PanelResizeHandle className="resize-handle-horizontal w-[1px] bg-border data-[resize-handle-active]:bg-primary transition-colors">
            <div className="w-full h-full" />
          </PanelResizeHandle>

          {/* Middle Panel: Editor and Terminal */}
          <Panel id="middle-content" defaultSize={isMobile ? 100 : 50} minSize={30}>
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
          <Panel 
            id="preview-pane" 
            ref={previewPanelRef}
            defaultSize={isMobile ? 0 : 30} 
            minSize={isMobile ? 0 : 20} 
            collapsible={true}
            collapsedSize={0}
          >
            <LivePreview />
          </Panel>
        </PanelGroup>
      </main>
    </div>
  );
}

