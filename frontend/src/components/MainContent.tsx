import React, { useEffect, useState, useCallback } from 'react';
import {
  FolderPlus, FilePlus, Pencil, Trash2, Loader2, FileText,
  Folder as FolderIcon, BookOpenCheck, ChevronRight, Menu,
  Code2, Image, CheckCircle, AlertCircle, Clock, X,
  ChevronUp, ChevronDown, Lock, LockOpen, Eye, EyeOff,
  ShieldCheck
} from 'lucide-react';
import { useApp, Folder, FileItem } from '../context/AppContext';
import api from '../utils/api';
import Modal from './Modal';
import { useAutoSave } from '../hooks/useAutoSave';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-css';
import 'prismjs/themes/prism-tomorrow.css';

// ── Types ────────────────────────────────────────────────────────
type ContentType = 'text' | 'code' | 'image';
interface ContentBlock { _id?: string; type: ContentType; title: string; value: string; language?: string; order: number; }
const LANGS = ['javascript','typescript','python','java','c','cpp','css','html','sql','bash','json','text'];
const ICONS  = ['📁','📚','🔬','💻','📐','🧬','⚗️','🎨','📊','🏛️','🎓','📝','🗂️','💡'];
const COLORS = ['#6366f1','#2d6a4f','#1d4ed8','#7c3aed','#b45309','#dc2626','#0891b2','#db2777'];

// ── Small reusable pieces ────────────────────────────────────────
const BtnCreate = ({ label, icon: Icon, onClick }: { label: string; icon: any; onClick: () => void }) => (
  <button onClick={onClick}
    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold hover:opacity-90 transition-all"
    style={{ background: 'rgba(45,106,79,0.12)', color: 'var(--green)', border: '1px solid rgba(45,106,79,0.25)' }}>
    <Icon size={13} />{label}
  </button>
);
const BtnEdit = ({ onClick }: { onClick: () => void }) => (
  <button onClick={onClick}
    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold hover:opacity-90 transition-all"
    style={{ background: 'rgba(100,100,255,0.08)', color: '#6366f1', border: '1px solid rgba(100,100,255,0.2)' }}>
    <Pencil size={13} />Edit
  </button>
);
const BtnDelete = ({ onClick }: { onClick: () => void }) => (
  <button onClick={onClick}
    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold hover:opacity-90 transition-all"
    style={{ background: 'rgba(220,38,38,0.08)', color: 'var(--red)', border: '1px solid rgba(220,38,38,0.18)' }}>
    <Trash2 size={13} />Delete
  </button>
);
const BtnLock = ({ isLocked, onClick }: { isLocked: boolean; onClick: () => void }) => (
  <button onClick={onClick}
    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold hover:opacity-90 transition-all"
    style={{
      background: isLocked ? 'rgba(220,38,38,0.08)' : 'rgba(251,191,36,0.12)',
      color: isLocked ? 'var(--red)' : '#b45309',
      border: `1px solid ${isLocked ? 'rgba(220,38,38,0.2)' : 'rgba(251,191,36,0.3)'}`
    }}>
    {isLocked ? <LockOpen size={13} /> : <Lock size={13} />}
    {isLocked ? 'Unlock' : 'Lock'}
  </button>
);

// ── Save badge ────────────────────────────────────────────────────
const SaveBadge = ({ status }: { status: string }) => {
  const map: Record<string, { icon: React.ReactNode; text: string; color: string }> = {
    saving: { icon: <Loader2 size={11} className="animate-spin" />, text: 'Saving…', color: 'var(--ink3)' },
    saved:  { icon: <CheckCircle size={11} />, text: 'Saved', color: 'var(--green)' },
    error:  { icon: <AlertCircle size={11} />, text: 'Error',  color: 'var(--red)' },
  };
  const c = map[status]; if (!c) return null;
  return <span className="flex items-center gap-1 text-xs font-medium" style={{ color: c.color }}>{c.icon}{c.text}</span>;
};

