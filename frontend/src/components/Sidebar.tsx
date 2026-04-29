import React, { useState, useEffect } from 'react';
import {
  ChevronRight, Plus, GraduationCap, Calendar, FileText,
  Search, LogOut, X, Pencil, Trash2, Loader2, Menu,
  FolderPlus, FilePlus, BookOpen
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import api from '../utils/api';
import { Academic, Semester, Subject, Unit } from '../utils/types';
import Modal from './Modal';

interface FormData { name: string; description: string; icon?: string; color?: string; }

export default function Sidebar() {
  const { user, logout } = useAuth();
  const {
    selectedAcademic, selectedSemester, selectedSubject, selectedUnit,
    setSelectedAcademic, setSelectedSemester, setSelectedSubject, setSelectedUnit,
    sidebarOpen, setSidebarOpen, refreshTrigger, triggerRefresh
  } = useApp();

  const [academics, setAcademics]   = useState<Academic[]>([]);
  const [semesters, setSemesters]   = useState<{[k:string]:Semester[]}>({});
  const [subjects,  setSubjects]    = useState<{[k:string]:Subject[]}>({});
  const [units,     setUnits]       = useState<{[k:string]:Unit[]}>({});

  const [expandedAcademics, setExpandedAcademics] = useState<Set<string>>(new Set());
  const [expandedSemesters, setExpandedSemesters] = useState<Set<string>>(new Set());
  const [expandedSubjects,  setExpandedSubjects]  = useState<Set<string>>(new Set());

  // Track which subject's + menu is open
  const [addMenu, setAddMenu] = useState<string|null>(null);

  const [modal,    setModal]    = useState<{type:string;parentId?:string;item?:any}|null>(null);
  const [formData, setFormData] = useState<FormData>({name:'',description:'',icon:'🎓',color:'#2d6a4f'});
  const [saving,   setSaving]   = useState(false);
  const [search,   setSearch]   = useState('');
  const [searchRes, setSearchRes] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => { loadAcademics(); }, [refreshTrigger]);

  const loadAcademics   = async () => { try { const r=await api.get('/academics');                       setAcademics(r.data); } catch{} };
  const loadSemesters   = async (id:string) => { if(semesters[id]) return; try { const r=await api.get(`/semesters/academic/${id}`); setSemesters(p=>({...p,[id]:r.data})); } catch{} };
  const loadSubjects    = async (id:string) => { if(subjects[id])  return; try { const r=await api.get(`/subjects/semester/${id}`);  setSubjects(p=>({...p,[id]:r.data}));  } catch{} };
  const loadUnits       = async (id:string) => { if(units[id])     return; try { const r=await api.get(`/units/subject/${id}`);      setUnits(p=>({...p,[id]:r.data}));     } catch{} };
  const reloadSemesters = async (id:string) => { try { const r=await api.get(`/semesters/academic/${id}`); setSemesters(p=>({...p,[id]:r.data})); } catch{} };
  const reloadSubjects  = async (id:string) => { try { const r=await api.get(`/subjects/semester/${id}`);  setSubjects(p=>({...p,[id]:r.data}));  } catch{} };
  const reloadUnits     = async (id:string) => { try { const r=await api.get(`/units/subject/${id}`);      setUnits(p=>({...p,[id]:r.data}));     } catch{} };

  const toggleAcademic = async (a:Academic) => {
    const n=new Set(expandedAcademics);
    n.has(a._id) ? n.delete(a._id) : (n.add(a._id), await loadSemesters(a._id));
    setExpandedAcademics(n); setSelectedAcademic(a);
  };
  const toggleSemester = async (s:Semester) => {
    const n=new Set(expandedSemesters);
    n.has(s._id) ? n.delete(s._id) : (n.add(s._id), await loadSubjects(s._id));
    setExpandedSemesters(n); setSelectedSemester(s);
  };
  const toggleSubject = async (s:Subject) => {
    const n=new Set(expandedSubjects);
    n.has(s._id) ? n.delete(s._id) : (n.add(s._id), await loadUnits(s._id));
    setExpandedSubjects(n); setSelectedSubject(s); setAddMenu(null);
  };

  const openModal = (type:string, parentId?:string, item?:any) => {
    setModal({type,parentId,item});
    setFormData({name:item?.name||'',description:item?.description||'',icon:item?.icon||'🎓',color:item?.color||'#2d6a4f'});
    setAddMenu(null);
  };

  const handleSave = async () => {
    if(!formData.name.trim()) return;
    setSaving(true);
    try {
      const m=modal!;
      if(m.type==='academic') {
        m.item ? await api.put(`/academics/${m.item._id}`,formData) : await api.post('/academics',formData);
        await loadAcademics();
      } else if(m.type==='semester') {
        m.item ? await api.put(`/semesters/${m.item._id}`,formData) : await api.post('/semesters',{...formData,academicId:m.parentId});
        await reloadSemesters(m.item?.academicId||m.parentId!);
      } else if(m.type==='subject') {
        if(m.item){ await api.put(`/subjects/${m.item._id}`,formData); }
        else { const sem=Object.values(semesters).flat().find(s=>s._id===m.parentId); await api.post('/subjects',{...formData,semesterId:m.parentId,academicId:sem?.academicId}); }
        await reloadSubjects(m.item?.semesterId||m.parentId!);
      } else if(m.type==='unit') {
        if(m.item){ await api.put(`/units/${m.item._id}`,formData); }
        else { const sub=Object.values(subjects).flat().find(s=>s._id===m.parentId); const sem=Object.values(semesters).flat().find(s=>s._id===sub?.semesterId); await api.post('/units',{...formData,subjectId:m.parentId,semesterId:sub?.semesterId,academicId:sem?.academicId}); }
        await reloadUnits(m.item?.subjectId||m.parentId!);
      }
      setModal(null); triggerRefresh();
    } catch(err:any){ alert(err.response?.data?.message||'Error saving'); }
    finally{ setSaving(false); }
  };

  const handleDelete = async (type:string,id:string,parentId?:string) => {
    if(!confirm('Delete this and all nested content?')) return;
    try {
      if(type==='academic'){   await api.delete(`/academics/${id}`); await loadAcademics(); setSelectedAcademic(null); }
      else if(type==='semester'){ await api.delete(`/semesters/${id}`); if(parentId) await reloadSemesters(parentId); setSelectedSemester(null); }
      else if(type==='subject'){  await api.delete(`/subjects/${id}`);  if(parentId) await reloadSubjects(parentId);  setSelectedSubject(null); }
      else if(type==='unit'){     await api.delete(`/units/${id}`);     if(parentId) await reloadUnits(parentId);     setSelectedUnit(null); }
      triggerRefresh();
    } catch{ alert('Error deleting'); }
  };

  useEffect(() => {
    if(!search.trim()){ setSearchRes([]); return; }
    const t=setTimeout(async()=>{
      setSearching(true);
      try{ const r=await api.get(`/search?q=${encodeURIComponent(search)}`); setSearchRes(r.data.results); }catch{}finally{setSearching(false);}
    },400);
    return ()=>clearTimeout(t);
  },[search]);

  // Close add-menu on outside click
  useEffect(()=>{
    const h=(e:MouseEvent)=>{ if(!(e.target as Element)?.closest('.addmenu-wrap')) setAddMenu(null); };
    document.addEventListener('click',h); return ()=>document.removeEventListener('click',h);
  },[]);

  const ICONS  = ['🎓','📚','🔬','💻','📐','🧬','⚗️','🎨','📊','🏛️'];
  const COLORS = ['#2d6a4f','#1d4ed8','#7c3aed','#b45309','#dc2626','#0891b2','#db2777','#059669'];
  const dotCol:Record<string,string> = { pending:'#d1d5db','in-progress':'#fbbf24',completed:'#34d399' };

  if(!sidebarOpen) return (
    <button onClick={()=>setSidebarOpen(true)}
      style={{background:'var(--sidebar)'}}
      className="fixed top-4 left-4 z-40 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-all hover:opacity-90">
      <Menu size={18} style={{color:'rgba(255,255,255,0.8)'}}/>
    </button>
  );

  return (
    <>
      {/* Mobile overlay */}
      <div className="fixed inset-0 bg-black/30 z-20 lg:hidden" onClick={()=>setSidebarOpen(false)}/>

      <aside className="sidebar fixed lg:relative inset-y-0 left-0 z-30 w-72 flex-shrink-0 flex flex-col h-screen"
        style={{borderRight:'1px solid rgba(255,255,255,0.06)'}}>

        {/* ── Logo ── */}
        <div className="px-4 py-4 flex items-center gap-3" style={{borderBottom:'1px solid rgba(255,255,255,0.07)'}}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{background:'var(--green)'}}>
            <BookOpen size={15} className="text-white"/>
          </div>
          <div className="flex-1">
            <div className="font-bold text-white text-base leading-tight">StudSave</div>
            <div className="text-xs" style={{color:'rgba(149,213,178,0.6)'}}>Study Smart</div>
          </div>
          <button onClick={()=>setSidebarOpen(false)} className="nav-icon-btn">
            <X size={15}/>
          </button>
        </div>

        {/* ── Search ── */}
        <div className="px-3 py-2.5" style={{borderBottom:'1px solid rgba(255,255,255,0.07)'}}>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{color:'rgba(255,255,255,0.3)'}}/>
            <input value={search} onChange={e=>setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 rounded-xl text-xs placeholder-white/25 focus:outline-none transition-all"
              style={{background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.1)',color:'rgba(255,255,255,0.85)'}}
              placeholder="Search…"/>
            {(searchRes.length>0||searching)&&(
              <div className="absolute left-0 right-0 mt-1 top-full rounded-xl shadow-2xl z-50 max-h-56 overflow-y-auto"
                style={{background:'var(--sidebar)',border:'1px solid rgba(255,255,255,0.12)'}}>
                {searching&&<div className="px-3 py-2 text-xs flex items-center gap-2" style={{color:'rgba(255,255,255,0.35)'}}><Loader2 size={11} className="animate-spin"/>Searching…</div>}
                {searchRes.map((r,i)=>(
                  <button key={i} onClick={()=>setSearch('')} className="w-full text-left px-3 py-2 hover:bg-white/5 flex items-center gap-2 transition-colors">
                    <span className="text-base">{r.icon||({academic:'🎓',semester:'📅',subject:'📚',unit:'📄'} as Record<string,string>)[r.type]}</span>
                    <div>
                      <div className="text-xs font-medium text-white/80">{r.name}</div>
                      <div className="text-xs capitalize" style={{color:'rgba(255,255,255,0.3)'}}>{r.type}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Tree ── */}
        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">

          {/* New Academic button — always shown at top */}
          <button onClick={()=>openModal('academic')}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all mb-2 hover:opacity-90"
            style={{background:'rgba(45,106,79,0.25)',color:'var(--green-md)',border:'1px solid rgba(45,106,79,0.35)'}}>
            <Plus size={14}/> New Academic Year
          </button>

          {academics.length===0&&(
            <div className="text-center py-8 text-xs" style={{color:'rgba(255,255,255,0.25)'}}>
              <GraduationCap size={22} className="mx-auto mb-2 opacity-30"/>
              No academics yet
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
                <div className="nav-actions">
                  <button className="nav-icon-btn" onClick={()=>openModal('academic',undefined,academic)}><Pencil size={11}/></button>
                  <button className="nav-icon-btn danger" onClick={()=>handleDelete('academic',academic._id)}><Trash2 size={11}/></button>
                  <button className="nav-icon-btn add" onClick={()=>openModal('semester',academic._id)}><Plus size={11}/></button>
                </div>
              </div>

              {expandedAcademics.has(academic._id)&&(semesters[academic._id]||[]).map(semester=>(
                <div key={semester._id} className="ml-4 mt-0.5">
                  <div className={`nav-row ${selectedSemester?._id===semester._id&&!selectedSubject?'nav-active':''}`}>
                    <button className="nav-btn" onClick={()=>toggleSemester(semester)}>
                      <ChevronRight size={12} className={`flex-shrink-0 transition-transform ${expandedSemesters.has(semester._id)?'rotate-90':''}`}/>
                      <Calendar size={12} style={{color:'rgba(255,255,255,0.3)',flexShrink:0}}/>
                      <span className="truncate">{semester.name}</span>
                    </button>
                    <div className="nav-actions">
                      <button className="nav-icon-btn" onClick={()=>openModal('semester',academic._id,semester)}><Pencil size={11}/></button>
                      <button className="nav-icon-btn danger" onClick={()=>handleDelete('semester',semester._id,academic._id)}><Trash2 size={11}/></button>
                      <button className="nav-icon-btn add" onClick={()=>openModal('subject',semester._id)}><Plus size={11}/></button>
                    </div>
                  </div>

                  {expandedSemesters.has(semester._id)&&(subjects[semester._id]||[]).map(subject=>(
                    <div key={subject._id} className="ml-4 mt-0.5">
                      <div className={`nav-row ${selectedSubject?._id===subject._id&&!selectedUnit?'nav-active':''}`}>
                        <button className="nav-btn" onClick={()=>toggleSubject(subject)}>
                          <ChevronRight size={12} className={`flex-shrink-0 transition-transform ${expandedSubjects.has(subject._id)?'rotate-90':''}`}/>
                          <span className="text-sm">{subject.icon}</span>
                          <span className="truncate">{subject.name}</span>
                        </button>
                        <div className="nav-actions">
                          <button className="nav-icon-btn" onClick={()=>openModal('subject',semester._id,subject)}><Pencil size={11}/></button>
                          <button className="nav-icon-btn danger" onClick={()=>handleDelete('subject',subject._id,semester._id)}><Trash2 size={11}/></button>

                          {/* ── KEY CHANGE: subject + menu shows both Folder and File ── */}
                          <div className="relative addmenu-wrap">
                            <button className="nav-icon-btn add"
                              onClick={e=>{e.stopPropagation();setAddMenu(addMenu===subject._id?null:subject._id);}}>
                              <Plus size={11}/>
                            </button>
                            {addMenu===subject._id&&(
                              <div className="absolute right-0 top-full mt-1.5 w-44 rounded-2xl shadow-2xl z-50 overflow-hidden animate-slide-up"
                                style={{background:'var(--sidebar)',border:'1px solid rgba(255,255,255,0.12)'}}>
                                <div className="px-3 py-2 text-xs font-semibold" style={{color:'rgba(255,255,255,0.3)',borderBottom:'1px solid rgba(255,255,255,0.07)'}}>
                                  Add to {subject.name}
                                </div>
                                {/* New Folder option */}
                                <button onClick={()=>openModal('subject',semester._id)}
                                  className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium hover:bg-white/5 transition-colors text-left"
                                  style={{color:'rgba(255,255,255,0.7)'}}>
                                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                                    style={{background:'rgba(180,83,9,0.2)'}}>
                                    <FolderPlus size={13} style={{color:'#fbbf24'}}/>
                                  </div>
                                  <div>
                                    <div className="font-semibold">New Folder</div>
                                    <div style={{color:'rgba(255,255,255,0.3)'}}>Sub-subject</div>
                                  </div>
                                </button>
                                {/* New File option */}
                                <button onClick={()=>openModal('unit',subject._id)}
                                  className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium hover:bg-white/5 transition-colors text-left"
                                  style={{color:'rgba(255,255,255,0.7)'}}>
                                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                                    style={{background:'rgba(45,106,79,0.2)'}}>
                                    <FilePlus size={13} style={{color:'var(--green-md)'}}/>
                                  </div>
                                  <div>
                                    <div className="font-semibold">New File</div>
                                    <div style={{color:'rgba(255,255,255,0.3)'}}>Notes &amp; code</div>
                                  </div>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {expandedSubjects.has(subject._id)&&(units[subject._id]||[]).map(unit=>(
                        <div key={unit._id} className="ml-5 mt-0.5">
                          <div className={`nav-row ${selectedUnit?._id===unit._id?'nav-active':''}`}>
                            <button className="nav-btn" onClick={()=>setSelectedUnit(unit)}>
                              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{background:dotCol[unit.progress]||'#d1d5db'}}/>
                              <FileText size={11} style={{color:'rgba(255,255,255,0.25)',flexShrink:0}}/>
                              <span className="truncate text-xs">{unit.name}</span>
                            </button>
                            <div className="nav-actions">
                              <button className="nav-icon-btn" onClick={()=>openModal('unit',subject._id,unit)}><Pencil size={11}/></button>
                              <button className="nav-icon-btn danger" onClick={()=>handleDelete('unit',unit._id,subject._id)}><Trash2 size={11}/></button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* ── Footer ── */}
        <div className="px-3 py-3" style={{borderTop:'1px solid rgba(255,255,255,0.07)'}}>
          <div className="flex items-center gap-2 p-2 rounded-xl" style={{background:'rgba(255,255,255,0.05)'}}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
              style={{background:'var(--green)'}}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold truncate text-white">{user?.name}</div>
              <div className="text-xs truncate" style={{color:'rgba(255,255,255,0.35)'}}>{user?.email}</div>
            </div>
            <button onClick={logout} className="nav-icon-btn danger"><LogOut size={14}/></button>
          </div>
        </div>
      </aside>

      {/* ── Modal ── */}
      {modal&&(
        <Modal title={`${modal.item?'Edit':'New'} ${modal.type.charAt(0).toUpperCase()+modal.type.slice(1)}`} onClose={()=>setModal(null)}>
          <div className="space-y-4">
            {(modal.type==='academic'||modal.type==='subject')&&(
              <div>
                <label className="block text-xs font-bold mb-2 uppercase tracking-wider" style={{color:'var(--ink3)'}}>Icon</label>
                <div className="flex flex-wrap gap-2">
                  {ICONS.map(icon=>(
                    <button key={icon} onClick={()=>setFormData(p=>({...p,icon}))}
                      className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all hover:scale-105 ${formData.icon===icon?'scale-110':''}`}
                      style={{background:formData.icon===icon?'var(--green-lt)':' var(--paper2)',boxShadow:formData.icon===icon?'0 0 0 2px var(--green)':'none'}}>
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div>
              <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{color:'var(--ink3)'}}>Name *</label>
              <input value={formData.name} onChange={e=>setFormData(p=>({...p,name:e.target.value}))}
                className="input" placeholder={`${modal.type} name…`} autoFocus
                onKeyDown={e=>{if(e.key==='Enter')handleSave();}}/>
            </div>
            <div>
              <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{color:'var(--ink3)'}}>Description</label>
              <textarea value={formData.description} onChange={e=>setFormData(p=>({...p,description:e.target.value}))}
                className="input h-20 resize-none" placeholder="Optional…"/>
            </div>
            {(modal.type==='academic'||modal.type==='subject')&&(
              <div>
                <label className="block text-xs font-bold mb-2 uppercase tracking-wider" style={{color:'var(--ink3)'}}>Color</label>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map(c=>(
                    <button key={c} onClick={()=>setFormData(p=>({...p,color:c}))}
                      className={`w-7 h-7 rounded-full transition-all ${formData.color===c?'scale-125':' hover:scale-110'}`}
                      style={{background:c,boxShadow:formData.color===c?`0 0 0 2px #fff, 0 0 0 4px ${c}`:'none'}}/>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-2 justify-end pt-1">
              <button onClick={()=>setModal(null)} className="btn-ghost">Cancel</button>
              <button onClick={handleSave} disabled={saving||!formData.name.trim()} className="btn-primary">
                {saving?<Loader2 size={13} className="animate-spin"/>:null}
                {saving?'Saving…':modal.item?'Save Changes':'Create'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
