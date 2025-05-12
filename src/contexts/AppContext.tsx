"use client";
import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { AppContextType, FileSystemItem, OpenFile, Theme } from '@/types';
import useLocalStorage from '@/hooks/useLocalStorage';
import { toast } from '@/hooks/use-toast';

const AppContext = createContext<AppContextType | undefined>(undefined);

const generateId = () => crypto.randomUUID();

const initialFileSystemData: Record<string, FileSystemItem> = {
  'root': { id: 'root', name: 'Project', type: 'folder', parentId: null, childrenIds: ['index.html-id', 'style.css-id', 'script.js-id', 'assets-id'] },
  'index.html-id': { id: 'index.html-id', name: 'index.html', type: 'file', parentId: 'root' },
  'style.css-id': { id: 'style.css-id', name: 'style.css', type: 'file', parentId: 'root' },
  'script.js-id': { id: 'script.js-id', name: 'script.js', type: 'file', parentId: 'root' },
  'assets-id': {id: 'assets-id', name: 'assets', type: 'folder', parentId: 'root', childrenIds: []}
};

const initialFileContents: Record<string, string> = {
  'index.html-id': `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Page</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <h1>Hello, CodeMirror!</h1>
    <p>Edit this content and see the live preview update.</p>
    <script src="script.js"></script>
</body>
</html>`,
  'style.css-id': `body {
    font-family: Arial, sans-serif;
    margin: 20px;
    background-color: #f0f0f0;
    color: #333;
}

h1 {
    color: var(--primary-color, teal); /* Example using CSS var */
}`,
  'script.js-id': `console.log("Hello from script.js!");

document.addEventListener('DOMContentLoaded', () => {
    const heading = document.querySelector('h1');
    if (heading) {
        heading.textContent += ' (JS Loaded)';
    }
});`
};

const initialOpenFiles: OpenFile[] = [];
const initialActiveFileId: string | null = null;
const initialTheme: Theme = 'light';
const initialCurrentPath: string[] = ['root'];


