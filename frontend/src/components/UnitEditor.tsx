import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, FileText, Code2, Image, Trash2, ChevronUp, ChevronDown, CheckCircle, AlertCircle, Loader2, Clock, X } from 'lucide-react';
import { Unit, ContentBlock, ContentType, Progress } from '../utils/types';
import { useAutoSave } from '../hooks/useAutoSave';
import api from '../utils/api';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-css';
import 'prismjs/themes/prism-tomorrow.css';

const LANGS = ['javascript','typescript','python','java','c','cpp','css','html','sql','bash','json','text'];

interface Props { unit: Unit; onUpdate: (u: Unit) => void; }

const SaveBadge = ({ status }: { status: string }) => {
  const map: Record<string,{icon:React.ReactNode;text:string;color:string}> = {
    saving: { icon:<Loader2 size={11} className="animate-spin"/>, text:'Saving…', color:'var(--ink3)' },
    saved:  { icon:<CheckCircle size={11}/>, text:'Saved', color:'var(--green)' },
    error:  { icon:<AlertCircle size={11}/>, text:'Error',  color:'var(--red)' },
  };
  const c = map[status]; if(!c) return null;
  return <span className="flex items-center gap-1 text-xs font-medium" style={{color:c.color}}>{c.icon}{c.text}</span>;
};

