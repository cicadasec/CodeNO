
"use client";
import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { AppContextType, FileSystemItem, OpenFile, Theme, FileSystemItemType } from '@/types';
import useLocalStorage from '@/hooks/useLocalStorage';
import { toast } from '@/hooks/use-toast';
import type JSZip from 'jszip';

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
    <h1>Hello, Code NO!</h1>
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

  const [rawFileSystem, setRawFileSystem] = useLocalStorage<Record<string, FileSystemItem>>('codeno-fs', initialFileSystemData);
  const [rawFileContents, setRawFileContents] = useLocalStorage<Record<string, string>>('codeno-fc', initialFileContents);
  const [rawOpenFiles, setRawOpenFiles] = useLocalStorage<OpenFile[]>('codeno-openfiles', initialOpenFiles);
  const [rawActiveFileId, setRawActiveFileIdState] = useLocalStorage<string | null>('codeno-activefile', initialActiveFileId);
  const [rawTheme, setRawThemeState] = useLocalStorage<Theme>('codeno-theme', initialTheme);
  const [rawCurrentPath, setRawCurrentPath] = useLocalStorage<string[]>('codeno-currentpath', initialCurrentPath); // Path IDs
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);


  useEffect(() => {
    setHasMounted(true);
  }, []);

  const fileSystem = hasMounted ? rawFileSystem : initialFileSystemData;
  const fileContents = hasMounted ? rawFileContents : initialFileContents;
  const openFiles = hasMounted ? rawOpenFiles : initialOpenFiles;
  const activeFileId = hasMounted ? rawActiveFileId : initialActiveFileId;
  const theme = hasMounted ? rawTheme : initialTheme;
  const currentPathIds = hasMounted ? rawCurrentPath : initialCurrentPath;
  const rootId = 'root';


  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setRawThemeState(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  }, [setRawThemeState]);

  const toggleTerminal = useCallback(() => {
    setIsTerminalOpen(prev => !prev);
  }, []);

  const setActiveFileId = useCallback((id: string | null) => {
    setRawActiveFileIdState(id);
  }, [setRawActiveFileIdState]);

  const addFile = useCallback((name: string, parentId: string) => {
    const currentFs = hasMounted ? rawFileSystem : initialFileSystemData;
    const parent = currentFs[parentId];
    if (!parent || parent.type !== 'folder') {
      toast({ title: "Error", description: "Parent must be a folder.", variant: "destructive" });
      return;
    }
    if (parent.childrenIds?.some(childId => currentFs[childId]?.name === name)) {
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
  }, [hasMounted, rawFileSystem, setRawFileSystem, setRawFileContents]);

  const addFolder = useCallback((name: string, parentId: string) => {
    const currentFs = hasMounted ? rawFileSystem : initialFileSystemData;
    const parent = currentFs[parentId];
     if (!parent || parent.type !== 'folder') {
      toast({ title: "Error", description: "Parent must be a folder.", variant: "destructive" });
      return;
    }
    if (parent.childrenIds?.some(childId => currentFs[childId]?.name === name)) {
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
  }, [hasMounted, rawFileSystem, setRawFileSystem]);

  const renameItem = useCallback((id: string, newName: string) => {
    const currentFs = hasMounted ? rawFileSystem : initialFileSystemData;
    const item = currentFs[id];
    if (!item) return;
    const parent = item.parentId ? currentFs[item.parentId] : null;
    if (parent && parent.childrenIds?.some(childId => childId !== id && currentFs[childId]?.name === newName)) {
      toast({ title: "Error", description: `An item named "${newName}" already exists in this directory.`, variant: "destructive" });
      return;
    }

    setRawFileSystem(prev => ({ ...prev, [id]: { ...prev[id], name: newName } }));
    setRawOpenFiles(prevOpen => prevOpen.map(f => f.id === id ? {...f, name: newName} : f));
    toast({ title: "Success", description: `Item renamed to "${newName}".` });
  }, [hasMounted, rawFileSystem, setRawFileSystem, setRawOpenFiles]);

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
    const currentFs = hasMounted ? rawFileSystem : initialFileSystemData;
    const currentFc = hasMounted ? rawFileContents : initialFileContents;
    const currentOpenFiles = hasMounted ? rawOpenFiles : initialOpenFiles;
    const currentActiveFileId = hasMounted ? rawActiveFileId : initialActiveFileId;

    const item = currentFs[id];
    if (!item) return;

    const { updatedFs, updatedFc } = deleteItemRecursive(id, currentFs, currentFc);
    
    setRawFileSystem(updatedFs);
    setRawFileContents(updatedFc);

    setRawOpenFiles(prevOpen => prevOpen.filter(f => f.id !== id && !Object.keys(updatedFc).includes(f.id)));

    if (currentActiveFileId === id || (item.type === 'folder' && currentOpenFiles.some(f => {
        let currentItem = updatedFs[f.id];
        while(currentItem) {
            if (currentItem.id === id) return true;
            if (!currentItem.parentId) break;
            currentItem = updatedFs[currentItem.parentId];
        }
        return false;
    }))) {
      setActiveFileId(null);
    }
    toast({ title: "Success", description: `Item "${item.name}" deleted.` });
  }, [hasMounted, rawFileSystem, rawFileContents, rawOpenFiles, rawActiveFileId, deleteItemRecursive, setRawFileSystem, setRawFileContents, setRawOpenFiles, setActiveFileId]);
  
  const openFile = useCallback((id: string) => {
    const currentFs = hasMounted ? rawFileSystem : initialFileSystemData;
    const currentOpenFs = hasMounted ? rawOpenFiles : initialOpenFiles;

    const item = currentFs[id];
    if (!item || item.type !== 'file') return;
    if (!currentOpenFs.find(f => f.id === id)) {
      setRawOpenFiles(prev => [...prev, { id, name: item.name }]);
    }
    setActiveFileId(id);
  }, [hasMounted, rawFileSystem, rawOpenFiles, setRawOpenFiles, setActiveFileId]);

  const closeFile = useCallback((id: string) => {
    const currentActiveFileId = hasMounted ? rawActiveFileId : initialActiveFileId;
    setRawOpenFiles(prev => {
        const filtered = prev.filter(f => f.id !== id);
        if (currentActiveFileId === id) {
          setActiveFileId(filtered.length > 0 ? filtered[filtered.length -1].id : null);
        }
        return filtered;
      });
  }, [hasMounted, rawActiveFileId, setRawOpenFiles, setActiveFileId]);


  const updateFileContent = useCallback((id: string, content: string) => {
    setRawFileContents(prev => ({ ...prev, [id]: content }));
  }, [setRawFileContents]);

  const saveFile = useCallback((id: string) => {
    const currentFs = hasMounted ? rawFileSystem : initialFileSystemData;
    toast({ title: "Saved", description: `${currentFs[id]?.name} saved.` });
  }, [hasMounted, rawFileSystem]);

  const saveActiveFile = useCallback(() => {
    const currentActiveFileId = hasMounted ? rawActiveFileId : initialActiveFileId;
    if (currentActiveFileId) {
      saveFile(currentActiveFileId);
    }
  }, [hasMounted, rawActiveFileId, saveFile]);

  const getFormattedContent = useCallback((fileId: string): string => {
    const currentFs = hasMounted ? rawFileSystem : initialFileSystemData;
    const currentFc = hasMounted ? rawFileContents : initialFileContents;

    const file = currentFs[fileId];
    if (!file || file.type !== 'file') return '';
    
    const content = currentFc[fileId] || '';

    if (file.name.endsWith('.html')) {
      const parentDirId = file.parentId;
      if (!parentDirId) return content; 

      const parentDir = currentFs[parentDirId];
      if (!parentDir || parentDir.type !== 'folder' || !parentDir.childrenIds) return content;

      let cssContent = '';
      let jsContent = '';

      const styleFile = parentDir.childrenIds
        .map(id => currentFs[id])
        .find(item => item?.name === 'style.css' && item.type === 'file');
      
      if (styleFile && currentFc[styleFile.id]) {
        cssContent = `<style>\n${currentFc[styleFile.id]}\n</style>`;
      }
      
      const scriptFile = parentDir.childrenIds
        .map(id => currentFs[id])
        .find(item => item?.name === 'script.js' && item.type === 'file');

      if (scriptFile && currentFc[scriptFile.id]) {
        jsContent = `<script>\n${currentFc[scriptFile.id]}\n</script>`;
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
  }, [hasMounted, rawFileSystem, rawFileContents]);

  const getCurrentDirectoryId = useCallback(() => {
    const currentPath = hasMounted ? rawCurrentPath : initialCurrentPath;
    return currentPath[currentPath.length - 1] || 'root';
  }, [hasMounted, rawCurrentPath]);
  
  const currentDirectoryItems = useCallback((): FileSystemItem[] => {
    if (!hasMounted) return []; 
    const currentFs = rawFileSystem; // Use raw directly as hasMounted is true
    const dirId = getCurrentDirectoryId();
    const dir = currentFs[dirId];
    if (dir && dir.type === 'folder' && dir.childrenIds) {
      return dir.childrenIds.map(id => currentFs[id]).filter(Boolean) as FileSystemItem[];
    }
    return [];
  }, [rawFileSystem, getCurrentDirectoryId, hasMounted]);

  const getItemByPath = useCallback((path: string): FileSystemItem | null => {
    const currentFs = hasMounted ? rawFileSystem : initialFileSystemData;
    const currentFsCurrentPath = hasMounted ? rawCurrentPath : initialCurrentPath;
    
    const parts = path.split('/').filter(p => p);
    let currentItemId : string;

    if (path.startsWith('/')) { 
        currentItemId = 'root';
         if (parts.length === 0) return currentFs['root']; 
    } else { 
        currentItemId = currentFsCurrentPath[currentFsCurrentPath.length -1] || 'root';
        if (parts.length === 0 && path === '') return currentFs[currentItemId]; 
         if (parts.length === 0 && path !== '') return null; 
    }
    
    for (const part of parts) {
      if (part === '.') continue;
      if (part === '..') {
        const currentItem = currentFs[currentItemId];
        if (currentItem && currentItem.parentId) {
          currentItemId = currentItem.parentId;
        } else if (currentItemId === 'root') {
          continue; 
        }
         else {
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
    const currentFs = hasMounted ? rawFileSystem : initialFileSystemData;
    if (targetItem && targetItem.type === 'folder') {
      const newPathIds: string[] = [];
      let current: FileSystemItem | undefined = targetItem; // Allow current to be undefined
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
    const currentFs = hasMounted ? rawFileSystem : initialFileSystemData;
    const item = getItemByPath(targetPathInput); 
    if (!item) return "/"; 
    
    const pathParts: string[] = [];
    let current: FileSystemItem | undefined = item;
    while(current && current.id !== 'root') {
        pathParts.unshift(current.name);
        if (!current.parentId) break; 
        current = currentFs[current.parentId];
    }
    return `/${pathParts.join('/')}`;
  }, [getItemByPath, hasMounted, rawFileSystem]);


  const getFilePath = useCallback((itemName: string): string | null => {
    if (!hasMounted) return null;
    const currentFs = rawFileSystem;
    const dirId = getCurrentDirectoryId();
    const dir = currentFs[dirId];
    if (dir && dir.type === 'folder' && dir.childrenIds) {
      const item = dir.childrenIds.map(id => currentFs[id]).find(child => child?.name === itemName);
      return item ? item.id : null;
    }
    return null;
  }, [rawFileSystem, getCurrentDirectoryId, hasMounted]);

  const readFileContent = useCallback((filePathId: string): string | undefined => {
    if (!hasMounted) return undefined;
    const currentFs = rawFileSystem;
    const currentFc = rawFileContents;
    const item = currentFs[filePathId];
    if (item && item.type === 'file') {
      return currentFc[filePathId];
    }
    return undefined;
  }, [rawFileSystem, rawFileContents, hasMounted]);

  const addItemsToZipRecursive = useCallback((
    zipFolder: JSZip, 
    itemId: string,
    fs: Record<string, FileSystemItem>,
    fc: Record<string, string>
  ) => {
    const item = fs[itemId];
    if (!item) return;

    if (item.type === 'file') {
      const content = fc[item.id] || '';
      zipFolder.file(item.name, content);
    } else if (item.type === 'folder') {
      const folder = zipFolder.folder(item.name);
      if (folder && item.childrenIds) {
        item.childrenIds.forEach(childId => {
          addItemsToZipRecursive(folder, childId, fs, fc);
        });
      }
    }
  }, []);


  const downloadProject = useCallback(async () => {
    if (typeof window === 'undefined' || !hasMounted) return;
    const currentFs = rawFileSystem;
    const currentFc = rawFileContents;

    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();

    const projectRootItem = currentFs[rootId];
    if (projectRootItem && projectRootItem.type === 'folder' && projectRootItem.childrenIds) {
      projectRootItem.childrenIds.forEach(childId => {
        addItemsToZipRecursive(zip, childId, currentFs, currentFc);
      });
    }

    try {
      const blob = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      const projectName = projectRootItem?.name || 'project';
      link.download = `${projectName}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      toast({ title: "Success", description: "Project downloaded successfully." });
    } catch (error) {
      console.error("Error generating zip:", error);
      toast({ title: "Error", description: "Failed to download project.", variant: "destructive" });
    }
  }, [hasMounted, rawFileSystem, rawFileContents, rootId, addItemsToZipRecursive]);

  const openProjectFolder = useCallback(async (filesFromInput: FileList) => {
    if (!filesFromInput || filesFromInput.length === 0) {
      toast({ title: "No folder selected", description: "Please select a folder to open.", variant: "destructive"});
      return;
    }

    const filesArray = Array.from(filesFromInput);
    const topLevelFolderName = filesArray[0].webkitRelativePath.split('/')[0];

    let newFileSystemState: Record<string, FileSystemItem> = {
      [rootId]: { id: rootId, name: topLevelFolderName, type: 'folder', parentId: null, childrenIds: [] }
    };
    let newFileContentsState: Record<string, string> = {};
    const fileReadPromises: Promise<{ id: string, content: string }>[] = [];
    // pathToIdMap maps the string path (e.g., "TopLevelFolder/subfolder") to its generated ID
    const pathToIdMap: Record<string, string> = { [topLevelFolderName]: rootId };


    for (const file of filesArray) {
      const pathParts = file.webkitRelativePath.split('/'); // e.g., ["MyProject", "src", "index.js"]
      let currentParentId = rootId;
      let currentPathAccumulator = pathParts[0]; // This is the topLevelFolderName

      // Ensure the direct children of the root are correctly processed
      // If pathParts.length is 2, it's a file directly under TopLevelFolder.
      // If pathParts.length > 2, process intermediate directories.
      for (let i = 1; i < pathParts.length - 1; i++) { // Iterate through intermediate directory parts
        const dirName = pathParts[i];
        currentPathAccumulator += '/' + dirName;
        
        let dirId = pathToIdMap[currentPathAccumulator];
        if (!dirId) {
          dirId = generateId();
          newFileSystemState[dirId] = { id: dirId, name: dirName, type: 'folder', parentId: currentParentId, childrenIds: [] };
          
          // Initialize childrenIds for parent if it's the first time adding a child
          if (!newFileSystemState[currentParentId].childrenIds) {
            newFileSystemState[currentParentId].childrenIds = [];
          }
          newFileSystemState[currentParentId].childrenIds!.push(dirId);
          pathToIdMap[currentPathAccumulator] = dirId;
        }
        currentParentId = dirId;
      }

      // Process the file part
      const fileName = pathParts[pathParts.length - 1];
      const fileId = generateId();
      newFileSystemState[fileId] = { id: fileId, name: fileName, type: 'file', parentId: currentParentId };
      
      if (!newFileSystemState[currentParentId].childrenIds) {
         newFileSystemState[currentParentId].childrenIds = [];
      }
      newFileSystemState[currentParentId].childrenIds!.push(fileId);

      fileReadPromises.push(
        file.text().then(content => ({ id: fileId, content })).catch(err => {
          console.error(`Error reading file ${file.name}:`, err);
          toast({title: "File Read Error", description: `Could not read ${file.name}. It might be binary or too large.`, variant: "destructive"});
          return {id: fileId, content: "// Error reading file content"};
        })
      );
    }
    
    try {
      const resolvedFileContents = await Promise.all(fileReadPromises);
      resolvedFileContents.forEach(fc => {
        newFileContentsState[fc.id] = fc.content;
      });

      setRawFileSystem(newFileSystemState);
      setRawFileContents(newFileContentsState);
      setRawOpenFiles([]);
      setRawActiveFileIdState(null);
      setRawCurrentPath([rootId]); // Reset terminal path to new project root

      toast({ title: "Project Opened", description: `Folder "${topLevelFolderName}" has been loaded.` });
    } catch (error) {
        console.error("Error processing project folder:", error);
        toast({ title: "Error Opening Project", description: "An unexpected error occurred.", variant: "destructive" });
    }

  }, [setRawFileSystem, setRawFileContents, setRawOpenFiles, setRawActiveFileIdState, setRawCurrentPath, rootId]);

  const addFilesToRoot = useCallback(async (files: FileList) => {
    if (!files || files.length === 0) return;
    const currentFs = hasMounted ? rawFileSystem : initialFileSystemData;

    const filesArray = Array.from(files);
    let newFilesAddedCount = 0;
    
    const fileReadPromises = filesArray.map(file => {
      // Check for name collision in root
      const rootItem = currentFs[rootId];
      if (rootItem && rootItem.childrenIds?.some(childId => currentFs[childId]?.name === file.name)) {
        toast({ title: "Skipped", description: `File "${file.name}" already exists in the project root.`, variant: "default" });
        return Promise.resolve(null); // Skip this file
      }
      
      const fileId = generateId();
      return file.text().then(content => ({
        id: fileId,
        name: file.name,
        content,
        parentId: rootId
      })).catch(err => {
          console.error(`Error reading file ${file.name}:`, err);
          toast({title: "File Read Error", description: `Could not read ${file.name}. It might be binary or too large.`, variant: "destructive"});
          return {id: fileId, name: file.name, content: "// Error reading file content", parentId: rootId};
      });
    });

    const results = await Promise.all(fileReadPromises);
    
    setRawFileSystem(prevFs => {
      const newFs = {...prevFs};
      const rootChildren = [...(newFs[rootId]?.childrenIds || [])];

      results.forEach(result => {
        if (result) {
          newFs[result.id] = { id: result.id, name: result.name, type: 'file', parentId: result.parentId };
          if (!rootChildren.includes(result.id)) {
            rootChildren.push(result.id);
          }
          newFilesAddedCount++;
        }
      });
      newFs[rootId] = { ...newFs[rootId], childrenIds: rootChildren };
      return newFs;
    });

    setRawFileContents(prevFc => {
      const newFc = {...prevFc};
      results.forEach(result => {
        if (result) {
          newFc[result.id] = result.content;
        }
      });
      return newFc;
    });
    if (newFilesAddedCount > 0) {
     toast({ title: "Files Added", description: `${newFilesAddedCount} file(s) added to project root.` });
    }

  }, [hasMounted, rawFileSystem, setRawFileSystem, setRawFileContents, rootId]);


  const contextValue: AppContextType = {
    fileSystem,
    rootId,
    openFiles,
    activeFileId,
    fileContents,
    theme,
    toggleTheme,
    addFile, addFolder, renameItem, deleteItem, openFile, closeFile, setActiveFileId,
    updateFileContent, saveFile, saveActiveFile, getFormattedContent,
    currentPath: (hasMounted ? rawCurrentPath : initialCurrentPath).map(id => (hasMounted ? rawFileSystem[id]?.name : initialFileSystemData[id]?.name) || 'unknown'),
    isTerminalOpen,
    toggleTerminal,
    downloadProject,
    openProjectFolder,
    addFilesToRoot,
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

