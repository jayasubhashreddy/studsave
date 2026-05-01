import React, { useState, useEffect } from 'react';
import {
  ChevronRight, GraduationCap, Calendar, FileText,
  Search, X, Loader2, Menu,
  BookOpen, Lock, Unlock
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import api from '../utils/api';
import { Academic, Semester, Subject, Unit } from '../utils/types';

const unlockedSet = new Set<string>();

export default function Sidebar() {
  const {
    selectedAcademic, selectedSemester, selectedSubject, selectedUnit,
    setSelectedAcademic, setSelectedSemester, setSelectedSubject, setSelectedUnit,
    sidebarOpen, setSidebarOpen, refreshTrigger
  } = useApp();

  const [academics, setAcademics]   = useState<Academic[]>([]);
  const [semesters, setSemesters]   = useState<{[k:string]:Semester[]}>({});
  const [subjects,  setSubjects]    = useState<{[k:string]:Subject[]}>({});
  const [units,     setUnits]       = useState<{[k:string]:Unit[]}>({});

  const [expandedAcademics, setExpandedAcademics] = useState<Set<string>>(new Set());
  const [expandedSemesters, setExpandedSemesters] = useState<Set<string>>(new Set());
  const [expandedSubjects,  setExpandedSubjects]  = useState<Set<string>>(new Set());
  const [unlockedSubjects,  setUnlockedSubjects]  = useState<Set<string>>(new Set(unlockedSet));

  const [search,    setSearch]    = useState('');
  const [searchRes, setSearchRes] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const [lockModal, setLockModal] = useState<{subject:Subject}|null>(null);
  const [pin,       setPin]       = useState('');
  const [pinError,  setPinError]  = useState('');
  const [showPin,   setShowPin]   = useState(false);
  const [lockSaving,setLockSaving]= useState(false);

  useEffect(() => { loadAcademics(); }, [refreshTrigger]);

  const loadAcademics = async () => { try { const r=await api.get('/academics'); setAcademics(r.data); } catch{} };
  const loadSemesters = async (id:string) => { try { const r=await api.get(`/semesters/academic/${id}`); setSemesters(p=>({...p,[id]:r.data})); } catch{} };
  const loadSubjects  = async (id:string) => { try { const r=await api.get(`/subjects/semester/${id}`);  setSubjects(p=>({...p,[id]:r.data}));  } catch{} };
  const loadUnits     = async (id:string) => { try { const r=await api.get(`/units/subject/${id}`);      setUnits(p=>({...p,[id]:r.data}));     } catch{} };

  const toggleAcademic = async (a:Academic) => {
    const n=new Set(expandedAcademics);
    if(n.has(a._id)){n.delete(a._id);}else{n.add(a._id);await loadSemesters(a._id);}
    setExpandedAcademics(n); setSelectedAcademic(a);
    setSelectedSemester(null); setSelectedSubject(null); setSelectedUnit(null);
  };
  const toggleSemester = async (s:Semester) => {
    const n=new Set(expandedSemesters);
    if(n.has(s._id)){n.delete(s._id);}else{n.add(s._id);await loadSubjects(s._id);}
    setExpandedSemesters(n); setSelectedSemester(s);
    setSelectedSubject(null); setSelectedUnit(null);
  };
  const handleSubjectClick = async (s:Subject) => {
    if(s.isLocked && !unlockedSubjects.has(s._id)){setLockModal({subject:s});return;}
    const n=new Set(expandedSubjects);
    if(n.has(s._id)){n.delete(s._id);}else{n.add(s._id);await loadUnits(s._id);}
    setExpandedSubjects(n); setSelectedSubject(s); setSelectedUnit(null);
  };

  const handleLockSubmit = async () => {
    if(pin.length<4){setPinError('PIN must be at least 4 digits');return;}
    setLockSaving(true);setPinError('');
    try{
      const {subject}=lockModal!;
      await api.post(`/subjects/${subject._id}/verify-pin`,{pin});
      unlockedSet.add(subject._id);
      setUnlockedSubjects(new Set(unlockedSet));
      const n=new Set(expandedSubjects);n.add(subject._id);setExpandedSubjects(n);
      await loadUnits(subject._id);
      setSelectedSubject(subject);
      setLockModal(null);
    }catch(err:any){setPinError(err.response?.data?.message||'Incorrect PIN');}
    finally{setLockSaving(false);}
  };

  useEffect(()=>{
    if(!search.trim()){setSearchRes([]);return;}
    const t=setTimeout(async()=>{
      setSearching(true);
      try{const r=await api.get(`/search?q=${encodeURIComponent(search)}`);setSearchRes(r.data.results);}catch{}finally{setSearching(false);}
    },400);
    return()=>clearTimeout(t);
  },[search]);

  const dotCol:Record<string,string>={pending:'#d1d5db','in-progress':'#fbbf24',completed:'#34d399'};

  if(!sidebarOpen) return(
    <button onClick={()=>setSidebarOpen(true)}
      style={{background:'var(--sidebar)'}}
      className="fixed top-4 left-4 z-40 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-all hover:opacity-90">
      <Menu size={18} style={{color:'rgba(255,255,255,0.8)'}}/>
    </button>
  );

  return(
    <>
      <div className="fixed inset-0 bg-black/30 z-20 lg:hidden" onClick={()=>setSidebarOpen(false)}/>
      <aside className="sidebar fixed lg:relative inset-y-0 left-0 z-30 w-72 flex-shrink-0 flex flex-col h-screen"
        style={{borderRight:'1px solid rgba(255,255,255,0.06)'}}>

        {/* Header */}
        <div className="px-4 py-4 flex items-center gap-3" style={{borderBottom:'1px solid rgba(255,255,255,0.07)'}}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:'var(--green)'}}>
            <BookOpen size={15} className="text-white"/>
          </div>
          <div className="flex-1">
            <div className="font-bold text-white text-base leading-tight">StudSave</div>
            <div className="text-xs" style={{color:'rgba(149,213,178,0.6)'}}>Study Smart</div>
          </div>
          <button onClick={()=>setSidebarOpen(false)} className="nav-icon-btn"><X size={15}/></button>
        </div>

        {/* Search */}
        <div className="px-3 py-2.5" style={{borderBottom:'1px solid rgba(255,255,255,0.07)'}}>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{color:'rgba(255,255,255,0.3)'}}/>
            <input value={search} onChange={e=>setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 rounded-xl text-xs placeholder-white/25 focus:outline-none"
              style={{background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.1)',color:'rgba(255,255,255,0.85)'}}
              placeholder="Search…"/>
            {(searchRes.length>0||searching)&&(
              <div className="absolute left-0 right-0 mt-1 top-full rounded-xl shadow-2xl z-50 max-h-56 overflow-y-auto"
                style={{background:'var(--sidebar)',border:'1px solid rgba(255,255,255,0.12)'}}>
                {searching&&<div className="px-3 py-2 text-xs flex items-center gap-2" style={{color:'rgba(255,255,255,0.35)'}}><Loader2 size={11} className="animate-spin"/>Searching…</div>}
                {searchRes.map((r,i)=>(
                  <button key={i} onClick={()=>setSearch('')} className="w-full text-left px-3 py-2 hover:bg-white/5 flex items-center gap-2">
                    <span className="text-base">{r.icon||({academic:'🎓',semester:'📅',subject:'📚',unit:'📄'} as Record<string,string>)[r.type]}</span>
                    <div><div className="text-xs font-medium text-white/80">{r.name}</div><div className="text-xs capitalize" style={{color:'rgba(255,255,255,0.3)'}}>{r.type}</div></div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Navigation Tree — navigation only, no CRUD buttons */}
        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {academics.length===0&&(
            <div className="text-center py-8 text-xs" style={{color:'rgba(255,255,255,0.25)'}}>
              <GraduationCap size={22} className="mx-auto mb-2 opacity-30"/>No folders yet
            </div>
          )}
          {academics.map(academic=>(
            <div key={academic._id}>
              <div className={`nav-row ${selectedAcademic?._id===academic._id&&!selectedSemester?'nav-active':''}`}>
                <button className="nav-btn" onClick={()=>toggleAcademic(academic)}>
                  <ChevronRight size={13} className={`flex-shrink-0 transition-transform ${expandedAcademics.has(academic._id)?'rotate-90':''}`}/>
                  <span className="text-base leading-none">{academic.icon}</span>
                  <span className="truncate">{academic.name}</span>
                </button>
              </div>
              {expandedAcademics.has(academic._id)&&(semesters[academic._id]||[]).map(semester=>(
                <div key={semester._id} className="ml-4 mt-0.5">
                  <div className={`nav-row ${selectedSemester?._id===semester._id&&!selectedSubject?'nav-active':''}`}>
                    <button className="nav-btn" onClick={()=>toggleSemester(semester)}>
                      <ChevronRight size={12} className={`flex-shrink-0 transition-transform ${expandedSemesters.has(semester._id)?'rotate-90':''}`}/>
                      <Calendar size={12} style={{color:'rgba(255,255,255,0.3)',flexShrink:0}}/>
                      <span className="truncate">{semester.name}</span>
                    </button>
                  </div>
                  {expandedSemesters.has(semester._id)&&(subjects[semester._id]||[]).map(subject=>{
                    const isLocked  =subject.isLocked&&!unlockedSubjects.has(subject._id);
                    const isUnlocked=subject.isLocked&&unlockedSubjects.has(subject._id);
                    return(
                      <div key={subject._id} className="ml-4 mt-0.5">
                        <div className={`nav-row ${selectedSubject?._id===subject._id&&!selectedUnit?'nav-active':''}`}>
                          <button className="nav-btn" onClick={()=>handleSubjectClick(subject)}>
                            <ChevronRight size={12} className={`flex-shrink-0 transition-transform ${expandedSubjects.has(subject._id)?'rotate-90':''}`}/>
                            {isLocked?<Lock size={13} style={{color:'#fbbf24',flexShrink:0}}/>
                              :isUnlocked?<Unlock size={13} style={{color:'var(--green-md)',flexShrink:0}}/>
                              :<span className="text-sm flex-shrink-0">{subject.icon}</span>}
                            <span className={`truncate ${isLocked?'opacity-60':''}`}>{subject.name}</span>
                            {isLocked&&<span className="text-xs ml-1 opacity-40">🔒</span>}
                          </button>
                        </div>
                        {!isLocked&&expandedSubjects.has(subject._id)&&(units[subject._id]||[]).map(unit=>(
                          <div key={unit._id} className="ml-5 mt-0.5">
                            <div className={`nav-row ${selectedUnit?._id===unit._id?'nav-active':''}`}>
                              <button className="nav-btn" onClick={()=>{setSelectedSubject(subject);setSelectedUnit(unit);}}>
                                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{background:dotCol[unit.progress]||'#d1d5db'}}/>
                                <FileText size={11} style={{color:'rgba(255,255,255,0.25)',flexShrink:0}}/>
                                <span className="truncate text-xs">{unit.name}</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 flex items-center gap-2" style={{borderTop:'1px solid rgba(255,255,255,0.07)'}}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{background:'var(--green)'}}>
            <BookOpen size={13} className="text-white"/>
          </div>
          <div className="flex-1">
            <div className="text-xs font-semibold text-white">StudSave</div>
            <div className="text-xs" style={{color:'rgba(255,255,255,0.3)'}}>Your study workspace</div>
          </div>
        </div>
      </aside>

      {/* PIN unlock modal */}
      {lockModal&&(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:'rgba(0,0,0,0.5)'}}>
          <div className="rounded-2xl p-6 w-full max-w-sm shadow-2xl" style={{background:'var(--paper)',border:'1.5px solid var(--border)'}}>
            <h2 className="font-bold text-base mb-1" style={{color:'var(--ink)'}}>🔑 Unlock "{lockModal.subject.name}"</h2>
            <p className="text-sm mb-4" style={{color:'var(--ink3)'}}>This folder is locked. Enter the PIN to access it.</p>
            <input
              type={showPin?'text':'password'}
              inputMode="numeric"
              value={pin}
              onChange={e=>{setPin(e.target.value.replace(/\D/g,''));setPinError('');}}
              onKeyDown={e=>{if(e.key==='Enter')handleLockSubmit();}}
              className="input text-lg tracking-widest font-mono w-full mb-1"
              placeholder="••••" maxLength={8} autoFocus/>
            {pinError&&<p className="text-xs mb-3 font-medium" style={{color:'var(--red)'}}>{pinError}</p>}
            <div className="flex gap-2 justify-end mt-4">
              <button onClick={()=>setLockModal(null)} className="btn-ghost">Cancel</button>
              <button onClick={handleLockSubmit} disabled={lockSaving||pin.length<4} className="btn-primary">
                {lockSaving?<Loader2 size={13} className="animate-spin"/>:null} Unlock
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
