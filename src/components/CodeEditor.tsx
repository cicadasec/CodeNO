
"use client";
import React, { useRef, useEffect } from 'react';
import Editor, { useMonaco, loader } from '@monaco-editor/react';
import type { editor as MonacoEditorTypes } from 'monaco-editor';
import { useAppContext } from '@/contexts/AppContext';
import { useMonacoTheme, getLanguageForFile } from '@/hooks/useMonaco';
import { Skeleton } from '@/components/ui/skeleton';

// It's good practice to call loader.init() once, you can do this in a top-level component or layout
// For Next.js, if you encounter issues, you might need to do this in `_app.js` or a client component that always mounts.
// loader.init().then(monaco => { /* ... */ });

export function CodeEditor() {
  const { activeFileId, fileSystem, fileContents, updateFileContent, saveActiveFile, theme } = useAppContext();
  const editorRef = useRef<MonacoEditorTypes.IStandaloneCodeEditor | null>(null);
  const monaco = useMonaco();
  useMonacoTheme(monaco || undefined); // Pass monaco instance to theme hook

  const activeFile = activeFileId ? fileSystem[activeFileId] : null;
  const currentContent = activeFileId ? fileContents[activeFileId] : '';

  function handleEditorDidMount(editor: MonacoEditorTypes.IStandaloneCodeEditor) {
    editorRef.current = editor;
    // You can add custom keybindings here
    editor.addCommand(monaco?.KeyMod.CtrlCmd | monaco?.KeyCode.KeyS, () => {
      saveActiveFile();
    });
  }

  useEffect(() => {
    // If monaco is not yet available, it might still be loading.
    // The theme will be applied by useMonacoTheme once monaco instance is ready.
    if (monaco && editorRef.current) {
        monaco.editor.setTheme(theme === 'dark' ? 'vs-dark' : 'vs');
    }
  }, [theme, monaco]);


  if (!activeFileId || !activeFile) {
    return (
      <div className="flex items-center justify-center h-full bg-muted text-muted-foreground">
        <p>Select a file to start editing or create a new one.</p>
      </div>
    );
  }

  const language = getLanguageForFile(activeFile.name);

  return (
    <Editor
      height="100%"
      language={language}
      value={currentContent}
      theme={theme === 'dark' ? 'vs-dark' : 'vs'} // Initial theme, will be updated by hook
      onMount={handleEditorDidMount}
      onChange={(value) => updateFileContent(activeFileId, value || '')}
      loading={<Skeleton className="w-full h-full" />}
      options={{
        minimap: { enabled: true },
        fontSize: 14,
        wordWrap: 'on',
        scrollBeyondLastLine: false,
        automaticLayout: true, // Important for resizable panels
      }}
    />
  );
}
