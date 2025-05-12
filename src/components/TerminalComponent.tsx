
"use client";
import React, { useEffect, useRef, useCallback } from 'react';
import type { Terminal as XTermTerminal } from 'xterm'; // Renamed to avoid conflict
import type { FitAddon as XTermFitAddon } from 'xterm-addon-fit'; // Renamed to avoid conflict
import 'xterm/css/xterm.css';
import { useAppContext } from '@/contexts/AppContext';
import type { FileSystemItem } from '@/types';

export function TerminalComponent() {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermInstanceRef = useRef<XTermTerminal | null>(null); // Use renamed type
  const fitAddonInstanceRef = useRef<XTermFitAddon | null>(null); // Use renamed type
  const { 
    theme, 
    currentPath, 
    currentDirectoryItems, 
    changeDirectory, 
    getFilePath, 
    readFileContent,
    addFile, addFolder,
    getAbsolutePath,
    getItemByPath
  } = useAppContext();
  
  const prompt = useCallback(() => {
    const pathString = currentPath.join('/') || '/';
    xtermInstanceRef.current?.write(`\r\n${pathString} $ `);
  }, [currentPath]);

  useEffect(() => {
    let term: XTermTerminal | null = null;
    let fitAddon: XTermFitAddon | null = null;
    let resizeObserver: ResizeObserver | null = null;

    if (terminalRef.current && !xtermInstanceRef.current && typeof window !== 'undefined') {
      // Dynamically import Terminal and FitAddon only on the client-side
      Promise.all([
        import('xterm').then(mod => mod.Terminal),
        import('xterm-addon-fit').then(mod => mod.FitAddon)
      ]).then(([TerminalClass, FitAddonClass]) => {
        if (!terminalRef.current) return; // Check if component is still mounted

        term = new TerminalClass({
          cursorBlink: true,
          fontFamily: 'Menlo, "DejaVu Sans Mono", Consolas, "Lucida Console", monospace',
          fontSize: 14,
          theme: theme === 'dark' ? {
            background: '#1e1e1e',
            foreground: '#d4d4d4',
            cursor: '#d4d4d4',
          } : {
            background: '#ffffff',
            foreground: '#333333',
            cursor: '#333333',
          }
        });
        fitAddon = new FitAddonClass();
        
        xtermInstanceRef.current = term;
        fitAddonInstanceRef.current = fitAddon;
        
        term.loadAddon(fitAddon);
        term.open(terminalRef.current);
        fitAddon.fit();

        term.writeln('Welcome to Code NO Terminal!');
        term.writeln('Supported commands: ls, cat <file>, cd <dir>, clear, pwd, mkdir <dirname>, touch <filename>');
        prompt();

        let command = '';
        term.onData(e => {
          switch (e) {
            case '\r': // Enter
              if (command.trim()) {
                term?.writeln(''); // New line after command
                processCommand(command.trim());
              }
              command = '';
              prompt();
              break;
            case '\u007F': // Backspace
              if (command.length > 0) {
                term?.write('\b \b');
                command = command.slice(0, -1);
              }
              break;
            default: // Print all other characters
              if (e >= String.fromCharCode(0x20) && e <= String.fromCharCode(0x7E) || e >= '\u00a0') {
                command += e;
                term?.write(e);
              }
          }
        });

        // Handle resize
        if (terminalRef.current) {
          resizeObserver = new ResizeObserver(() => {
            fitAddonInstanceRef.current?.fit();
          });
          resizeObserver.observe(terminalRef.current);
        }
      }).catch(error => console.error("Failed to load xterm modules", error));
    }
    
    return () => {
      if (xtermInstanceRef.current) {
        // xtermInstanceRef.current.dispose(); // Consider if dispose is needed on every unmount or only final
        // xtermInstanceRef.current = null;
      }
      if (resizeObserver && terminalRef.current) {
        resizeObserver.unobserve(terminalRef.current);
      }
    };
  }, [prompt, theme]); // Added theme to dependencies for initial setup if needed

  useEffect(() => {
    if (xtermInstanceRef.current) {
      xtermInstanceRef.current.options.theme = theme === 'dark' ? {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#d4d4d4',
      } : {
        background: '#ffffff',
        foreground: '#333333',
        cursor: '#333333',
      };
    }
  }, [theme]);

  const processCommand = (cmd: string) => {
    const [action, ...args] = cmd.split(' ');
    const term = xtermInstanceRef.current;
    if (!term) return;

    switch (action) {
      case 'ls':
        const items = currentDirectoryItems();
        if (items.length === 0) {
          term.writeln('Directory is empty.');
        } else {
          items.forEach(item => {
            term.writeln(`${item.name}${item.type === 'folder' ? '/' : ''}`);
          });
        }
        break;
      case 'cat':
        if (args.length > 0) {
          const targetItem = getItemByPath(args.join(' '));
          if (targetItem && targetItem.type === 'file') {
            const content = readFileContent(targetItem.id);
            term.write((content || '(empty file)').replace(/\n/g, '\r\n'));
          } else {
            term.writeln(`cat: ${args.join(' ')}: No such file or not a file`);
          }
        } else {
          term.writeln('cat: missing operand');
        }
        break;
      case 'cd':
        if (args.length > 0) {
          if (!changeDirectory(args.join(' '))) {
            term.writeln(`cd: ${args.join(' ')}: No such directory`);
          }
        } else {
           changeDirectory('/'); // cd to root
        }
        break;
      case 'clear':
        term.clear();
        break;
      case 'pwd':
        term.writeln(getAbsolutePath(currentPath[currentPath.length-1] || '/'));
        break;
      case 'mkdir':
        if (args.length > 0) {
          const dirName = args.join(' ');
          const currentDirId = getItemByPath(currentPath.join('/'))?.id || 'root';
          addFolder(dirName, currentDirId);
          term.writeln(`Created directory: ${dirName}`);
        } else {
          term.writeln('mkdir: missing operand');
        }
        break;
      case 'touch':
        if (args.length > 0) {
          const fileName = args.join(' ');
          const currentDirId = getItemByPath(currentPath.join('/'))?.id || 'root';
          addFile(fileName, currentDirId);
          term.writeln(`Created file: ${fileName}`);
        } else {
          term.writeln('touch: missing operand');
        }
        break;
      default:
        term.writeln(`${action}: command not found`);
    }
  };

  return <div ref={terminalRef} className="h-full w-full p-1 bg-background" />;
}
