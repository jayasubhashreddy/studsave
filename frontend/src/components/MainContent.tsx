import React, { useEffect, useState } from 'react';
import {
  BookOpen, BookMarked, FileText, Loader2, ChevronRight, BookOpenCheck,
  Plus, Pencil, Trash2, FolderPlus, FilePlus, GraduationCap, Lock, Unlock, LockKeyhole, Eye, EyeOff
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Academic, Semester, Subject, Unit } from '../utils/types';
import api from '../utils/api';
import UnitEditor from './UnitEditor';
import Modal from './Modal';

interface FormData { name: string; description: string; icon?: string; color?: string; }

const unlockedSet = new Set<string>();
const ICONS  = ['🎓','📚','🔬','💻','📐','🧬','⚗️','🎨','📊','🏛️'];
const COLORS = ['#2d6a4f','#1d4ed8','#7c3aed','#b45309','#dc2626','#0891b2','#db2777','#059669'];

export default function MainContent() {
  const {
    selectedAcademic, selectedSemester, selectedSubject, selectedUnit,
    setSelectedAcademic, setSelectedSemester, setSelectedSubject, setSelectedUnit,
    sidebarOpen, refreshTrigger, triggerRefresh
  } = useApp();

  const [units,       setUnits]       = useState<Unit[]>([]);
  const [loadingUnit, setLoadingUnit] = useState(false);
  const [fullUnit,    setFullUnit]    = useState<Unit | null>(null);

  // Cached lists for rendering context
  const [academics,  setAcademics]  = useState<Academic[]>([]);
  const [semesters,  setSemesters]  = useState<Semester[]>([]);
  const [subjects,   setSubjectsL]  = useState<Subject[]>([]);

  // Modal state
  const [modal,    setModal]    = useState<{type:string;parentId?:string;item?:any}|null>(null);
  const [formData, setFormData] = useState<FormData>({name:'',description:'',icon:'🎓',color:'#2d6a4f'});
  const [saving,   setSaving]   = useState(false);

  // Lock modal
  const [lockModal,  setLockModal]  = useState<{subject:Subject;mode:'set'|'remove'}|null>(null);
  const [pin,        setPin]        = useState('');
  const [pinError,   setPinError]   = useState('');
  const [showPin,    setShowPin]    = useState(false);
  const [lockSaving, setLockSaving] = useState(false);
  const [unlockedSubjects, setUnlockedSubjects] = useState<Set<string>>(new Set(unlockedSet));

  // Load academics for the home screen
  useEffect(() => {
    api.get('/academics').then(r => setAcademics(r.data)).catch(() => {});
  }, [refreshTrigger]);

  // Load semesters when academic is selected
  useEffect(() => {
    if (!selectedAcademic) return;
    api.get(`/semesters/academic/${selectedAcademic._id}`).then(r => setSemesters(r.data)).catch(() => {});
  }, [selectedAcademic, refreshTrigger]);

  // Load subjects when semester is selected
  useEffect(() => {
    if (!selectedSemester) return;
    api.get(`/subjects/semester/${selectedSemester._id}`).then(r => setSubjectsL(r.data)).catch(() => {});
  }, [selectedSemester, refreshTrigger]);

  // Load units when subject is selected
  useEffect(() => {
    if (!selectedSubject) { setUnits([]); return; }
    api.get(`/units/subject/${selectedSubject._id}`).then(r => setUnits(r.data)).catch(() => {});
  }, [selectedSubject, refreshTrigger]);

  // Load full unit
  useEffect(() => {
    if (!selectedUnit) { setFullUnit(null); return; }
    setFullUnit(null); setLoadingUnit(true);
    api.get(`/units/${selectedUnit._id}`).then(r => setFullUnit(r.data)).catch(() => {}).finally(() => setLoadingUnit(false));
  }, [selectedUnit?._id]);

  const BADGE:Record<string,string> = { pending:'badge-progress-pending','in-progress':'badge-progress-in-progress',completed:'badge-progress-completed' };
  const LABEL:Record<string,string> = { pending:'Pending','in-progress':'In Progress',completed:'Completed' };

  // ── Modal helpers ───────────────────────────────────────────────
  const openModal = (type:string, parentId?:string, item?:any) => {
    setModal({type,parentId,item});
    setFormData({name:item?.name||'',description:item?.description||'',icon:item?.icon||'🎓',color:item?.color||'#2d6a4f'});
  };

  const handleSave = async () => {
    if(!formData.name.trim()) return;
    setSaving(true);
    try {
      const m = modal!;
      if(m.type==='academic') {
        m.item ? await api.put(`/academics/${m.item._id}`,formData) : await api.post('/academics',formData);
      } else if(m.type==='semester') {
        m.item ? await api.put(`/semesters/${m.item._id}`,formData)
               : await api.post('/semesters',{...formData,academicId:m.parentId});
      } else if(m.type==='subject') {
        if(m.item){ await api.put(`/subjects/${m.item._id}`,formData); }
        else {
          const sem = semesters.find(s=>s._id===m.parentId)||
            (selectedSemester?._id===m.parentId?selectedSemester:null);
          await api.post('/subjects',{...formData,semesterId:m.parentId,academicId:sem?.academicId||selectedAcademic?._id});
        }
      } else if(m.type==='unit') {
        if(m.item){ await api.put(`/units/${m.item._id}`,formData); }
        else {
          // unit can be created under a subject, or directly under academic/semester
          const subjectId = m.parentId;
          const sub = subjects.find(s=>s._id===subjectId)||
            (selectedSubject?._id===subjectId?selectedSubject:null);
          await api.post('/units',{
            ...formData,
            subjectId,
            semesterId: sub?.semesterId||selectedSemester?._id,
            academicId: sub?.academicId||selectedAcademic?._id
          });
        }
      }
      setModal(null);
      triggerRefresh();
    } catch(err:any){ alert(err.response?.data?.message||'Error saving'); }
    finally{ setSaving(false); }
  };

  const handleDelete = async (type:string, id:string) => {
    if(!confirm('Delete this and all nested content?')) return;
    try {
      if(type==='academic'){   await api.delete(`/academics/${id}`);  setSelectedAcademic(null); }
      else if(type==='semester'){ await api.delete(`/semesters/${id}`); setSelectedSemester(null); }
      else if(type==='subject'){  await api.delete(`/subjects/${id}`);  setSelectedSubject(null); }
      else if(type==='unit'){     await api.delete(`/units/${id}`);     setSelectedUnit(null); }
      triggerRefresh();
    } catch{ alert('Error deleting'); }
  };

  // Lock helpers
  const openLockModal = (subject:Subject, mode:'set'|'remove') => {
    setPin(''); setPinError(''); setShowPin(false);
    setLockModal({subject, mode});
  };
  const handleLockSubmit = async () => {
    if(pin.length<4){setPinError('PIN must be at least 4 digits');return;}
    setLockSaving(true);setPinError('');
    try {
      const {subject,mode}=lockModal!;
      if(mode==='set'){
        await api.post(`/subjects/${subject._id}/lock`,{pin});
        setSubjectsL(prev=>prev.map(s=>s._id===subject._id?{...s,isLocked:true}:s));
      } else {
        await api.post(`/subjects/${subject._id}/remove-lock`,{pin});
        unlockedSet.delete(subject._id);
        setUnlockedSubjects(new Set(unlockedSet));
        setSubjectsL(prev=>prev.map(s=>s._id===subject._id?{...s,isLocked:false}:s));
      }
      setLockModal(null);
    } catch(err:any){setPinError(err.response?.data?.message||'Incorrect PIN');}
    finally{setLockSaving(false);}
  };

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

  // ── Action button row ───────────────────────────────────────────
  const ActionRow = ({ children }: { children: React.ReactNode }) => (
    <div className="flex flex-wrap items-center gap-2 mb-5">{children}</div>
  );

  const BtnCreate = ({ label, icon: Icon, onClick }: { label:string; icon:any; onClick:()=>void }) => (
    <button onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold hover:opacity-90 transition-all"
      style={{background:'rgba(45,106,79,0.12)',color:'var(--green)',border:'1px solid rgba(45,106,79,0.25)'}}>
      <Icon size={13}/>{label}
    </button>
  );
  const BtnEdit = ({ onClick }: { onClick:()=>void }) => (
    <button onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold hover:opacity-90 transition-all"
      style={{background:'rgba(100,100,255,0.08)',color:'#6366f1',border:'1px solid rgba(100,100,255,0.2)'}}>
      <Pencil size={13}/>Edit
    </button>
  );
  const BtnDelete = ({ onClick }: { onClick:()=>void }) => (
    <button onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold hover:opacity-90 transition-all"
      style={{background:'rgba(220,38,38,0.08)',color:'var(--red)',border:'1px solid rgba(220,38,38,0.18)'}}>
      <Trash2 size={13}/>Delete
    </button>
  );

  // ── Loading unit ───────────────────────────────────────────────
  if (loadingUnit) return (
    <div className="flex-1 flex items-center justify-center" style={{background:'var(--paper)'}}>
      <Loader2 size={22} className="animate-spin" style={{color:'var(--green)'}}/>
    </div>
  );

  // ── Unit editor ────────────────────────────────────────────────
  if (selectedUnit && fullUnit && !loadingUnit) return (
    <div className="flex-1 flex flex-col min-h-0" style={{background:'var(--paper)'}}>
      <Breadcrumb extra={fullUnit.name}/>
      <div className="px-4 sm:px-6 pt-4 flex-shrink-0">
        <ActionRow>
          <BtnEdit onClick={()=>openModal('unit',selectedSubject?._id,fullUnit)}/>
          <BtnDelete onClick={()=>handleDelete('unit',fullUnit._id)}/>
        </ActionRow>
      </div>
      <UnitEditor unit={fullUnit} onUpdate={u=>setFullUnit(u)}/>
      {renderModals()}
    </div>
  );

  // ── Subject view (list of files) ───────────────────────────────
  if (selectedSubject) {
    const done = units.filter(u=>u.progress==='completed').length;
    const pct  = units.length ? Math.round((done/units.length)*100) : 0;
    const isLocked   = selectedSubject.isLocked && !unlockedSubjects.has(selectedSubject._id);
    const isUnlocked = selectedSubject.isLocked && unlockedSubjects.has(selectedSubject._id);

    return (
      <div className="flex-1 overflow-y-auto" style={{background:'var(--paper)'}}>
        <Breadcrumb/>
        <div className="px-4 sm:px-6 py-5 animate-fade-in">
          {/* Subject header */}
          <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
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

          {/* Action buttons */}
          <ActionRow>
            <BtnCreate label="New File" icon={FilePlus} onClick={()=>openModal('unit',selectedSubject._id)}/>
            <BtnEdit onClick={()=>openModal('subject',selectedSemester?._id,selectedSubject)}/>
            <BtnDelete onClick={()=>handleDelete('subject',selectedSubject._id)}/>
            {/* Lock toggle */}
            {selectedSubject.isLocked
              ? <button onClick={()=>openLockModal(selectedSubject,'remove')}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold hover:opacity-90 transition-all"
                  style={{background:'rgba(251,191,36,0.1)',color:'#b45309',border:'1px solid rgba(251,191,36,0.3)'}}>
                  <LockKeyhole size={13}/>{isUnlocked?'Remove Lock':'Locked'}
                </button>
              : <button onClick={()=>openLockModal(selectedSubject,'set')}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold hover:opacity-90 transition-all"
                  style={{background:'rgba(100,100,100,0.07)',color:'var(--ink3)',border:'1px solid var(--border)'}}>
                  <Lock size={13}/>Lock Folder
                </button>
            }
          </ActionRow>

          {/* Progress bar */}
          {units.length>0&&(
            <div className="mb-6">
              <div className="flex justify-between text-xs mb-1.5" style={{color:'var(--ink3)'}}>
                <span>Progress</span><span style={{color:'var(--green)',fontWeight:600}}>{pct}%</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{background:'var(--paper3)'}}>
                <div className="h-full rounded-full transition-all duration-700"
                  style={{width:`${pct}%`,background:'linear-gradient(90deg, var(--green), var(--green-md))'}}/></div>
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
              <p className="text-sm mb-4" style={{color:'var(--ink3)'}}>Create your first file using the button above</p>
              <button onClick={()=>openModal('unit',selectedSubject._id)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90"
                style={{background:'var(--green)',color:'#fff'}}>
                <FilePlus size={15}/>New File
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {units.map(unit=>(
                <div key={unit._id} className="rounded-2xl p-4 transition-all group hover:-translate-y-0.5 animate-slide-up"
                  style={{background:'#fff',border:'1.5px solid var(--border)',boxShadow:'0 1px 4px rgba(0,0,0,0.04)'}}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{background:'var(--green-lt)'}}>
                      <FileText size={16} style={{color:'var(--green)'}}/>
                    </div>
                    <span className={BADGE[unit.progress]}>{LABEL[unit.progress]}</span>
                  </div>
                  <button className="text-left w-full mb-2" onClick={()=>setSelectedUnit(unit)}>
                    <h3 className="font-semibold text-sm mb-1 hover:text-green-700 transition-colors" style={{color:'var(--ink)'}}>{unit.name}</h3>
                    {unit.description&&<p className="text-xs line-clamp-2" style={{color:'var(--ink3)'}}>{unit.description}</p>}
                    <div className="flex items-center gap-2 mt-2 text-xs" style={{color:'var(--ink3)'}}>
                      <span>{unit.content?.length||0} block{unit.content?.length!==1?'s':''}</span>
                      <span>·</span>
                      <span>{new Date(unit.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </button>
                  {/* Per-file edit/delete */}
                  <div className="flex items-center gap-1.5 mt-2 pt-2" style={{borderTop:'1px solid var(--border)'}}>
                    <button onClick={()=>openModal('unit',selectedSubject._id,unit)}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs hover:bg-indigo-50 transition-colors"
                      style={{color:'#6366f1'}}><Pencil size={11}/>Edit</button>
                    <button onClick={()=>handleDelete('unit',unit._id)}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs hover:bg-red-50 transition-colors"
                      style={{color:'var(--red)'}}><Trash2 size={11}/>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {renderModals()}
      </div>
    );
  }

  // ── Semester view (list of subjects/folders) ────────────────────
  if (selectedSemester) {
    return (
      <div className="flex-1 overflow-y-auto" style={{background:'var(--paper)'}}>
        <Breadcrumb/>
        <div className="px-4 sm:px-6 py-5 animate-fade-in">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold" style={{color:'var(--ink)'}}>{selectedSemester.name}</h1>
              {selectedSemester.description&&<p className="text-sm mt-1" style={{color:'var(--ink3)'}}>{selectedSemester.description}</p>}
            </div>
          </div>
          <ActionRow>
            <BtnCreate label="New Folder" icon={FolderPlus} onClick={()=>openModal('subject',selectedSemester._id)}/>
            <BtnEdit onClick={()=>openModal('semester',selectedAcademic?._id,selectedSemester)}/>
            <BtnDelete onClick={()=>handleDelete('semester',selectedSemester._id)}/>
          </ActionRow>

          {subjects.length===0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
                style={{background:'var(--paper2)',border:'1.5px solid var(--border)'}}>
                <FolderPlus size={24} style={{color:'var(--ink3)'}}/>
              </div>
              <h3 className="font-semibold mb-1" style={{color:'var(--ink2)'}}>No folders yet</h3>
              <p className="text-sm mb-4" style={{color:'var(--ink3)'}}>Create a folder to organize your files</p>
              <button onClick={()=>openModal('subject',selectedSemester._id)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90"
                style={{background:'var(--green)',color:'#fff'}}>
                <FolderPlus size={15}/>New Folder
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {subjects.map(subject=>(
                <div key={subject._id} className="rounded-2xl p-4 transition-all hover:-translate-y-0.5 animate-slide-up"
                  style={{background:'#fff',border:'1.5px solid var(--border)',boxShadow:'0 1px 4px rgba(0,0,0,0.04)'}}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                      style={{background:'var(--green-lt)'}}>{subject.icon}</div>
                    <div className="flex-1 min-w-0">
                      <button className="font-semibold text-sm text-left hover:text-green-700 transition-colors w-full truncate"
                        style={{color:'var(--ink)'}} onClick={()=>setSelectedSubject(subject)}>
                        {subject.name}
                      </button>
                    </div>
                    {subject.isLocked&&<Lock size={13} style={{color:'#fbbf24',flexShrink:0}}/>}
                  </div>
                  {subject.description&&<p className="text-xs mb-3 line-clamp-2" style={{color:'var(--ink3)'}}>{subject.description}</p>}
                  <div className="flex items-center gap-1.5 pt-2" style={{borderTop:'1px solid var(--border)'}}>
                    <button onClick={()=>setSelectedSubject(subject)}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs hover:bg-green-50 transition-colors"
                      style={{color:'var(--green)'}}><FileText size={11}/>Open</button>
                    <button onClick={()=>openModal('subject',selectedSemester._id,subject)}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs hover:bg-indigo-50 transition-colors"
                      style={{color:'#6366f1'}}><Pencil size={11}/>Edit</button>
                    <button onClick={()=>handleDelete('subject',subject._id)}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs hover:bg-red-50 transition-colors"
                      style={{color:'var(--red)'}}><Trash2 size={11}/>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {renderModals()}
      </div>
    );
  }

  // ── Academic view (list of semesters + direct file creation) ───
  if (selectedAcademic) {
    return (
      <div className="flex-1 overflow-y-auto" style={{background:'var(--paper)'}}>
        <Breadcrumb/>
        <div className="px-4 sm:px-6 py-5 animate-fade-in">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2" style={{color:'var(--ink)'}}>
                <span>{selectedAcademic.icon}</span>{selectedAcademic.name}
              </h1>
              {selectedAcademic.description&&<p className="text-sm mt-1" style={{color:'var(--ink3)'}}>{selectedAcademic.description}</p>}
            </div>
          </div>
          <ActionRow>
            <BtnCreate label="New Semester" icon={FolderPlus} onClick={()=>openModal('semester',selectedAcademic._id)}/>
            <BtnEdit onClick={()=>openModal('academic',undefined,selectedAcademic)}/>
            <BtnDelete onClick={()=>handleDelete('academic',selectedAcademic._id)}/>
          </ActionRow>

          {semesters.length===0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
                style={{background:'var(--paper2)',border:'1.5px solid var(--border)'}}>
                <FolderPlus size={24} style={{color:'var(--ink3)'}}/>
              </div>
              <h3 className="font-semibold mb-1" style={{color:'var(--ink2)'}}>No semesters yet</h3>
              <p className="text-sm mb-4" style={{color:'var(--ink3)'}}>Create a semester folder to get started</p>
              <button onClick={()=>openModal('semester',selectedAcademic._id)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90"
                style={{background:'var(--green)',color:'#fff'}}>
                <FolderPlus size={15}/>New Semester
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {semesters.map(semester=>(
                <div key={semester._id} className="rounded-2xl p-4 transition-all hover:-translate-y-0.5 animate-slide-up"
                  style={{background:'#fff',border:'1.5px solid var(--border)',boxShadow:'0 1px 4px rgba(0,0,0,0.04)'}}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background:'var(--green-lt)'}}>
                      <BookOpen size={18} style={{color:'var(--green)'}}/>
                    </div>
                    <button className="font-semibold text-sm text-left hover:text-green-700 transition-colors flex-1 truncate"
                      style={{color:'var(--ink)'}} onClick={()=>setSelectedSemester(semester)}>
                      {semester.name}
                    </button>
                  </div>
                  {semester.description&&<p className="text-xs mb-3 line-clamp-2" style={{color:'var(--ink3)'}}>{semester.description}</p>}
                  <div className="flex items-center gap-1.5 pt-2" style={{borderTop:'1px solid var(--border)'}}>
                    <button onClick={()=>setSelectedSemester(semester)}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs hover:bg-green-50 transition-colors"
                      style={{color:'var(--green)'}}><BookOpen size={11}/>Open</button>
                    <button onClick={()=>openModal('semester',selectedAcademic._id,semester)}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs hover:bg-indigo-50 transition-colors"
                      style={{color:'#6366f1'}}><Pencil size={11}/>Edit</button>
                    <button onClick={()=>handleDelete('semester',semester._id)}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs hover:bg-red-50 transition-colors"
                      style={{color:'var(--red)'}}><Trash2 size={11}/>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {renderModals()}
      </div>
    );
  }

  // ── Home screen (no selection) ─────────────────────────────────
  return (
    <div className="flex-1 overflow-y-auto" style={{background:'var(--paper)'}}>
      <div className="px-4 sm:px-6 py-5 animate-fade-in">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2" style={{color:'var(--ink)'}}>
              <BookOpenCheck size={24} style={{color:'var(--green)'}}/>Welcome to StudSave
            </h1>
            <p className="text-sm mt-1" style={{color:'var(--ink3)'}}>
              {sidebarOpen ? 'Select from the sidebar or create a new academic year below.' : 'Tap ☰ to open the sidebar, or create a new academic year below.'}
            </p>
          </div>
        </div>

        <ActionRow>
          <BtnCreate label="New Academic Year" icon={GraduationCap} onClick={()=>openModal('academic')}/>
        </ActionRow>

        {academics.length>0&&(
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
            {academics.map(academic=>(
              <div key={academic._id} className="rounded-2xl p-4 transition-all hover:-translate-y-0.5 animate-slide-up"
                style={{background:'#fff',border:'1.5px solid var(--border)',boxShadow:'0 1px 4px rgba(0,0,0,0.04)'}}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                    style={{background:'var(--green-lt)'}}>{academic.icon}</div>
                  <button className="font-semibold text-sm text-left hover:text-green-700 transition-colors flex-1 truncate"
                    style={{color:'var(--ink)'}} onClick={()=>setSelectedAcademic(academic)}>
                    {academic.name}
                  </button>
                </div>
                {academic.description&&<p className="text-xs mb-3 line-clamp-2" style={{color:'var(--ink3)'}}>{academic.description}</p>}
                <div className="flex items-center gap-1.5 pt-2" style={{borderTop:'1px solid var(--border)'}}>
                  <button onClick={()=>setSelectedAcademic(academic)}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs hover:bg-green-50 transition-colors"
                    style={{color:'var(--green)'}}><BookOpen size={11}/>Open</button>
                  <button onClick={()=>openModal('academic',undefined,academic)}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs hover:bg-indigo-50 transition-colors"
                    style={{color:'#6366f1'}}><Pencil size={11}/>Edit</button>
                  <button onClick={()=>handleDelete('academic',academic._id)}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs hover:bg-red-50 transition-colors"
                    style={{color:'var(--red)'}}><Trash2 size={11}/>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {renderModals()}
    </div>
  );

  // ── Modals renderer ────────────────────────────────────────────
  function renderModals() {
    return (
      <>
        {modal&&(
          <Modal title={`${modal.item?'Edit':'New'} ${modal.type.charAt(0).toUpperCase()+modal.type.slice(1)}`} onClose={()=>setModal(null)}>
            <div className="space-y-4">
              {(modal.type==='academic'||modal.type==='subject')&&(
                <div>
                  <label className="block text-xs font-bold mb-2 uppercase tracking-wider" style={{color:'var(--ink3)'}}>Icon</label>
                  <div className="flex flex-wrap gap-2">
                    {ICONS.map(icon=>(
                      <button key={icon} onClick={()=>setFormData(p=>({...p,icon}))}
                        className="w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all hover:scale-105"
                        style={{background:formData.icon===icon?'var(--green-lt)':'var(--paper2)',boxShadow:formData.icon===icon?'0 0 0 2px var(--green)':'none'}}>
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
                        className="w-7 h-7 rounded-full transition-all hover:scale-110"
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

        {lockModal&&(
          <Modal
            title={lockModal.mode==='set'?`🔒 Lock "${lockModal.subject.name}"`:`🔓 Remove lock from "${lockModal.subject.name}"`}
            onClose={()=>setLockModal(null)}>
            <div className="space-y-4">
              <p className="text-sm" style={{color:'var(--ink2)'}}>
                {lockModal.mode==='set'?'Set a PIN to protect this folder. You\'ll need it to open it later.'
                  :'Enter the current PIN to remove the lock from this folder.'}
              </p>
              <div>
                <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{color:'var(--ink3)'}}>
                  {lockModal.mode==='set'?'New PIN (4+ digits)':'PIN'}
                </label>
                <div className="relative">
                  <LockKeyhole size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{color:'var(--ink3)'}}/>
                  <input
                    type={showPin?'text':'password'} inputMode="numeric"
                    value={pin}
                    onChange={e=>{setPin(e.target.value.replace(/\D/g,''));setPinError('');}}
                    onKeyDown={e=>{if(e.key==='Enter')handleLockSubmit();}}
                    className="input pl-9 pr-10 text-lg tracking-widest font-mono"
                    placeholder="••••" maxLength={8} autoFocus/>
                  <button type="button" onClick={()=>setShowPin(!showPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors" style={{color:'var(--ink3)'}}>
                    {showPin?<EyeOff size={14}/>:<Eye size={14}/>}
                  </button>
                </div>
                {pinError&&<p className="text-xs mt-1.5 font-medium" style={{color:'var(--red)'}}>{pinError}</p>}
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={()=>setLockModal(null)} className="btn-ghost">Cancel</button>
                <button onClick={handleLockSubmit} disabled={lockSaving||pin.length<4} className="btn-primary"
                  style={{background:lockModal.mode==='remove'?'var(--red)':undefined}}>
                  {lockSaving?<Loader2 size={13} className="animate-spin"/>:
                    lockModal.mode==='set'?<><Lock size={13}/>Lock Folder</>:<><Unlock size={13}/>Remove Lock</>}
                </button>
              </div>
            </div>
          </Modal>
        )}
      </>
    );
  }
}
