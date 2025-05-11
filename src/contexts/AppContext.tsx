
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


export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [fileSystem, setFileSystem] = useLocalStorage<Record<string, FileSystemItem>>('codemirror-fs', initialFileSystemData);
  const [fileContents, setFileContents] = useLocalStorage<Record<string, string>>('codemirror-fc', initialFileContents);
  const [openFiles, setOpenFiles] = useLocalStorage<OpenFile[]>('codemirror-openfiles', []);
  const [activeFileId, setActiveFileIdState] = useLocalStorage<string | null>('codemirror-activefile', null);
  const [theme, setThemeState] = useLocalStorage<Theme>('codemirror-theme', 'light');
  const [currentPath, setCurrentPath] = useLocalStorage<string[]>('codemirror-currentpath', ['root']); // Path IDs

  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setThemeState(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  }, [setThemeState]);

  const setActiveFileId = useCallback((id: string | null) => {
    setActiveFileIdState(id);
  }, [setActiveFileIdState]);

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
    setFileSystem(prev => ({
      ...prev,
      [id]: newFile,
      [parentId]: { ...parent, childrenIds: [...(parent.childrenIds || []), id] }
    }));
    setFileContents(prev => ({ ...prev, [id]: '' }));
    toast({ title: "Success", description: `File "${name}" created.` });
  }, [fileSystem, setFileSystem, setFileContents]);

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
    setFileSystem(prev => ({
      ...prev,
      [id]: newFolder,
      [parentId]: { ...parent, childrenIds: [...(parent.childrenIds || []), id] }
    }));
    toast({ title: "Success", description: `Folder "${name}" created.` });
  }, [fileSystem, setFileSystem]);

  const renameItem = useCallback((id: string, newName: string) => {
    const item = fileSystem[id];
    if (!item) return;
    const parent = item.parentId ? fileSystem[item.parentId] : null;
    if (parent && parent.childrenIds?.some(childId => childId !== id && fileSystem[childId]?.name === newName)) {
      toast({ title: "Error", description: `An item named "${newName}" already exists in this directory.`, variant: "destructive" });
      return;
    }

    setFileSystem(prev => ({ ...prev, [id]: { ...item, name: newName } }));
    setOpenFiles(prevOpen => prevOpen.map(f => f.id === id ? {...f, name: newName} : f));
    toast({ title: "Success", description: `Item renamed to "${newName}".` });
  }, [fileSystem, setFileSystem, setOpenFiles]);

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
    
    // Remove content if it's a file
    if (item.type === 'file') {
      delete updatedFc[itemId];
    }
    
    // Remove item itself
    delete updatedFs[itemId];

    // Remove from parent's childrenIds
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
    
    setFileSystem(updatedFs);
    setFileContents(updatedFc);

    setOpenFiles(prevOpen => prevOpen.filter(f => f.id !== id && !Object.keys(updatedFc).includes(f.id))); // also check if its children were deleted

    if (activeFileId === id || (item.type === 'folder' && openFiles.some(f => f.id.startsWith(id)))) { // A bit simplistic check for children
      setActiveFileId(null);
    }
    toast({ title: "Success", description: `Item "${item.name}" deleted.` });
  }, [fileSystem, fileContents, activeFileId, openFiles, deleteItemRecursive, setFileSystem, setFileContents, setOpenFiles, setActiveFileId]);
  
  const openFile = useCallback((id: string) => {
    const item = fileSystem[id];
    if (!item || item.type !== 'file') return;
    if (!openFiles.find(f => f.id === id)) {
      setOpenFiles(prev => [...prev, { id, name: item.name }]);
    }
    setActiveFileId(id);
  }, [fileSystem, openFiles, setOpenFiles, setActiveFileId]);

  const closeFile = useCallback((id: string) => {
    setOpenFiles(prev => prev.filter(f => f.id !== id));
    if (activeFileId === id) {
      const remainingFiles = openFiles.filter(f => f.id !== id);
      setActiveFileId(remainingFiles.length > 0 ? remainingFiles[0].id : null);
    }
  }, [openFiles, activeFileId, setOpenFiles, setActiveFileId]);

  const updateFileContent = useCallback((id: string, content: string) => {
    setFileContents(prev => ({ ...prev, [id]: content }));
  }, [setFileContents]);

  const saveFile = useCallback((id: string) => {
    // Content is already updated in fileContents by updateFileContent
    // This function is more of a conceptual save, as useLocalStorage saves on change.
    // Here we could add a "dirty" flag and clear it.
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
      // Try to find and inject style.css and script.js if they exist in the same directory
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
      
      // A simple way to inject: look for </head> and </body>
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

  // Terminal related functions
  const getCurrentDirectoryId = useCallback(() => currentPath[currentPath.length - 1] || 'root', [currentPath]);
  
  const currentDirectoryItems = useCallback(() => {
    const dirId = getCurrentDirectoryId();
    const dir = fileSystem[dirId];
    if (dir && dir.type === 'folder' && dir.childrenIds) {
      return dir.childrenIds.map(id => fileSystem[id]).filter(Boolean) as FileSystemItem[];
    }
    return [];
  }, [fileSystem, getCurrentDirectoryId]);

  const getItemByPath = useCallback((path: string): FileSystemItem | null => {
    const parts = path.split('/').filter(p => p);
    let currentItemId = 'root'; // Assume 'root' is always the starting point of absolute paths

    if (path === '/' || path === '') return fileSystem['root'];
    
    // Handle relative paths
    if (!path.startsWith('/')) {
      currentItemId = getCurrentDirectoryId();
    }
    
    for (const part of parts) {
      if (part === '.') continue;
      if (part === '..') {
        const currentItem = fileSystem[currentItemId];
        if (currentItem && currentItem.parentId) {
          currentItemId = currentItem.parentId;
        } else {
          return null; // Cannot go up from root or item without parent
        }
        continue;
      }
      
      const currentDir = fileSystem[currentItemId];
      if (!currentDir || currentDir.type !== 'folder' || !currentDir.childrenIds) return null;
      
      const foundChildId = currentDir.childrenIds.find(id => fileSystem[id]?.name === part);
      if (!foundChildId) return null;
      currentItemId = foundChildId;
    }
    return fileSystem[currentItemId] || null;
  }, [fileSystem, getCurrentDirectoryId]);


  const changeDirectory = useCallback((path: string): boolean => {
    const targetItem = getItemByPath(path);
    if (targetItem && targetItem.type === 'folder') {
      // Reconstruct path IDs
      const newPathIds: string[] = [];
      let current = targetItem;
      while(current) {
        newPathIds.unshift(current.id);
        if (!current.parentId) break;
        current = fileSystem[current.parentId];
      }
      setCurrentPath(newPathIds.length > 0 ? newPathIds : ['root']);
      return true;
    }
    return false;
  }, [getItemByPath, fileSystem, setCurrentPath]);

  const getAbsolutePath = useCallback((targetPath: string): string => {
    const item = getItemByPath(targetPath);
    if (!item) return "/"; // Default to root if path is invalid
    
    const pathParts: string[] = [];
    let current = item;
    while(current && current.id !== 'root') {
        pathParts.unshift(current.name);
        if (!current.parentId) break; // Should not happen if fs is consistent
        current = fileSystem[current.parentId];
    }
    return `/${pathParts.join('/')}`;
  }, [getItemByPath, fileSystem]);


  const getFilePath = useCallback((itemName: string): string | null => {
    const dirId = getCurrentDirectoryId();
    const dir = fileSystem[dirId];
    if (dir && dir.type === 'folder' && dir.childrenIds) {
      const item = dir.childrenIds.map(id => fileSystem[id]).find(child => child?.name === itemName);
      return item ? item.id : null;
    }
    return null;
  }, [fileSystem, getCurrentDirectoryId]);

  const readFileContent = useCallback((filePathId: string): string | undefined => {
    const item = fileSystem[filePathId];
    if (item && item.type === 'file') {
      return fileContents[filePathId];
    }
    return undefined;
  }, [fileSystem, fileContents]);


  return (
    <AppContext.Provider value={{
      fileSystem, rootId: 'root', openFiles, activeFileId, fileContents, theme, toggleTheme,
      addFile, addFolder, renameItem, deleteItem, openFile, closeFile, setActiveFileId,
      updateFileContent, saveFile, saveActiveFile, getFormattedContent,
      currentPath: currentPath.map(id => fileSystem[id]?.name || 'unknown'), // Return names for display
      currentDirectoryItems, changeDirectory, getFilePath, readFileContent, getAbsolutePath, getItemByPath
    }}>
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
