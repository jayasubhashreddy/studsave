import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import DashboardPage from './pages/DashboardPage';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/*" element={<DashboardPage />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
