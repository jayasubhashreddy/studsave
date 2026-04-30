import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Academic, Semester, Subject, Unit } from '../utils/types';

interface AppContextType {
  selectedAcademic: Academic | null;
  selectedSemester: Semester | null;
  selectedSubject:  Subject | null;
  selectedUnit:     Unit | null;
  setSelectedAcademic: (a: Academic | null) => void;
  setSelectedSemester: (s: Semester | null) => void;
  setSelectedSubject:  (s: Subject | null) => void;
  setSelectedUnit:     (u: Unit | null) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
  refreshTrigger: number;
  triggerRefresh: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [selectedAcademic, setSelectedAcademic] = useState<Academic | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<Semester | null>(null);
  const [selectedSubject,  setSelectedSubject]  = useState<Subject | null>(null);
  const [selectedUnit,     setSelectedUnit]     = useState<Unit | null>(null);
  const [sidebarOpen,      setSidebarOpen]      = useState(true);
  const [refreshTrigger,   setRefreshTrigger]   = useState(0);

  const triggerRefresh = () => setRefreshTrigger(n => n + 1);

  const handleSetSelectedSemester = (s: Semester | null) => {
    setSelectedSemester(s);
    setSelectedSubject(null);
    setSelectedUnit(null);
  };
  const handleSetSelectedSubject = (s: Subject | null) => {
    setSelectedSubject(s);
    setSelectedUnit(null);
  };

  return (
    <AppContext.Provider value={{
      selectedAcademic, selectedSemester, selectedSubject, selectedUnit,
      setSelectedAcademic,
      setSelectedSemester: handleSetSelectedSemester,
      setSelectedSubject: handleSetSelectedSubject,
      setSelectedUnit,
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