export default function UnitEditor({ unit, onUpdate }: Props) {
  const [content, setContent] = useState<ContentBlock[]>(unit.content||[]);
  const [progress, setProgress] = useState<Progress>(unit.progress);
  const [previewing, setPreviewing] = useState<{[k:string]:boolean}>({});
  const { save, status } = useAutoSave(unit._id);
  const fileRef = useRef<HTMLInputElement>(null);
  const [imgTarget, setImgTarget] = useState<number|null>(null);

  useEffect(()=>{ setContent(unit.content||[]); setProgress(unit.progress); setPreviewing({}); },[unit._id]);
  useEffect(()=>{ Prism.highlightAll(); },[content,previewing]);

  const updateContent = useCallback((nc:ContentBlock[])=>{ setContent(nc); save(nc); },[save]);
  const addBlock = (type:ContentType) => {
    const key=`${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
    updateContent([...content,{type,title:'',value:'',language:'javascript',order:content.length,_id:key}]);
  };
  const updateBlock = (i:number,f:keyof ContentBlock,v:string) => updateContent(content.map((b,idx)=>idx===i?{...b,[f]:v}:b));
  const removeBlock = (i:number) => updateContent(content.filter((_,idx)=>idx!==i));
  const moveBlock   = (i:number,d:-1|1) => {
    const n=[...content]; const t=i+d;
    if(t<0||t>=n.length) return;
    [n[i],n[t]]=[n[t],n[i]];
    updateContent(n.map((b,idx)=>({...b,order:idx})));
  };
  const handleProgress = async (p:Progress)=>{ setProgress(p); await api.patch(`/units/${unit._id}/progress`,{progress:p}); onUpdate({...unit,progress:p}); };
  const handleImage = (i:number)=>{ setImgTarget(i); fileRef.current?.click(); };
  const onFileChange = (e:React.ChangeEvent<HTMLInputElement>)=>{
    const f=e.target.files?.[0]; if(!f||imgTarget===null) return;
    const r=new FileReader(); r.onload=()=>updateBlock(imgTarget,'value',r.result as string); r.readAsDataURL(f); e.target.value='';
  };

  // Block type styles
  const blockMeta = (type:ContentType) => ({
    text:  { label:'Text',  icon:<FileText size={13}/>,  labelColor:'var(--blue)',  labelBg:'var(--blue-lt)' },
    code:  { label:'Code',  icon:<Code2 size={13}/>,     labelColor:'var(--green)', labelBg:'var(--green-lt)' },
    image: { label:'Image', icon:<Image size={13}/>,     labelColor:'#7c3aed',      labelBg:'#ede9fe' },
  }[type]);

  return (
    <div className="flex flex-col h-full animate-fade-in" style={{background:'var(--paper)'}}>

      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-4 flex-shrink-0"
        style={{borderBottom:'1.5px solid var(--border)',background:'#fff'}}>
        <div className="min-w-0 flex-1">
          <h1 className="text-lg sm:text-xl font-bold truncate" style={{color:'var(--ink)'}}>{unit.name}</h1>
          {unit.description&&<p className="text-xs sm:text-sm mt-0.5 truncate" style={{color:'var(--ink3)'}}>{unit.description}</p>}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <SaveBadge status={status}/>
          {/* Progress toggle */}
          <div className="flex items-center rounded-xl overflow-hidden" style={{border:'1.5px solid var(--border)'}}>
            {(['pending','in-progress','completed'] as Progress[]).map((p,i)=>(
              <button key={p} onClick={()=>handleProgress(p)}
                className="text-xs px-2 sm:px-3 py-1.5 font-semibold transition-all whitespace-nowrap"
                style={{
                  background: progress===p ? (p==='pending'?'#f3f4f6':p==='in-progress'?'var(--amber-lt)':'var(--green-lt)') : '#fff',
                  color:      progress===p ? (p==='pending'?'#4b5563':p==='in-progress'?'var(--amber)':'var(--green2)') : 'var(--ink3)',
                  borderRight: i<2 ? '1.5px solid var(--border)' : 'none',
                }}>
                {p==='pending'?'Pending':p==='in-progress'?'In Progress':'Done'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Blocks: ONE BELOW ANOTHER vertically ── */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-5">
        {content.length===0&&(
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
              style={{background:'var(--paper2)',border:'1.5px solid var(--border)'}}>
              <FileText size={24} style={{color:'var(--ink3)'}}/>
            </div>
            <h3 className="font-semibold mb-1" style={{color:'var(--ink2)'}}>Empty file</h3>
            <p className="text-sm" style={{color:'var(--ink3)'}}>Add blocks below to start writing</p>
          </div>
        )}

        {/* ✅ VERTICAL STACK — each block is full width, one below another */}
        <div className="flex flex-col gap-4 w-full">
          {content.map((block,idx)=>{
            const meta=blockMeta(block.type);
            const key=block._id??`b-${idx}`;
            return (
              <div key={key} className="block-card animate-slide-up">

                {/* Toolbar */}
                <div className="block-toolbar">
                  {/* Type badge */}
                  <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg"
                    style={{background:meta.labelBg,color:meta.labelColor}}>
                    {meta.icon}{meta.label}
                  </span>

                  {/* Switch type */}
                  <div className="flex rounded-lg overflow-hidden" style={{border:'1.5px solid var(--border)'}}>
                    {(['text','code','image'] as ContentType[]).map((t,i)=>(
                      <button key={t} onClick={()=>updateBlock(idx,'type',t)}
                        className="px-2 py-0.5 text-xs font-semibold capitalize transition-all"
                        style={{
                          background: block.type===t ? 'var(--green)' : '#fff',
                          color:      block.type===t ? '#fff' : 'var(--ink3)',
                          borderRight: i<2 ? '1px solid var(--border)' : 'none',
                        }}>{t}</button>
                    ))}
                  </div>

                  {block.type==='code'&&(
                    <select value={block.language} onChange={e=>updateBlock(idx,'language',e.target.value)}
                      className="text-xs rounded-lg px-2 py-1.5 focus:outline-none transition-all"
                      style={{background:'var(--paper)',border:'1.5px solid var(--border)',color:'var(--ink2)',fontFamily:'DM Mono, monospace'}}>
                      {LANGS.map(l=><option key={l} value={l}>{l}</option>)}
                    </select>
                  )}

                  {block.type!=='image'&&(
                    <button onClick={()=>setPreviewing(p=>({...p,[key]:!p[key]}))}
                      className="text-xs px-2.5 py-1 rounded-lg font-semibold transition-all"
                      style={{
                        background: previewing[key] ? 'var(--green-lt)' : 'var(--paper)',
                        color:      previewing[key] ? 'var(--green2)' : 'var(--ink3)',
                        border: '1.5px solid var(--border)',
                      }}>
                      {previewing[key]?'Edit':'Preview'}
                    </button>
                  )}

                  {/* Move + delete */}
                  <div className="flex items-center gap-1 ml-auto">
                    <button onClick={()=>moveBlock(idx,-1)} disabled={idx===0}
                      className="p-1 rounded-lg transition-colors disabled:opacity-20"
                      style={{color:'var(--ink3)'}} onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='var(--paper3)'} onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='transparent'}>
                      <ChevronUp size={14}/>
                    </button>
                    <button onClick={()=>moveBlock(idx,1)} disabled={idx===content.length-1}
                      className="p-1 rounded-lg transition-colors disabled:opacity-20"
                      style={{color:'var(--ink3)'}} onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='var(--paper3)'} onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='transparent'}>
                      <ChevronDown size={14}/>
                    </button>
                    <button onClick={()=>removeBlock(idx)}
                      className="p-1 rounded-lg transition-colors"
                      style={{color:'var(--ink3)'}} onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background='var(--red-lt)';(e.currentTarget as HTMLElement).style.color='var(--red)';}} onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background='transparent';(e.currentTarget as HTMLElement).style.color='var(--ink3)';}}>
                      <Trash2 size={14}/>
                    </button>
                  </div>
                </div>

                {/* Optional title */}
                <div className="px-4 pt-3 pb-1">
                  <input value={block.title} onChange={e=>updateBlock(idx,'title',e.target.value)}
                    className="w-full bg-transparent text-sm font-bold focus:outline-none transition-colors"
                    style={{color:'var(--ink2)',caretColor:'var(--green)'}}
                    placeholder="Block title (optional)…"/>
                </div>

                {/* ── Content ── */}
                <div className="px-4 pb-4">

                  {block.type==='text'&&(
                    previewing[key]
                      ? <div className="text-sm leading-relaxed whitespace-pre-wrap py-2 min-h-16" style={{color:'var(--ink)'}}>{block.value||<span style={{color:'var(--ink3)',fontStyle:'italic'}}>Nothing to preview</span>}</div>
                      : <textarea value={block.value} onChange={e=>updateBlock(idx,'value',e.target.value)}
                          className="w-full text-sm rounded-xl px-3 py-3 focus:outline-none resize-none leading-relaxed transition-all"
                          style={{background:'var(--paper2)',border:'1.5px solid var(--border)',color:'var(--ink)',minHeight:'8rem',fontFamily:'DM Sans, sans-serif'}}
                          placeholder="Write your notes here…" rows={6}
                          onFocus={e=>{e.currentTarget.style.borderColor='var(--green)';}}
                          onBlur={e=>{e.currentTarget.style.borderColor='var(--border)';}}/>
                  )}

                  {block.type==='code'&&(
                    previewing[key]
                      ? <div className="rounded-xl overflow-hidden"><pre className={`language-${block.language} !m-0 overflow-x-auto`}><code className={`language-${block.language}`}>{block.value}</code></pre></div>
                      : <textarea value={block.value} onChange={e=>updateBlock(idx,'value',e.target.value)}
                          className="w-full text-sm rounded-xl px-3 py-3 focus:outline-none resize-none leading-relaxed transition-all"
                          style={{background:'#1e1e2e',border:'1.5px solid var(--border)',color:'#a6e3a1',minHeight:'10rem',fontFamily:'DM Mono, monospace'}}
                          placeholder={`// ${block.language} code here…`} rows={8} spellCheck={false}
                          onFocus={e=>{e.currentTarget.style.borderColor='var(--green)';}}
                          onBlur={e=>{e.currentTarget.style.borderColor='var(--border)';}}/>
                  )}

                  {block.type==='image'&&(
                    block.value
                      ? <div className="relative group/img">
                          <img src={block.value} alt={block.title||'Image'}
                            className="w-full max-h-72 sm:max-h-96 rounded-xl object-contain"
                            style={{background:'var(--paper2)',border:'1.5px solid var(--border)'}}/>
                          <button onClick={()=>updateBlock(idx,'value','')}
                            className="absolute top-2 right-2 opacity-0 group-hover/img:opacity-100 transition-opacity text-white p-1.5 rounded-lg"
                            style={{background:'var(--red)'}}>
                            <X size={13}/>
                          </button>
                        </div>
                      : <button onClick={()=>handleImage(idx)}
                          className="w-full h-32 sm:h-44 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 transition-all"
                          style={{borderColor:'var(--border2)',color:'var(--ink3)'}}
                          onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor='var(--green)';(e.currentTarget as HTMLElement).style.background='var(--green-lt)';}}
                          onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor='var(--border2)';(e.currentTarget as HTMLElement).style.background='transparent';}}>
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{background:'var(--paper2)'}}>
                            <Image size={18} style={{color:'var(--ink3)'}}/>
                          </div>
                          <span className="text-sm font-medium">Click to upload image</span>
                          <span className="text-xs" style={{color:'var(--ink3)'}}>PNG, JPG, GIF</span>
                        </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <input ref={fileRef} type="file" accept="image/*" onChange={onFileChange} className="hidden"/>
      </div>

      {/* ── Add block bar ── */}
      <div className="flex-shrink-0 px-4 sm:px-6 py-3 flex flex-wrap items-center gap-2"
        style={{borderTop:'1.5px solid var(--border)',background:'#fff'}}>
        <span className="text-xs font-semibold hidden sm:inline" style={{color:'var(--ink3)'}}>Add:</span>
        <button onClick={()=>addBlock('text')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:scale-105"
          style={{background:'var(--blue-lt)',color:'var(--blue)',border:'1.5px solid #bfdbfe'}}>
          <FileText size={12}/>Text
        </button>
        <button onClick={()=>addBlock('code')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:scale-105"
          style={{background:'var(--green-lt)',color:'var(--green2)',border:'1.5px solid var(--green-md)'}}>
          <Code2 size={12}/>Code
        </button>
        <button onClick={()=>addBlock('image')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:scale-105"
          style={{background:'#ede9fe',color:'#6d28d9',border:'1.5px solid #c4b5fd'}}>
          <Image size={12}/>Image
        </button>
        <div className="ml-auto flex items-center gap-1.5 text-xs" style={{color:'var(--ink3)'}}>
          <Clock size={11}/>
          <span className="hidden sm:inline">
            {unit.updatedAt?`Saved ${new Date(unit.updatedAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}` :''}
          </span>
        </div>
      </div>
    </div>
  );
}