// ── File Editor ───────────────────────────────────────────────────
function FileEditor({ file, onUpdate }: { file: FileItem; onUpdate: (f: FileItem) => void }) {
  const [content, setContent] = useState<ContentBlock[]>(file.content || []);
  const [previewing, setPreviewing] = useState<{ [k: string]: boolean }>({});
  const { save, status } = useAutoSave(file._id);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [imgTarget, setImgTarget] = useState<number | null>(null);

  useEffect(() => { setContent(file.content || []); setPreviewing({}); }, [file._id]);
  useEffect(() => { Prism.highlightAll(); }, [content, previewing]);

  const updateContent = useCallback((nc: ContentBlock[]) => { setContent(nc); save(nc); }, [save]);
  const addBlock = (type: ContentType) => {
    const key = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    updateContent([...content, { type, title: '', value: '', language: 'javascript', order: content.length, _id: key }]);
  };
  const updateBlock = (i: number, f: keyof ContentBlock, v: string) =>
    updateContent(content.map((b, idx) => idx === i ? { ...b, [f]: v } : b));
  const removeBlock = (i: number) => updateContent(content.filter((_, idx) => idx !== i));
  const moveBlock = (i: number, d: -1 | 1) => {
    const n = [...content]; const t = i + d;
    if (t < 0 || t >= n.length) return;
    [n[i], n[t]] = [n[t], n[i]];
    updateContent(n);
  };
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f || imgTarget === null) return;
    const reader = new FileReader();
    reader.onload = ev => { updateBlock(imgTarget, 'value', ev.target?.result as string); setImgTarget(null); };
    reader.readAsDataURL(f);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 pt-4 pb-6">
        <div className="flex flex-wrap gap-2 mb-5">
          {[{ type: 'text' as ContentType, icon: FileText, label: 'Text' },
            { type: 'code' as ContentType, icon: Code2, label: 'Code' },
            { type: 'image' as ContentType, icon: Image, label: 'Image' }].map(({ type, icon: Icon, label }) => (
            <button key={type} onClick={() => addBlock(type)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
              style={{ background: 'var(--paper2)', color: 'var(--ink2)', border: '1.5px solid var(--border)' }}>
              <Icon size={12} />{label} Block
            </button>
          ))}
          <div className="ml-auto"><SaveBadge status={status} /></div>
        </div>

        {content.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
              style={{ background: 'var(--paper2)', border: '1.5px solid var(--border)' }}>
              <FileText size={20} style={{ color: 'var(--ink3)' }} />
            </div>
            <p className="text-sm font-medium mb-1" style={{ color: 'var(--ink2)' }}>Empty file</p>
            <p className="text-xs" style={{ color: 'var(--ink3)' }}>Add a text, code, or image block above</p>
          </div>
        )}

        <div className="space-y-4">
          {content.map((block, i) => (
            <div key={block._id || i} className="block-card animate-slide-up">
              <div className="block-toolbar">
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--ink3)' }}>
                  {block.type === 'text' ? '📝 Text' : block.type === 'code' ? '💻 Code' : '🖼 Image'}
                </span>
                {block.type === 'code' && (
                  <select value={block.language || 'javascript'}
                    onChange={e => updateBlock(i, 'language', e.target.value)}
                    className="text-xs px-2 py-1 rounded-lg ml-1"
                    style={{ background: 'var(--paper3)', border: '1px solid var(--border)', color: 'var(--ink2)' }}>
                    {LANGS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                )}
                {block.type !== 'image' && (
                  <button onClick={() => setPreviewing(p => ({ ...p, [block._id || i]: !p[block._id || i] }))}
                    className="text-xs px-2 py-1 rounded-lg ml-1 transition-colors hover:bg-white"
                    style={{ color: 'var(--ink3)' }}>
                    {previewing[block._id || i] ? 'Edit' : 'Preview'}
                  </button>
                )}
                <div className="flex items-center gap-1 ml-auto">
                  <button onClick={() => moveBlock(i, -1)} disabled={i === 0}
                    className="nav-icon-btn disabled:opacity-30"><ChevronUp size={13} /></button>
                  <button onClick={() => moveBlock(i, 1)} disabled={i === content.length - 1}
                    className="nav-icon-btn disabled:opacity-30"><ChevronDown size={13} /></button>
                  <button onClick={() => removeBlock(i)} className="nav-icon-btn danger"><X size={13} /></button>
                </div>
              </div>
              <div className="p-3">
                <input value={block.title} onChange={e => updateBlock(i, 'title', e.target.value)}
                  className="input mb-2 text-xs" placeholder="Block title (optional)" />
                {block.type === 'text' && !previewing[block._id || i] && (
                  <textarea value={block.value} onChange={e => updateBlock(i, 'value', e.target.value)}
                    className="input h-32 resize-y text-sm" placeholder="Write your notes here…" />
                )}
                {block.type === 'text' && previewing[block._id || i] && (
                  <div className="min-h-[4rem] text-sm whitespace-pre-wrap p-2 rounded-lg"
                    style={{ background: 'var(--paper2)', color: 'var(--ink)' }}>{block.value || <span style={{ color: 'var(--ink3)' }}>Nothing to preview</span>}</div>
                )}
                {block.type === 'code' && !previewing[block._id || i] && (
                  <textarea value={block.value} onChange={e => updateBlock(i, 'value', e.target.value)}
                    className="input h-40 resize-y text-sm font-mono" placeholder={`Write ${block.language || 'code'} here…`} />
                )}
                {block.type === 'code' && previewing[block._id || i] && (
                  <pre className={`language-${block.language || 'javascript'}`}><code>{block.value || '// nothing yet'}</code></pre>
                )}
                {block.type === 'image' && (
                  block.value
                    ? <div className="relative"><img src={block.value} alt={block.title} className="max-h-64 rounded-xl object-contain" />
                        <button onClick={() => updateBlock(i, 'value', '')}
                          className="absolute top-2 right-2 nav-icon-btn danger bg-white rounded-full shadow"><X size={13} /></button></div>
                    : <button onClick={() => { setImgTarget(i); fileRef.current?.click(); }}
                        className="w-full h-28 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 text-xs hover:opacity-80 transition-all"
                        style={{ borderColor: 'var(--border2)', color: 'var(--ink3)' }}>
                        <Image size={20} /><span>Click to upload image</span>
                      </button>
                )}
              </div>
            </div>
          ))}
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
      </div>
    </div>
  );
}