export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [hasMounted, setHasMounted] = useState(false);

  const [rawFileSystem, setRawFileSystem] = useLocalStorage<Record<string, FileSystemItem>>('codemirror-fs', initialFileSystemData);
  const [rawFileContents, setRawFileContents] = useLocalStorage<Record<string, string>>('codemirror-fc', initialFileContents);
  const [rawOpenFiles, setRawOpenFiles] = useLocalStorage<OpenFile[]>('codemirror-openfiles', initialOpenFiles);
  const [rawActiveFileId, setRawActiveFileIdState] = useLocalStorage<string | null>('codemirror-activefile', initialActiveFileId);
  const [rawTheme, setRawThemeState] = useLocalStorage<Theme>('codemirror-theme', initialTheme);
  const [rawCurrentPath, setRawCurrentPath] = useLocalStorage<string[]>('codemirror-currentpath', initialCurrentPath); // Path IDs

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const fileSystem = hasMounted ? rawFileSystem : initialFileSystemData;
  const fileContents = hasMounted ? rawFileContents : initialFileContents;
  const openFiles = hasMounted ? rawOpenFiles : initialOpenFiles;
  const activeFileId = hasMounted ? rawActiveFileId : initialActiveFileId;
  const theme = hasMounted ? rawTheme : initialTheme;
  const currentPathIds = hasMounted ? rawCurrentPath : initialCurrentPath;


  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setRawThemeState(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  }, [setRawThemeState]);

  const setActiveFileId = useCallback((id: string | null) => {
    setRawActiveFileIdState(id);
  }, [setRawActiveFileIdState]);

  const addFile = useCallback((name: string, parentId: string) => {
    const parent = fileSystem[parentId];
    if (!parent || parent.type !== 'folder') {
      toast({ title: "Error", description: "Parent must be a folder.", variant: "destructive" });
      return;
    }
    if (parent.childrenIds?.some(childId => fileSystem[childId]?.name === name)) {
      toast({ title: "Error", description: `File or folder named "${name}" already exists in this directory.`, variant: "destructive" });
      return;
    }

    const id = generateId();
    const newFile: FileSystemItem = { id, name, type: 'file', parentId };
    setRawFileSystem(prev => ({
      ...prev,
      [id]: newFile,
      [parentId]: { ...prev[parentId], childrenIds: [...(prev[parentId]?.childrenIds || []), id] }
    }));
    setRawFileContents(prev => ({ ...prev, [id]: '' }));
    toast({ title: "Success", description: `File "${name}" created.` });
  }, [fileSystem, setRawFileSystem, setRawFileContents]);

  const addFolder = useCallback((name: string, parentId: string) => {
    const parent = fileSystem[parentId];
     if (!parent || parent.type !== 'folder') {
      toast({ title: "Error", description: "Parent must be a folder.", variant: "destructive" });
      return;
    }
    if (parent.childrenIds?.some(childId => fileSystem[childId]?.name === name)) {
      toast({ title: "Error", description: `File or folder named "${name}" already exists in this directory.`, variant: "destructive" });
      return;
    }
    const id = generateId();
    const newFolder: FileSystemItem = { id, name, type: 'folder', parentId, childrenIds: [] };
    setRawFileSystem(prev => ({
      ...prev,
      [id]: newFolder,
      [parentId]: { ...prev[parentId], childrenIds: [...(prev[parentId]?.childrenIds || []), id] }
    }));
    toast({ title: "Success", description: `Folder "${name}" created.` });
  }, [fileSystem, setRawFileSystem]);

  const renameItem = useCallback((id: string, newName: string) => {
    const item = fileSystem[id];
    if (!item) return;
    const parent = item.parentId ? fileSystem[item.parentId] : null;
    if (parent && parent.childrenIds?.some(childId => childId !== id && fileSystem[childId]?.name === newName)) {
      toast({ title: "Error", description: `An item named "${newName}" already exists in this directory.`, variant: "destructive" });
      return;
    }

    setRawFileSystem(prev => ({ ...prev, [id]: { ...prev[id], name: newName } }));
    setRawOpenFiles(prevOpen => prevOpen.map(f => f.id === id ? {...f, name: newName} : f));
    toast({ title: "Success", description: `Item renamed to "${newName}".` });
  }, [fileSystem, setRawFileSystem, setRawOpenFiles]);

  const deleteItemRecursive = useCallback((itemId: string, currentFs: Record<string, FileSystemItem>, currentFc: Record<string, string>) => {
    const item = currentFs[itemId];
    if (!item) return { updatedFs: currentFs, updatedFc: currentFc };

    let updatedFs = { ...currentFs };
    let updatedFc = { ...currentFc };

    if (item.type === 'folder' && item.childrenIds) {
      for (const childId of item.childrenIds) {
        const result = deleteItemRecursive(childId, updatedFs, updatedFc);
        updatedFs = result.updatedFs;
        updatedFc = result.updatedFc;
      }
    }
    
    if (item.type === 'file') {
      delete updatedFc[itemId];
    }
    
    delete updatedFs[itemId];

    if (item.parentId && updatedFs[item.parentId]) {
      updatedFs[item.parentId] = {
        ...updatedFs[item.parentId],
        childrenIds: updatedFs[item.parentId].childrenIds?.filter(id => id !== itemId)
      };
    }
    return { updatedFs, updatedFc };
  }, []);

  const deleteItem = useCallback((id: string) => {
    if (id === 'root') {
      toast({ title: "Error", description: "Cannot delete root project folder.", variant: "destructive" });
      return;
    }
    const item = fileSystem[id];
    if (!item) return;

    const { updatedFs, updatedFc } = deleteItemRecursive(id, fileSystem, fileContents);
    
    setRawFileSystem(updatedFs);
    setRawFileContents(updatedFc);

    setRawOpenFiles(prevOpen => prevOpen.filter(f => f.id !== id && !Object.keys(updatedFc).includes(f.id)));

    if (activeFileId === id || (item.type === 'folder' && openFiles.some(f => f.id.startsWith(id)))) {
      setActiveFileId(null);
    }
    toast({ title: "Success", description: `Item "${item.name}" deleted.` });
  }, [fileSystem, fileContents, activeFileId, openFiles, deleteItemRecursive, setRawFileSystem, setRawFileContents, setRawOpenFiles, setActiveFileId]);
  
  const openFile = useCallback((id: string) => {
    const item = fileSystem[id];
    if (!item || item.type !== 'file') return;
    if (!openFiles.find(f => f.id === id)) {
      setRawOpenFiles(prev => [...prev, { id, name: item.name }]);
    }
    setActiveFileId(id);
  }, [fileSystem, openFiles, setRawOpenFiles, setActiveFileId]);

  const closeFile = useCallback((id: string) => {
    setRawOpenFiles(prev => prev.filter(f => f.id !== id));
    if (activeFileId === id) {
      const remainingFiles = openFiles.filter(f => f.id !== id); // uses potentially stale openFiles from closure
      // To get the latest openFiles state if relying on it for next active:
      setRawOpenFiles(currentOpenFiles => {
        const filtered = currentOpenFiles.filter(f => f.id !==id);
        setActiveFileId(filtered.length > 0 ? filtered[0].id : null);
        return filtered;
      })
    }
  }, [activeFileId, openFiles, setRawOpenFiles, setActiveFileId]);


  const updateFileContent = useCallback((id: string, content: string) => {
    setRawFileContents(prev => ({ ...prev, [id]: content }));
  }, [setRawFileContents]);

  const saveFile = useCallback((id: string) => {
    toast({ title: "Saved", description: `${fileSystem[id]?.name} saved.` });
  }, [fileSystem]);

  const saveActiveFile = useCallback(() => {
    if (activeFileId) {
      saveFile(activeFileId);
    }
  }, [activeFileId, saveFile]);

  const getFormattedContent = useCallback((fileId: string): string => {
    const file = fileSystem[fileId];
    if (!file || file.type !== 'file') return '';
    
    const content = fileContents[fileId] || '';

    if (file.name.endsWith('.html')) {
      const parentDir = fileSystem[file.parentId!];
      let cssContent = '';
      let jsContent = '';

      if (parentDir && parentDir.childrenIds) {
        const styleFile = parentDir.childrenIds.map(id => fileSystem[id]).find(item => item?.name === 'style.css');
        if (styleFile && fileContents[styleFile.id]) {
          cssContent = `<style>\n${fileContents[styleFile.id]}\n</style>`;
        }
        
        const scriptFile = parentDir.childrenIds.map(id => fileSystem[id]).find(item => item?.name === 'script.js');
        if (scriptFile && fileContents[scriptFile.id]) {
          jsContent = `<script>\n${fileContents[scriptFile.id]}\n</script>`;
        }
      }
      
      let html = content;
      if (cssContent) {
        if (html.includes("</head>")) {
          html = html.replace("</head>", `${cssContent}\n</head>`);
        } else {
          html = `${cssContent}\n${html}`; 
        }
      }
      if (jsContent) {
         if (html.includes("</body>")) {
          html = html.replace("</body>", `${jsContent}\n</body>`);
        } else {
          html = `${html}\n${jsContent}`;
        }
      }
      return html;
    }
    return content;
  }, [fileSystem, fileContents]);

  const getCurrentDirectoryId = useCallback(() => currentPathIds[currentPathIds.length - 1] || 'root', [currentPathIds]);
  
  const currentDirectoryItems = useCallback(() => {
    if (!hasMounted) return []; // Don't compute if not mounted / fileSystem is initial
    const dirId = getCurrentDirectoryId();
    const dir = fileSystem[dirId];
    if (dir && dir.type === 'folder' && dir.childrenIds) {
      return dir.childrenIds.map(id => fileSystem[id]).filter(Boolean) as FileSystemItem[];
    }
    return [];
  }, [fileSystem, getCurrentDirectoryId, hasMounted]);

  const getItemByPath = useCallback((path: string): FileSystemItem | null => {
    if (!hasMounted && path !== '/' && path !== '') return null; // Avoid complex logic if not mounted, allow root
    const currentFs = hasMounted ? rawFileSystem : initialFileSystemData;
    const currentFsCurrentPathIds = hasMounted ? rawCurrentPath : initialCurrentPath;
    
    const parts = path.split('/').filter(p => p);
    let currentItemId = currentFsCurrentPathIds[currentFsCurrentPathIds.length -1] || 'root';

    if (path === '/' || path === '') return currentFs['root'];
    
    if (!path.startsWith('/')) {
      // currentItemId is already set to the last ID of current path
    } else {
        currentItemId = 'root'; // Absolute path starts from root
    }
    
    for (const part of parts) {
      if (part === '.') continue;
      if (part === '..') {
        const currentItem = currentFs[currentItemId];
        if (currentItem && currentItem.parentId) {
          currentItemId = currentItem.parentId;
        } else {
          return null; 
        }
        continue;
      }
      
      const currentDir = currentFs[currentItemId];
      if (!currentDir || currentDir.type !== 'folder' || !currentDir.childrenIds) return null;
      
      const foundChildId = currentDir.childrenIds.find(id => currentFs[id]?.name === part);
      if (!foundChildId) return null;
      currentItemId = foundChildId;
    }
    return currentFs[currentItemId] || null;
  }, [hasMounted, rawFileSystem, rawCurrentPath]);


  const changeDirectory = useCallback((path: string): boolean => {
    const targetItem = getItemByPath(path);
    if (targetItem && targetItem.type === 'folder') {
      const newPathIds: string[] = [];
      let current = targetItem;
      const currentFs = hasMounted ? rawFileSystem : initialFileSystemData;
      while(current) {
        newPathIds.unshift(current.id);
        if (!current.parentId) break;
        current = currentFs[current.parentId];
      }
      setRawCurrentPath(newPathIds.length > 0 ? newPathIds : ['root']);
      return true;
    }
    return false;
  }, [getItemByPath, hasMounted, rawFileSystem, setRawCurrentPath]);

  const getAbsolutePath = useCallback((targetPathInput: string): string => {
    if (!hasMounted && targetPathInput !== '/') return "/";
    const currentFs = hasMounted ? rawFileSystem : initialFileSystemData;
    const item = getItemByPath(targetPathInput); // getItemByPath now respects hasMounted
    if (!item) return "/"; 
    
    const pathParts: string[] = [];
    let current = item;
    while(current && current.id !== 'root') {
        pathParts.unshift(current.name);
        if (!current.parentId) break; 
        current = currentFs[current.parentId];
    }
    return `/${pathParts.join('/')}`;
  }, [getItemByPath, hasMounted, rawFileSystem]);


  const getFilePath = useCallback((itemName: string): string | null => {
    if (!hasMounted) return null;
    const dirId = getCurrentDirectoryId();
    const dir = fileSystem[dirId];
    if (dir && dir.type === 'folder' && dir.childrenIds) {
      const item = dir.childrenIds.map(id => fileSystem[id]).find(child => child?.name === itemName);
      return item ? item.id : null;
    }
    return null;
  }, [fileSystem, getCurrentDirectoryId, hasMounted]);

  const readFileContent = useCallback((filePathId: string): string | undefined => {
    if (!hasMounted) return undefined;
    const item = fileSystem[filePathId];
    if (item && item.type === 'file') {
      return fileContents[filePathId];
    }
    return undefined;
  }, [fileSystem, fileContents, hasMounted]);

  const contextValue: AppContextType = {
    fileSystem,
    rootId: 'root',
    openFiles,
    activeFileId,
    fileContents,
    theme,
    toggleTheme,
    addFile, addFolder, renameItem, deleteItem, openFile, closeFile, setActiveFileId,
    updateFileContent, saveFile, saveActiveFile, getFormattedContent,
    currentPath: currentPathIds.map(id => (hasMounted ? rawFileSystem[id]?.name : initialFileSystemData[id]?.name) || 'unknown'),
    currentDirectoryItems, changeDirectory, getFilePath, readFileContent, getAbsolutePath, getItemByPath,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
