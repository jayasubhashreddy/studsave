import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Folder {
  _id: string;
  name: string;
  icon: string;
  color: string;
  createdAt: string;
}

export interface FileItem {
  _id: string;
  folderId: string;
  name: string;
  content: any[];
  createdAt: string;
  updatedAt: string;
}

interface AppContextType {
  selectedFolder: Folder | null;
  selectedFile: FileItem | null;
  setSelectedFolder: (f: Folder | null) => void;
  setSelectedFile: (f: FileItem | null) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
  refreshTrigger: number;
  triggerRefresh: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [selectedFile,   setSelectedFile]   = useState<FileItem | null>(null);
  const [sidebarOpen,    setSidebarOpen]     = useState(true);
  const [refreshTrigger, setRefreshTrigger]  = useState(0);

  const triggerRefresh = () => setRefreshTrigger(n => n + 1);

  const handleSetFolder = (f: Folder | null) => {
    setSelectedFolder(f);
    setSelectedFile(null);
  };

  return (
    <AppContext.Provider value={{
      selectedFolder, selectedFile,
      setSelectedFolder: handleSetFolder,
      setSelectedFile,
      sidebarOpen, setSidebarOpen,
      refreshTrigger, triggerRefresh,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