// ── Lock Gate (shown when a locked folder is opened) ─────────────
function LockGate({ folder, onUnlocked }: { folder: Folder; onUnlocked: () => void }) {
  const [pw, setPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const verify = async () => {
    if (!pw.trim()) return;
    setLoading(true); setErr('');
    try {
      await api.post(`/folders/${folder._id}/verify`, { password: pw });
      onUnlocked();
    } catch {
      setErr('Wrong password. Try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center" style={{ background: 'var(--paper)' }}>
      <div className="w-full max-w-sm mx-auto p-8 rounded-3xl text-center"
        style={{ background: '#fff', border: '1.5px solid var(--border)', boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: 'rgba(220,38,38,0.08)', border: '1.5px solid rgba(220,38,38,0.18)' }}>
          <Lock size={28} style={{ color: 'var(--red)' }} />
        </div>
        <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--ink)' }}>Locked Folder</h2>
        <p className="text-sm mb-6" style={{ color: 'var(--ink3)' }}>
          <span style={{ fontWeight: 600 }}>{folder.icon} {folder.name}</span> is protected. Enter the password to open it.
        </p>
        <div className="relative mb-3">
          <input
            type={showPw ? 'text' : 'password'}
            value={pw}
            onChange={e => { setPw(e.target.value); setErr(''); }}
            onKeyDown={e => e.key === 'Enter' && verify()}
            className="input pr-10 text-sm"
            placeholder="Enter password…"
            autoFocus
          />
          <button onClick={() => setShowPw(s => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--ink3)' }}>
            {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
        {err && <p className="text-xs mb-3" style={{ color: 'var(--red)' }}>{err}</p>}
        <button onClick={verify} disabled={loading || !pw.trim()}
          className="btn-primary w-full flex items-center justify-center gap-2">
          {loading ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
          {loading ? 'Verifying…' : 'Open Folder'}
        </button>
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────
export default function MainContent() {
  const {
    selectedFolder, selectedFile,
    setSelectedFolder, setSelectedFile,
    sidebarOpen, setSidebarOpen,
    refreshTrigger, triggerRefresh
  } = useApp();

  const [folders, setFolders] = useState<Folder[]>([]);
  const [subfolders, setSubfolders] = useState<Folder[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [fullFile, setFullFile] = useState<FileItem | null>(null);
  const [loadingFile, setLoadingFile] = useState(false);

  // Lock gate state: null = not locked / already verified, folderId = waiting for password
  const [lockedGate, setLockedGate] = useState<Folder | null>(null);
  // Track which folder IDs have been unlocked this session
  const [sessionUnlocked, setSessionUnlocked] = useState<Set<string>>(new Set());

  // Modal state
  type ModalMode = 'createFolder' | 'editFolder' | 'createFile' | 'editFile' | 'createSubfolder' | 'lockFolder' | 'unlockFolder';
  const [modal, setModal] = useState<{ mode: ModalMode; item?: any } | null>(null);
  const [formName, setFormName] = useState('');
  const [formIcon, setFormIcon] = useState('📁');
  const [formColor, setFormColor] = useState('#6366f1');
  const [formPassword, setFormPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load top-level folders
  useEffect(() => {
    api.get('/folders').then(r => setFolders(r.data)).catch(() => {});
  }, [refreshTrigger]);

  // When a folder is selected, check lock then load subfolders + files
  useEffect(() => {
    if (!selectedFolder) { setSubfolders([]); setFiles([]); setLockedGate(null); return; }

    // If locked and not yet unlocked this session, show gate
    if (selectedFolder.isLocked && !sessionUnlocked.has(selectedFolder._id)) {
      setLockedGate(selectedFolder);
      return;
    }

    setLockedGate(null);
    api.get(`/folders/${selectedFolder._id}/subfolders`).then(r => setSubfolders(r.data)).catch(() => {});
    api.get(`/files/folder/${selectedFolder._id}`).then(r => setFiles(r.data)).catch(() => {});
  }, [selectedFolder, refreshTrigger, sessionUnlocked]);

  // Load full file content
  useEffect(() => {
    if (!selectedFile) { setFullFile(null); return; }
    setLoadingFile(true);
    api.get(`/files/${selectedFile._id}`).then(r => setFullFile(r.data)).catch(() => {}).finally(() => setLoadingFile(false));
  }, [selectedFile?._id]);

  const handleFolderUnlocked = () => {
    if (!selectedFolder) return;
    setSessionUnlocked(s => new Set([...s, selectedFolder._id]));
    setLockedGate(null);
  };

  // ── Modal open helpers ───────────────────────────────────────
  const openCreateFolder = () => { setFormName(''); setFormIcon('📁'); setFormColor('#6366f1'); setModal({ mode: 'createFolder' }); };
  const openEditFolder   = (f: Folder) => { setFormName(f.name); setFormIcon(f.icon || '📁'); setFormColor(f.color || '#6366f1'); setModal({ mode: 'editFolder', item: f }); };
  const openCreateFile   = () => { setFormName(''); setModal({ mode: 'createFile' }); };
  const openEditFile     = (f: FileItem) => { setFormName(f.name); setModal({ mode: 'editFile', item: f }); };
  const openCreateSubfolder = () => { setFormName(''); setFormIcon('📁'); setFormColor('#6366f1'); setModal({ mode: 'createSubfolder' }); };
  const openLockFolder  = (f: Folder) => { setFormPassword(''); setShowPw(false); setModal({ mode: 'lockFolder', item: f }); };
  const openUnlockFolder = (f: Folder) => { setFormPassword(''); setShowPw(false); setModal({ mode: 'unlockFolder', item: f }); };

  // ── Save handler ─────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    try {
      if (modal?.mode === 'createFolder') {
        if (!formName.trim()) return;
        const r = await api.post('/folders', { name: formName, icon: formIcon, color: formColor });
        setSelectedFolder(r.data);
      } else if (modal?.mode === 'createSubfolder') {
        if (!formName.trim() || !selectedFolder) return;
        const r = await api.post('/folders', { name: formName, icon: formIcon, color: formColor, parentFolderId: selectedFolder._id });
        // Open the newly created subfolder
        setSelectedFolder(r.data);
      } else if (modal?.mode === 'editFolder') {
        if (!formName.trim()) return;
        await api.put(`/folders/${modal.item._id}`, { name: formName, icon: formIcon, color: formColor });
        if (selectedFolder?._id === modal.item._id) setSelectedFolder({ ...selectedFolder, name: formName, icon: formIcon, color: formColor });
      } else if (modal?.mode === 'createFile') {
        if (!formName.trim() || !selectedFolder) return;
        const r = await api.post('/files', { name: formName, folderId: selectedFolder._id });
        setSelectedFile(r.data);
      } else if (modal?.mode === 'editFile') {
        if (!formName.trim()) return;
        await api.put(`/files/${modal.item._id}`, { name: formName });
        if (selectedFile?._id === modal.item._id) setSelectedFile({ ...selectedFile, name: formName });
      } else if (modal?.mode === 'lockFolder') {
        if (!formPassword.trim()) { alert('Enter a password'); setSaving(false); return; }
        await api.post(`/folders/${modal.item._id}/lock`, { password: formPassword });
        // Update local state
        const updated = { ...modal.item, isLocked: true };
        if (selectedFolder?._id === modal.item._id) setSelectedFolder(updated);
        setFolders(f => f.map(x => x._id === modal.item._id ? updated : x));
        setSubfolders(f => f.map(x => x._id === modal.item._id ? updated : x));
      } else if (modal?.mode === 'unlockFolder') {
        try {
          await api.post(`/folders/${modal.item._id}/unlock`, { password: formPassword });
          const updated = { ...modal.item, isLocked: false, lockPassword: null };
          if (selectedFolder?._id === modal.item._id) setSelectedFolder(updated);
          setFolders(f => f.map(x => x._id === modal.item._id ? updated : x));
          setSubfolders(f => f.map(x => x._id === modal.item._id ? updated : x));
          // Remove from session unlocked too since it's fully unlocked now
          setSessionUnlocked(s => { const n = new Set(s); n.delete(modal.item._id); return n; });
        } catch {
          alert('Wrong password'); setSaving(false); return;
        }
      }
      setModal(null);
      triggerRefresh();
    } catch (err: any) { alert(err.response?.data?.message || 'Error saving'); }
    finally { setSaving(false); }
  };

  // ── Delete handlers ──────────────────────────────────────────
  const deleteFolder = async (f: Folder) => {
    if (!confirm(`Delete folder "${f.name}" and everything inside?`)) return;
    try {
      await api.delete(`/folders/${f._id}`);
      if (selectedFolder?._id === f._id) setSelectedFolder(null);
      triggerRefresh();
    } catch { alert('Error deleting'); }
  };
  const deleteFile = async (f: FileItem) => {
    if (!confirm(`Delete file "${f.name}"?`)) return;
    try {
      await api.delete(`/files/${f._id}`);
      if (selectedFile?._id === f._id) setSelectedFile(null);
      triggerRefresh();
    } catch { alert('Error deleting'); }
  };

  // ── Breadcrumb ───────────────────────────────────────────────
  const Breadcrumb = () => (
    <div className="flex items-center gap-1 px-4 sm:px-6 py-2.5 flex-shrink-0 overflow-x-auto scrollbar-none"
      style={{ borderBottom: '1.5px solid var(--border)', background: '#fff' }}>
      {!sidebarOpen && (
        <button onClick={() => setSidebarOpen(true)} className="mr-2 flex-shrink-0">
          <Menu size={16} style={{ color: 'var(--ink3)' }} />
        </button>
      )}
      <button onClick={() => setSelectedFolder(null)}
        className="text-xs hover:underline flex-shrink-0" style={{ color: 'var(--ink3)' }}>Home</button>
      {selectedFolder && <>
        <ChevronRight size={11} style={{ color: 'var(--border2)', flexShrink: 0 }} />
        <button onClick={() => setSelectedFile(null)}
          className={`text-xs flex-shrink-0 whitespace-nowrap ${selectedFile ? 'hover:underline' : 'font-semibold'}`}
          style={{ color: selectedFile ? 'var(--ink3)' : 'var(--ink)' }}>{selectedFolder.icon} {selectedFolder.name}</button>
      </>}
      {selectedFile && <>
        <ChevronRight size={11} style={{ color: 'var(--border2)', flexShrink: 0 }} />
        <span className="text-xs font-semibold whitespace-nowrap" style={{ color: 'var(--ink)' }}>{selectedFile.name}</span>
      </>}
    </div>
  );

  // ── File view (editor) ───────────────────────────────────────
  if (selectedFile) {
    if (loadingFile) return (
      <div className="flex-1 flex items-center justify-center" style={{ background: 'var(--paper)' }}>
        <Loader2 size={22} className="animate-spin" style={{ color: 'var(--green)' }} />
      </div>
    );
    return (
      <div className="flex-1 flex flex-col min-h-0" style={{ background: 'var(--paper)' }}>
        <Breadcrumb />
        <div className="px-4 sm:px-6 pt-4 flex-shrink-0">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <h1 className="text-lg font-bold mr-auto" style={{ color: 'var(--ink)' }}>
              📄 {fullFile?.name || selectedFile.name}
            </h1>
            <BtnEdit onClick={() => openEditFile(selectedFile)} />
            <BtnDelete onClick={() => deleteFile(selectedFile)} />
          </div>
        </div>
        {fullFile && <FileEditor file={fullFile} onUpdate={f => setFullFile(f)} />}
        {renderModal()}
      </div>
    );
  }

  // ── Folder view ──────────────────────────────────────────────
  if (selectedFolder) {
    // Show lock gate if locked
    if (lockedGate) {
      return (
        <div className="flex-1 flex flex-col min-h-0" style={{ background: 'var(--paper)' }}>
          <Breadcrumb />
          <LockGate folder={lockedGate} onUnlocked={handleFolderUnlocked} />
        </div>
      );
    }

    return (
      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto" style={{ background: 'var(--paper)' }}>
        <Breadcrumb />
        <div className="px-4 sm:px-6 py-5 animate-fade-in">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--ink)' }}>
              <span>{selectedFolder.icon}</span>{selectedFolder.name}
              {selectedFolder.isLocked && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                  style={{ background: 'rgba(220,38,38,0.08)', color: 'var(--red)', border: '1px solid rgba(220,38,38,0.18)' }}>
                  <Lock size={10} />Locked
                </span>
              )}
            </h1>
          </div>

          {/* ── Action buttons ── */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <BtnCreate label="New File" icon={FilePlus} onClick={openCreateFile} />
            <BtnCreate label="New Subfolder" icon={FolderPlus} onClick={openCreateSubfolder} />
            <BtnEdit onClick={() => openEditFolder(selectedFolder)} />
            {selectedFolder.isLocked
              ? <BtnLock isLocked={true} onClick={() => openUnlockFolder(selectedFolder)} />
              : <BtnLock isLocked={false} onClick={() => openLockFolder(selectedFolder)} />
            }
            <BtnDelete onClick={() => deleteFolder(selectedFolder)} />
          </div>

          {/* ── Subfolders ── */}
          {subfolders.length > 0 && (
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--ink3)' }}>Subfolders</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {subfolders.map(sub => (
                  <div key={sub._id} className="rounded-2xl p-4 transition-all hover:-translate-y-0.5 animate-slide-up"
                    style={{ background: '#fff', border: '1.5px solid var(--border)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 relative"
                        style={{ background: `${sub.color || '#6366f1'}18` }}>
                        {sub.icon || '📁'}
                        {sub.isLocked && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
                            style={{ background: 'var(--red)' }}>
                            <Lock size={8} color="#fff" />
                          </span>
                        )}
                      </div>
                      <button className="font-semibold text-sm text-left hover:text-green-700 transition-colors flex-1 truncate"
                        style={{ color: 'var(--ink)' }} onClick={() => setSelectedFolder(sub)}>
                        {sub.name}
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                      <button onClick={() => setSelectedFolder(sub)}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs hover:bg-green-50 transition-colors"
                        style={{ color: 'var(--green)' }}><FolderIcon size={11} />Open</button>
                      <button onClick={() => openEditFolder(sub)}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs hover:bg-indigo-50 transition-colors"
                        style={{ color: '#6366f1' }}><Pencil size={11} />Edit</button>
                      {sub.isLocked
                        ? <button onClick={() => openUnlockFolder(sub)}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs hover:bg-red-50 transition-colors"
                            style={{ color: 'var(--red)' }}><LockOpen size={11} />Unlock</button>
                        : <button onClick={() => openLockFolder(sub)}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs hover:bg-yellow-50 transition-colors"
                            style={{ color: '#b45309' }}><Lock size={11} />Lock</button>
                      }
                      <button onClick={() => deleteFolder(sub)}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs hover:bg-red-50 transition-colors"
                        style={{ color: 'var(--red)' }}><Trash2 size={11} />Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Files ── */}
          {subfolders.length > 0 && files.length > 0 && (
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--ink3)' }}>Files</p>
          )}
          {files.length === 0 && subfolders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
                style={{ background: 'var(--paper2)', border: '1.5px solid var(--border)' }}>
                <FileText size={20} style={{ color: 'var(--ink3)' }} />
              </div>
              <p className="text-sm font-medium mb-1" style={{ color: 'var(--ink2)' }}>Empty folder</p>
              <div className="flex gap-2 mt-3">
                <button onClick={openCreateFile}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90"
                  style={{ background: 'var(--green)', color: '#fff' }}>
                  <FilePlus size={15} />New File
                </button>
                <button onClick={openCreateSubfolder}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90"
                  style={{ background: 'var(--paper2)', color: 'var(--ink2)', border: '1.5px solid var(--border)' }}>
                  <FolderPlus size={15} />New Subfolder
                </button>
              </div>
            </div>
          ) : files.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {files.map(file => (
                <div key={file._id} className="rounded-2xl p-4 transition-all hover:-translate-y-0.5 animate-slide-up"
                  style={{ background: '#fff', border: '1.5px solid var(--border)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'var(--green-lt)' }}>
                      <FileText size={16} style={{ color: 'var(--green)' }} />
                    </div>
                    <button className="font-semibold text-sm text-left hover:text-green-700 transition-colors flex-1 mt-1"
                      style={{ color: 'var(--ink)' }} onClick={() => setSelectedFile(file)}>
                      {file.name}
                    </button>
                  </div>
                  <div className="text-xs mb-3" style={{ color: 'var(--ink3)' }}>
                    {file.content?.length || 0} block{file.content?.length !== 1 ? 's' : ''} · {new Date(file.updatedAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1.5 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                    <button onClick={() => setSelectedFile(file)}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs hover:bg-green-50 transition-colors"
                      style={{ color: 'var(--green)' }}><FileText size={11} />Open</button>
                    <button onClick={() => openEditFile(file)}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs hover:bg-indigo-50 transition-colors"
                      style={{ color: '#6366f1' }}><Pencil size={11} />Edit</button>
                    <button onClick={() => deleteFile(file)}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs hover:bg-red-50 transition-colors"
                      style={{ color: 'var(--red)' }}><Trash2 size={11} />Delete</button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
        {renderModal()}
      </div>
    );
  }

  // ── Home screen ──────────────────────────────────────────────
  return (
    <div className="flex-1 overflow-y-auto" style={{ background: 'var(--paper)' }}>
      <div className="px-4 sm:px-6 py-5 animate-fade-in">
        <div className="flex items-center gap-3 mb-1">
          {!sidebarOpen && (
            <button onClick={() => setSidebarOpen(true)} className="flex-shrink-0">
              <Menu size={20} style={{ color: 'var(--ink3)' }} />
            </button>
          )}
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--ink)' }}>
            <BookOpenCheck size={24} style={{ color: 'var(--green)' }} />StudSave
          </h1>
        </div>
        <p className="text-sm mb-5" style={{ color: 'var(--ink3)' }}>
          Create a folder to get started. Inside each folder you can create files and subfolders.
        </p>

        <div className="flex flex-wrap items-center gap-2 mb-6">
          <BtnCreate label="New Folder" icon={FolderPlus} onClick={openCreateFolder} />
        </div>

        {folders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: 'var(--paper2)', border: '1.5px solid var(--border)' }}>
              <FolderIcon size={28} style={{ color: 'var(--ink3)' }} />
            </div>
            <p className="text-base font-semibold mb-1" style={{ color: 'var(--ink2)' }}>No folders yet</p>
            <p className="text-sm mb-4" style={{ color: 'var(--ink3)' }}>Create your first folder to start organising</p>
            <button onClick={openCreateFolder}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90"
              style={{ background: 'var(--green)', color: '#fff' }}>
              <FolderPlus size={16} />Create Folder
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {folders.map(folder => (
              <div key={folder._id} className="rounded-2xl p-4 transition-all hover:-translate-y-0.5 animate-slide-up"
                style={{ background: '#fff', border: '1.5px solid var(--border)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 relative"
                    style={{ background: `${folder.color}18` }}>
                    {folder.icon || '📁'}
                    {folder.isLocked && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
                        style={{ background: 'var(--red)' }}>
                        <Lock size={8} color="#fff" />
                      </span>
                    )}
                  </div>
                  <button className="font-semibold text-sm text-left hover:text-green-700 transition-colors flex-1 truncate"
                    style={{ color: 'var(--ink)' }} onClick={() => setSelectedFolder(folder)}>
                    {folder.name}
                  </button>
                </div>
                <div className="flex items-center gap-1.5 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                  <button onClick={() => setSelectedFolder(folder)}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs hover:bg-green-50 transition-colors"
                    style={{ color: 'var(--green)' }}><FolderIcon size={11} />Open</button>
                  <button onClick={() => openEditFolder(folder)}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs hover:bg-indigo-50 transition-colors"
                    style={{ color: '#6366f1' }}><Pencil size={11} />Edit</button>
                  {folder.isLocked
                    ? <button onClick={() => openUnlockFolder(folder)}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs hover:bg-red-50 transition-colors"
                        style={{ color: 'var(--red)' }}><LockOpen size={11} />Unlock</button>
                    : <button onClick={() => openLockFolder(folder)}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs hover:bg-yellow-50 transition-colors"
                        style={{ color: '#b45309' }}><Lock size={11} />Lock</button>
                  }
                  <button onClick={() => deleteFolder(folder)}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs hover:bg-red-50 transition-colors"
                    style={{ color: 'var(--red)' }}><Trash2 size={11} />Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {renderModal()}
    </div>
  );

  // ── Modal renderer ───────────────────────────────────────────
  function renderModal() {
    if (!modal) return null;

    // Lock modal
    if (modal.mode === 'lockFolder') {
      return (
        <Modal title={`Lock "${modal.item?.name}"`} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <p className="text-sm" style={{ color: 'var(--ink3)' }}>
              Set a password to protect this folder. Anyone opening it will need to enter the password.
            </p>
            <div>
              <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--ink3)' }}>Password *</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={formPassword}
                  onChange={e => setFormPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSave()}
                  className="input pr-10" placeholder="Enter a password…" autoFocus />
                <button onClick={() => setShowPw(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--ink3)' }}>
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <button onClick={() => setModal(null)} className="btn-ghost">Cancel</button>
              <button onClick={handleSave} disabled={saving || !formPassword.trim()}
                className="btn-primary flex items-center gap-2"
                style={{ background: 'var(--red)', borderColor: 'var(--red)' }}>
                {saving ? <Loader2 size={13} className="animate-spin" /> : <Lock size={13} />}
                {saving ? 'Locking…' : 'Lock Folder'}
              </button>
            </div>
          </div>
        </Modal>
      );
    }

    // Unlock modal
    if (modal.mode === 'unlockFolder') {
      return (
        <Modal title={`Remove Lock from "${modal.item?.name}"`} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <p className="text-sm" style={{ color: 'var(--ink3)' }}>
              Enter the current password to permanently remove the lock from this folder.
            </p>
            <div>
              <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--ink3)' }}>Current Password *</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={formPassword}
                  onChange={e => setFormPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSave()}
                  className="input pr-10" placeholder="Enter current password…" autoFocus />
                <button onClick={() => setShowPw(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--ink3)' }}>
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <button onClick={() => setModal(null)} className="btn-ghost">Cancel</button>
              <button onClick={handleSave} disabled={saving || !formPassword.trim()} className="btn-primary flex items-center gap-2">
                {saving ? <Loader2 size={13} className="animate-spin" /> : <LockOpen size={13} />}
                {saving ? 'Removing…' : 'Remove Lock'}
              </button>
            </div>
          </div>
        </Modal>
      );
    }

    const isFolder = modal.mode === 'createFolder' || modal.mode === 'editFolder' || modal.mode === 'createSubfolder';
    const isCreate = modal.mode === 'createFolder' || modal.mode === 'createFile' || modal.mode === 'createSubfolder';
    const title =
      modal.mode === 'createFolder' ? 'New Folder' :
      modal.mode === 'createSubfolder' ? 'New Subfolder' :
      modal.mode === 'editFolder' ? 'Edit Folder' :
      modal.mode === 'createFile' ? 'New File' : 'Rename File';

    return (
      <Modal title={title} onClose={() => setModal(null)}>
        <div className="space-y-4">
          {isFolder && (
            <div>
              <label className="block text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: 'var(--ink3)' }}>Icon</label>
              <div className="flex flex-wrap gap-2">
                {ICONS.map(icon => (
                  <button key={icon} onClick={() => setFormIcon(icon)}
                    className="w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all hover:scale-105"
                    style={{ background: formIcon === icon ? 'var(--green-lt)' : 'var(--paper2)', boxShadow: formIcon === icon ? '0 0 0 2px var(--green)' : 'none' }}>
                    {icon}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div>
            <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--ink3)' }}>Name *</label>
            <input value={formName} onChange={e => setFormName(e.target.value)}
              className="input" placeholder={isFolder ? 'Folder name…' : 'File name…'} autoFocus
              onKeyDown={e => { if (e.key === 'Enter') handleSave(); }} />
          </div>
          {isFolder && (
            <div>
              <label className="block text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: 'var(--ink3)' }}>Color</label>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map(c => (
                  <button key={c} onClick={() => setFormColor(c)}
                    className="w-7 h-7 rounded-full transition-all hover:scale-110"
                    style={{ background: c, boxShadow: formColor === c ? `0 0 0 2px #fff, 0 0 0 4px ${c}` : 'none' }} />
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-2 justify-end pt-1">
            <button onClick={() => setModal(null)} className="btn-ghost">Cancel</button>
            <button onClick={handleSave} disabled={saving || !formName.trim()} className="btn-primary">
              {saving ? <Loader2 size={13} className="animate-spin" /> : null}
              {saving ? 'Saving…' : isCreate ? 'Create' : 'Save Changes'}
            </button>
          </div>
        </div>
      </Modal>
    );
  }
}
