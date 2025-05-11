
"use client";
import { useEffect }_from_ 'react';
import type { editor } from 'monaco-editor';
import { useAppContext } from '@/contexts/AppContext';
import { loader } from '@monaco-editor/react';

// Ensure Monaco is loaded from a consistent path or CDN
// loader.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.43.0/min/vs' } });
// If using local monaco-editor from node_modules, @monaco-editor/react usually handles this.

export function useMonacoTheme(monacoInstance?: typeof import('monaco-editor')): void {
  const { theme } = useAppContext();

  useEffect(() => {
    if (monacoInstance) {
      const monacoTheme = theme === 'dark' ? 'vs-dark' : 'vs';
      monacoInstance.editor.setTheme(monacoTheme);
    }
  }, [theme, monacoInstance]);
}

// This function helps to map file extensions to Monaco languages
export function getLanguageForFile(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'js':
    case 'jsx':
      return 'javascript';
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'json':
      return 'json';
    case 'css':
      return 'css';
    case 'html':
      return 'html';
    case 'md':
      return 'markdown';
    case 'py':
      return 'python';
    case 'java':
      return 'java';
    case 'c':
    case 'cpp':
      return 'cpp';
    case 'cs':
      return 'csharp';
    default:
      return 'plaintext';
  }
}
