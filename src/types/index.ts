
export type FileSystemItemType = 'file' | 'folder';

export interface FileSystemItem {
  id: string;
  name: string;
  type: FileSystemItemType;
  parentId: string | null;
  childrenIds?: string[]; // Only for folders
  // Content is stored separately in AppContext to avoid deeply nested large strings
}

export interface OpenFile {
  id:string;
  name: string;
  // originalContentHash?: string; // For tracking unsaved changes, optional
}

export type Theme = 'light' | 'dark';

export interface AppContextType {
  fileSystem: Record<string, FileSystemItem>;
  rootId: string;
  openFiles: OpenFile[];
  activeFileId: string | null;
  fileContents: Record<string, string>; // id -> content
  theme: Theme;
  currentPath: string[]; // Array of folder names representing current path in terminal
  isTerminalOpen: boolean;

  addFile: (name: string, parentId: string) => void;
  addFolder: (name: string, parentId: string) => void;
  renameItem: (id: string, newName: string) => void;
  deleteItem: (id: string) => void;
  openFile: (id: string) => void;
  closeFile: (id: string) => void;
  setActiveFileId: (id: string | null) => void;
  updateFileContent: (id: string, content: string) => void; // Updates temporary content
  saveFile: (id: string) => void; // Persists content to fileSystem and local storage
  saveActiveFile: () => void;
  toggleTheme: () => void;
  getFormattedContent: (fileId: string) => string; // For live preview, potentially combining files
  toggleTerminal: () => void;
  downloadProject: () => Promise<void>;
  openProjectFolder: (files: FileList) => Promise<void>;
  addFilesToRoot: (files: FileList) => Promise<void>;


  // Terminal related
  currentDirectoryItems: () => FileSystemItem[];
  changeDirectory: (path: string) => boolean;
  getFilePath: (itemName: string) => string | null; // Get full path for an item name in current dir
  readFileContent: (filePathId: string) => string | undefined;
  getAbsolutePath: (targetPath: string) => string; // Get absolute path string
  getItemByPath: (path: string) => FileSystemItem | null;
}

