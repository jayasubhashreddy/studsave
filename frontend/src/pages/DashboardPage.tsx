import React from 'react';
import Sidebar from '../components/Sidebar';
import MainContent from '../components/MainContent';

export default function DashboardPage() {
  return (
    <div className="flex h-screen h-[100dvh] overflow-hidden" style={{background:'var(--paper)'}}>
      <Sidebar/>
      <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <MainContent/>
      </main>
    </div>
  );
}
