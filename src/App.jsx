import React, { useState, useEffect, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Components
import LoginPage from './components/LoginPage';
import DashboardIntegrated from './components/DashboardIntegrated';
import DetailPageComprehensive from './components/DetailPageComprehensive';
import HeaderIntegrated from './components/HeaderIntegrated';
import CompanyFoundingsPageIntegrated from './components/CompanyFoundingsPageIntegrated';
import ManagementChangesPageIntegrated from './components/ManagementChangesPageIntegrated';

// Data
import werkstattDataRaw from './assets/werkstatt-data.json';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    city: '',
    zipCode: '',
    concept: '',
    hasWebsite: false,
    hasPhone: false,
    hasEmail: false
  });

  // Use the integrated data directly (no processing needed)
  const werkstattData = useMemo(() => {
    return werkstattDataRaw;
  }, []);

  // Check authentication on app load
  useEffect(() => {
    const authStatus = localStorage.getItem('zf-werkstatt-auth');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (password) => {
    // Updated password
    if (password === 'zfsample2025-10') {
      setIsAuthenticated(true);
      localStorage.setItem('zf-werkstatt-auth', 'true');
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('zf-werkstatt-auth');
  };

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <Router>
      <div className="min-h-screen bg-background">
        <HeaderIntegrated 
          onLogout={handleLogout}
          allData={werkstattData}
        />
        
        <main className="w-full min-h-screen px-4 py-6">
          <Routes>
            <Route 
              path="/" 
              element={
                <DashboardIntegrated 
                  data={werkstattData}
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  filters={filters}
                  setFilters={setFilters}
                />
              } 
            />
            <Route 
              path="/detail/:id" 
              element={<DetailPageComprehensive />} 
            />
            <Route 
              path="/company-foundings" 
              element={<CompanyFoundingsPageIntegrated data={werkstattData} />} 
            />
            <Route 
              path="/management-changes" 
              element={<ManagementChangesPageIntegrated data={werkstattData} />} 
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
