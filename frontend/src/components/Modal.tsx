import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps { title: string; onClose: () => void; children: React.ReactNode; size?: 'sm'|'md'|'lg'; }

export default function Modal({ title, onClose, children, size='md' }: ModalProps) {
  useEffect(() => {
    const h = (e:KeyboardEvent) => { if(e.key==='Escape') onClose(); };
    document.addEventListener('keydown',h); return ()=>document.removeEventListener('keydown',h);
  },[onClose]);

  const w = {sm:'max-w-sm',md:'max-w-md',lg:'max-w-2xl'}[size];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/25 backdrop-blur-sm"/>
      <div className={`relative w-full ${w} modal-card animate-slide-up rounded-t-3xl sm:rounded-3xl max-h-[92dvh] overflow-y-auto`}
        onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4" style={{borderBottom:'1.5px solid var(--border)'}}>
          <h2 className="font-bold text-base" style={{color:'var(--ink)'}}>{title}</h2>
          <button onClick={onClose} className="btn-ghost !px-2 !py-2 !border-0">
            <X size={16} style={{color:'var(--ink3)'}}/>
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
