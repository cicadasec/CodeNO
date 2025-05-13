
"use client";
import React, { useState, useRef } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import type { FileSystemItem } from '@/types';
import { FileIcon } from './FileIcon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle, Trash2, Edit3, FolderPlus, FilePlus, Save, XCircle, FolderOpen, FileUp } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

interface FileExplorerProps {}

export function FileExplorer({}: FileExplorerProps) {
  const { fileSystem, rootId, openFile, addFile, addFolder, renameItem, deleteItem, openProjectFolder, addFilesToRoot } = useAppContext();
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [addingType, setAddingType] = useState<'file' | 'folder' | null>(null);
  const [addingParentId, setAddingParentId] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const { toast } = useToast();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleRename = (id: string) => {
    if (newName.trim() && renamingId === id) {
      renameItem(id, newName.trim());
    }
    setRenamingId(null);
    setNewName('');
  };

  const handleAddItem = () => {
    if (newItemName.trim() && addingParentId && addingType) {
      if (addingType === 'file') {
        addFile(newItemName.trim(), addingParentId);
      } else {
        addFolder(newItemName.trim(), addingParentId);
      }
    }
    setAddingType(null);
    setAddingParentId(null);
    setNewItemName('');
  };

  const startAddingItem = (type: 'file' | 'folder', parentId: string) => {
    setAddingType(type);
    setAddingParentId(parentId);
    setNewItemName('');
    setRenamingId(null); // Cancel any ongoing rename
  };

  const handleOpenFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      addFilesToRoot(files);
      toast({ title: "Files Imported", description: `${files.length} file(s) added to the project root.` });
    }
    // Reset input value to allow selecting the same file(s) again
    if(event.target) event.target.value = '';
  };

  const handleOpenFolder = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      openProjectFolder(files);
      // toast message is handled within openProjectFolder
    }
     // Reset input value to allow selecting the same folder again
    if(event.target) event.target.value = '';
  };

  const FileSystemTree: React.FC<{ parentId: string | null; level: number }> = ({ parentId, level }) => {
    // Ensure fileSystem is accessed only after it's confirmed to be loaded, or handle potential undefined items gracefully.
    const items = Object.values(fileSystem).filter(item => item && item.parentId === parentId)
      .sort((a, b) => {
        if (!a || !b) return 0; // Should not happen if fileSystem is consistent
        if (a.type === b.type) return a.name.localeCompare(b.name);
        return a.type === 'folder' ? -1 : 1;
      });

    return (
      <ul style={{ paddingLeft: level > 0 ? '1rem' : '0' }}>
        {items.map(item => {
          if (!item) return null; // Skip if item is somehow undefined
          return (
            <li key={item.id} className="py-1 group relative">
              {renamingId === item.id ? (
                <div className="flex items-center space-x-1">
                  <FileIcon type={item.type} name={item.name} className="h-4 w-4 mr-1 flex-shrink-0" />
                  <Input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onBlur={() => handleRename(item.id)}
                    onKeyDown={(e) => e.key === 'Enter' && handleRename(item.id)}
                    autoFocus
                    className="h-7 text-sm"
                  />
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRename(item.id)}><Save className="h-4 w-4"/></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setRenamingId(null)}><XCircle className="h-4 w-4"/></Button>
                </div>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div
                      className={`flex items-center cursor-pointer hover:bg-accent p-1 rounded ${item.type === 'file' ? 'pl-1' : ''}`}
                      onClick={item.type === 'file' ? () => openFile(item.id) : undefined}
                      onDoubleClick={item.type === 'folder' ? () => {} : undefined} // Could implement folder expand/collapse on double click
                    >
                      <FileIcon type={item.type} name={item.name} className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="text-sm truncate select-none">{item.name}</span>
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-48">
                    {item.type === 'file' && (
                      <DropdownMenuItem onClick={() => openFile(item.id)}>Open</DropdownMenuItem>
                    )}
                    {item.type === 'folder' && (
                      <>
                        <DropdownMenuItem onClick={() => startAddingItem('file', item.id)}>
                          <FilePlus className="mr-2 h-4 w-4" /> New File
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => startAddingItem('folder', item.id)}>
                          <FolderPlus className="mr-2 h-4 w-4" /> New Folder
                        </DropdownMenuItem>
                      </>
                    )}
                    {item.id !== rootId && (
                      <>
                        <DropdownMenuItem onClick={() => { setRenamingId(item.id); setNewName(item.name); }}>
                          <Edit3 className="mr-2 h-4 w-4" /> Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => deleteItem(item.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              {addingParentId === item.id && addingType && (
                <div className="flex items-center space-x-1 pl-4 py-1">
                  <FileIcon type={addingType} name={newItemName || 'new'} className="h-4 w-4 mr-1 flex-shrink-0" />
                  <Input
                    type="text"
                    value={newItemName}
                    placeholder={`New ${addingType} name...`}
                    onChange={(e) => setNewItemName(e.target.value)}
                    onBlur={handleAddItem}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                    autoFocus
                    className="h-7 text-sm"
                  />
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleAddItem}><Save className="h-4 w-4"/></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {setAddingType(null); setAddingParentId(null);}}><XCircle className="h-4 w-4"/></Button>
                </div>
              )}
              {item.type === 'folder' && <FileSystemTree parentId={item.id} level={level + 1} />}
            </li>
          )
        })}
      </ul>
    );
  };
  
  const rootItem = fileSystem[rootId];

  return (
    <div className="h-full flex flex-col bg-card text-card-foreground p-2 border-r">
      <input type="file" ref={fileInputRef} onChange={handleOpenFiles} multiple style={{ display: 'none' }} accept="*/*"/>
      <input type="file" ref={folderInputRef} onChange={handleOpenFolder} webkitdirectory directory multiple style={{ display: 'none' }} />

      <div className="flex justify-between items-center mb-2 p-1">
        <h2 className="text-lg font-semibold select-none">{rootItem?.name || 'Files'}</h2>
        <div className="space-x-1">
           <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} title="Open Files">
            <FileUp className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => folderInputRef.current?.click()} title="Open Folder">
            <FolderOpen className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => startAddingItem('file', rootId)} title="New File in Root">
            <FilePlus className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => startAddingItem('folder', rootId)} title="New Folder in Root">
            <FolderPlus className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {addingParentId === rootId && addingType && (
          <div className="flex items-center space-x-1 p-1 mb-2">
            <FileIcon type={addingType} name={newItemName || 'new'} className="h-4 w-4 mr-1 flex-shrink-0" />
            <Input
              type="text"
              value={newItemName}
              placeholder={`New ${addingType} name...`}
              onChange={(e) => setNewItemName(e.target.value)}
              onBlur={handleAddItem}
              onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
              autoFocus
              className="h-7 text-sm"
            />
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleAddItem}><Save className="h-4 w-4"/></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {setAddingType(null); setAddingParentId(null);}}><XCircle className="h-4 w-4"/></Button>
          </div>
      )}
      <ScrollArea className="flex-grow">
        {rootId && fileSystem[rootId] ? (
          <FileSystemTree parentId={rootId} level={0} />
        ) : (
          <p className="text-sm text-muted-foreground p-2">Loading project structure...</p>
        )}
      </ScrollArea>
    </div>
  );
}

