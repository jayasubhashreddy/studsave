import React, { useState, useEffect } from 'react';
import { ChevronRight, BookOpen, Menu, X, Folder as FolderIcon, FileText, Lock } from 'lucide-react';
import { useApp, Folder, FileItem } from '../context/AppContext';
import api from '../utils/api';

export default function Sidebar() {
  const {
    selectedFolder, selectedFile,
    setSelectedFolder, setSelectedFile,
    sidebarOpen, setSidebarOpen,
    refreshTrigger
  } = useApp();

  const [folders, setFolders] = useState<Folder[]>([]);
  // files keyed by folderId
  const [files, setFiles] = useState<{ [folderId: string]: FileItem[] }>({});
  // subfolders keyed by parentFolderId
  const [subfolders, setSubfolders] = useState<{ [folderId: string]: Folder[] }>({});
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Load top-level folders only
  useEffect(() => {
    api.get('/folders').then(r => setFolders(r.data)).catch(() => {});
  }, [refreshTrigger]);

  // Refresh open folders on trigger
  useEffect(() => {
    expanded.forEach(async folderId => {
      try {
        const [filesRes, subfoldersRes] = await Promise.all([
          api.get(`/files/folder/${folderId}`),
          api.get(`/folders/${folderId}/subfolders`)
        ]);
        setFiles(prev => ({ ...prev, [folderId]: filesRes.data }));
        setSubfolders(prev => ({ ...prev, [folderId]: subfoldersRes.data }));
      } catch {}
    });
  }, [refreshTrigger]);

  const toggleFolder = async (folder: Folder) => {
    // Navigate to folder in main content (lock gate handled there)
    setSelectedFolder(folder);
    const next = new Set(expanded);
    if (next.has(folder._id)) {
      next.delete(folder._id);
    } else {
      next.add(folder._id);
      // Only load contents if not locked (locked folders show gate in MainContent)
      if (!folder.isLocked) {
        try {
          const [filesRes, subfoldersRes] = await Promise.all([
            api.get(`/files/folder/${folder._id}`),
            api.get(`/folders/${folder._id}/subfolders`)
          ]);
          setFiles(prev => ({ ...prev, [folder._id]: filesRes.data }));
          setSubfolders(prev => ({ ...prev, [folder._id]: subfoldersRes.data }));
        } catch {}
      }
    }
    setExpanded(next);
  };

  if (!sidebarOpen) return (
    <button onClick={() => setSidebarOpen(true)}
      style={{ background: 'var(--sidebar)' }}
      className="fixed top-4 left-4 z-40 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg hover:opacity-90 transition-all">
      <Menu size={18} style={{ color: 'rgba(255,255,255,0.8)' }} />
    </button>
  );

  const renderFolderTree = (folder: Folder, depth = 0) => {
    const isActive = selectedFolder?._id === folder._id && !selectedFile;
    const isExpanded = expanded.has(folder._id);
    const folderFiles = files[folder._id] || [];
    const folderSubs = subfolders[folder._id] || [];
    const ml = depth > 0 ? `ml-${depth * 3}` : '';

    return (
      <div key={folder._id} className={ml}>
        <div className={`nav-row ${isActive ? 'nav-active' : ''}`}>
          <button className="nav-btn" onClick={() => toggleFolder(folder)}>
            <ChevronRight size={13}
              className={`flex-shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
            <span className="text-base leading-none">{folder.icon || '📁'}</span>
            <span className="truncate">{folder.name}</span>
            {folder.isLocked && <Lock size={10} style={{ color: 'rgba(239,68,68,0.7)', flexShrink: 0 }} />}
          </button>
        </div>

        {isExpanded && !folder.isLocked && (
          <>
            {/* Subfolders */}
            {folderSubs.map(sub => (
              <div key={sub._id} className="ml-4 mt-0.5">
                {renderFolderTree(sub, depth + 1)}
              </div>
            ))}
            {/* Files */}
            {folderFiles.map(file => (
              <div key={file._id} className="ml-6 mt-0.5">
                <div className={`nav-row ${selectedFile?._id === file._id ? 'nav-active' : ''}`}>
                  <button className="nav-btn" onClick={() => { setSelectedFolder(folder); setSelectedFile(file); }}>
                    <FileText size={11} style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
                    <span className="truncate text-xs">{file.name}</span>
                  </button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      <aside className="sidebar fixed lg:relative inset-y-0 left-0 z-30 w-64 flex-shrink-0 flex flex-col h-screen"
        style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}>

        {/* Header */}
        <div className="px-4 py-4 flex items-center gap-3 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--green)' }}>
            <BookOpen size={15} className="text-white" />
          </div>
          <div className="flex-1">
            <div className="font-bold text-white text-sm leading-tight">StudSave</div>
            <div className="text-xs" style={{ color: 'rgba(149,213,178,0.6)' }}>Study Smart</div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="nav-icon-btn"><X size={15} /></button>
        </div>

        {/* Navigation tree */}
        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {folders.length === 0 && (
            <div className="text-center py-10 text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
              <FolderIcon size={22} className="mx-auto mb-2 opacity-30" />
              No folders yet
            </div>
          )}
          {folders.map(folder => renderFolderTree(folder))}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 flex-shrink-0"
          style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
            Sidebar — navigation only
          </div>
        </div>
      </aside>
    </>
  );
}
