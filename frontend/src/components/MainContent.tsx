import React, { useEffect, useState } from 'react';
import { BookOpen, BookMarked, FileText, Loader2, ChevronRight, BookOpenCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Unit } from '../utils/types';
import api from '../utils/api';
import UnitEditor from './UnitEditor';

export default function MainContent() {
  const { selectedAcademic, selectedSemester, selectedSubject, selectedUnit, setSelectedUnit, sidebarOpen } = useApp();
  const [units, setUnits] = useState<Unit[]>([]);
  const [loadingUnit, setLoadingUnit] = useState(false);
  const [fullUnit, setFullUnit] = useState<Unit | null>(null);

  useEffect(() => {
    if (!selectedSubject) { setUnits([]); return; }
    api.get(`/units/subject/${selectedSubject._id}`).then(r => setUnits(r.data)).catch(() => {});
  }, [selectedSubject]);

  useEffect(() => {
    if (!selectedUnit) { setFullUnit(null); return; }
    setFullUnit(null); setLoadingUnit(true);
    api.get(`/units/${selectedUnit._id}`).then(r => setFullUnit(r.data)).catch(() => {}).finally(() => setLoadingUnit(false));
  }, [selectedUnit?._id]);

  const BADGE:Record<string,string> = { pending:'badge-progress-pending','in-progress':'badge-progress-in-progress',completed:'badge-progress-completed' };
  const LABEL:Record<string,string> = { pending:'Pending','in-progress':'In Progress',completed:'Completed' };

  // ── Empty states ───────────────────────────────────────────────
  const Empty = ({ icon:Icon, title, sub }: { icon:any; title:string; sub:string }) => (
    <div className="flex-1 flex items-center justify-center" style={{background:'var(--paper)'}}>
      <div className="text-center animate-fade-in px-6">
        <div className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4"
          style={{background:'var(--paper2)',border:'1.5px solid var(--border)'}}>
          <Icon size={28} style={{color:'var(--green)',opacity:0.5}}/>
        </div>
        <h2 className="font-bold text-base mb-1" style={{color:'var(--ink)'}}>{title}</h2>
        <p className="text-sm" style={{color:'var(--ink3)'}}>{sub}</p>
      </div>
    </div>
  );

  // ── Breadcrumb ─────────────────────────────────────────────────
  const Breadcrumb = ({ extra }: { extra?: string }) => (
    <div className="flex items-center gap-1 px-4 sm:px-6 py-2.5 overflow-x-auto scrollbar-none flex-shrink-0"
      style={{borderBottom:'1.5px solid var(--border)',background:'#fff'}}>
      {selectedAcademic && <><span className="text-xs whitespace-nowrap" style={{color:'var(--ink3)'}}>{selectedAcademic.name}</span><ChevronRight size={11} style={{color:'var(--border2)',flexShrink:0}}/></>}
      {selectedSemester && <><span className="text-xs whitespace-nowrap" style={{color:'var(--ink3)'}}>{selectedSemester.name}</span><ChevronRight size={11} style={{color:'var(--border2)',flexShrink:0}}/></>}
      {selectedSubject  && <><span className="text-xs whitespace-nowrap" style={{color:'var(--ink3)'}}>{selectedSubject.name}</span>{extra&&<ChevronRight size={11} style={{color:'var(--border2)',flexShrink:0}}/>}</>}
      {extra && <span className="text-xs font-semibold whitespace-nowrap" style={{color:'var(--ink)'}}>{extra}</span>}
    </div>
  );

  if (!selectedAcademic) return (
    <Empty icon={BookOpenCheck} title="Welcome to StudSave"
      sub={sidebarOpen ? 'Select or create an academic from the sidebar.' : 'Tap ☰ to open the sidebar and get started.'} />
  );
  if (!selectedSemester) return <Empty icon={BookOpen} title={selectedAcademic.name} sub="Select a semester from the sidebar"/>;
  if (!selectedSubject)  return <Empty icon={BookMarked} title={selectedSemester.name} sub="Select a subject from the sidebar"/>;

  // ── Loading unit ───────────────────────────────────────────────
  if (loadingUnit) return (
    <div className="flex-1 flex items-center justify-center" style={{background:'var(--paper)'}}>
      <div className="flex flex-col items-center gap-3">
        <Loader2 size={22} className="animate-spin" style={{color:'var(--green)'}}/>
        <span className="text-sm" style={{color:'var(--ink3)'}}>Loading…</span>
      </div>
    </div>
  );

  // ── Unit editor ────────────────────────────────────────────────
  if (selectedUnit && fullUnit && !loadingUnit) return (
    <div className="flex-1 flex flex-col min-h-0" style={{background:'var(--paper)'}}>
      <Breadcrumb extra={fullUnit.name}/>
      <UnitEditor unit={fullUnit} onUpdate={u => setFullUnit(u)}/>
    </div>
  );

  // ── Subject view (list of files) ───────────────────────────────
  const done = units.filter(u => u.progress === 'completed').length;
  const pct  = units.length ? Math.round((done/units.length)*100) : 0;

  return (
    <div className="flex-1 overflow-y-auto" style={{background:'var(--paper)'}}>
      <Breadcrumb/>
      <div className="px-4 sm:px-6 py-5 animate-fade-in">
        {/* Subject header */}
        <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2" style={{color:'var(--ink)'}}>
              <span>{selectedSubject.icon}</span>{selectedSubject.name}
            </h1>
            {selectedSubject.description&&<p className="text-sm mt-1" style={{color:'var(--ink3)'}}>{selectedSubject.description}</p>}
          </div>
          <div className="text-sm flex items-center gap-2" style={{color:'var(--ink3)'}}>
            <span>{units.length} file{units.length!==1?'s':''}</span>
            <span>·</span>
            <span style={{color:'var(--green)',fontWeight:600}}>{done} done</span>
          </div>
        </div>

        {/* Progress bar */}
        {units.length>0&&(
          <div className="mb-6">
            <div className="flex justify-between text-xs mb-1.5" style={{color:'var(--ink3)'}}>
              <span>Progress</span><span style={{color:'var(--green)',fontWeight:600}}>{pct}%</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{background:'var(--paper3)'}}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{width:`${pct}%`,background:'linear-gradient(90deg, var(--green), var(--green-md))'}}/>
            </div>
          </div>
        )}

        {/* Files grid */}
        {units.length===0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
              style={{background:'var(--paper2)',border:'1.5px solid var(--border)'}}>
              <FileText size={24} style={{color:'var(--ink3)'}}/>
            </div>
            <h3 className="font-semibold mb-1" style={{color:'var(--ink2)'}}>No files yet</h3>
            <p className="text-sm" style={{color:'var(--ink3)'}}>Click the + next to this subject to add a file</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {units.map(unit=>(
              <button key={unit._id} onClick={()=>setSelectedUnit(unit)}
                className="text-left rounded-2xl p-4 transition-all group hover:-translate-y-0.5 animate-slide-up"
                style={{background:'#fff',border:'1.5px solid var(--border)',boxShadow:'0 1px 4px rgba(0,0,0,0.04)'}}
                onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor='var(--green)';(e.currentTarget as HTMLElement).style.boxShadow='0 4px 16px rgba(45,106,79,0.12)';}}
                onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor='var(--border)';(e.currentTarget as HTMLElement).style.boxShadow='0 1px 4px rgba(0,0,0,0.04)';}}>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{background:'var(--green-lt)'}}>
                    <FileText size={16} style={{color:'var(--green)'}}/>
                  </div>
                  <span className={BADGE[unit.progress]}>{LABEL[unit.progress]}</span>
                </div>
                <h3 className="font-semibold text-sm mb-1 transition-colors group-hover:text-green-700" style={{color:'var(--ink)'}}>{unit.name}</h3>
                {unit.description&&<p className="text-xs line-clamp-2" style={{color:'var(--ink3)'}}>{unit.description}</p>}
                <div className="flex items-center gap-2 mt-3 text-xs" style={{color:'var(--ink3)'}}>
                  <span>{unit.content?.length||0} block{unit.content?.length!==1?'s':''}</span>
                  <span>·</span>
                  <span>{new Date(unit.updatedAt).toLocaleDateString()}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
