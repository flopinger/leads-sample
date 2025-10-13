import React, { useState, useEffect, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Components
import LoginPage from './components/LoginPage';
import LandingPage from './components/LandingPage';
import DashboardIntegrated from './components/DashboardIntegrated';
import DetailPageComprehensive from './components/DetailPageComprehensive';
import HeaderIntegrated from './components/HeaderIntegrated';
import CompanyFoundingsPageIntegrated from './components/CompanyFoundingsPageIntegrated';
import ManagementChangesPageIntegrated from './components/ManagementChangesPageIntegrated';

// Data
import werkstattDataRaw from './assets/werkstatt-data.json';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tenantName, setTenantName] = useState('');
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

  // Compute latest updated_at date across data
  const latestUpdatedAt = useMemo(() => {
    const dates = (werkstattDataRaw || []).flatMap(item => [
      item.updated_at,
      ...(item.events || []).map(e => e.updated_at)
    ]).filter(Boolean);
    const latest = dates.sort((a,b) => new Date(b) - new Date(a))[0];
    return latest ? new Date(latest) : null;
  }, []);

  useEffect(() => {
    if (latestUpdatedAt && typeof window !== 'undefined') {
      const formatted = latestUpdatedAt.toLocaleDateString('de-DE');
      window.__LATEST_UPDATED_AT__ = formatted;
    }
    if (tenantName && typeof window !== 'undefined') {
      window.__TENANT_NAME__ = tenantName;
      try { document.title = `Werkstattadressen – ${tenantName}`; } catch {}
    }
    if (window.gtag) {
      window.gtag('event', 'page_view', { tenant: tenantName || undefined });
    }
  }, [latestUpdatedAt, tenantName]);

  // Check authentication on app load
  useEffect(() => {
    // Check auth via backend
    fetch('/api/me', { credentials: 'include' })
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (data && data.user) {
          setIsAuthenticated(true);
          setTenantName(data.tenantName || '');
          // Initialize GA4 user properties and user_id early in the session
          try {
            if (window.gtag) {
              window.gtag('set', 'user_properties', { tenant: data.tenantName || data.user });
              window.gtag('set', { user_id: data.user });
            }
          } catch {}
        }
      })
      .catch(() => {});
  }, []);

  const handleLogin = async (password, user = 'zf') => {
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ user, password })
      });
      if (!res.ok) return false;
      setIsAuthenticated(true);
      // Fetch tenant name + set GA4
      try {
        const me = await (await fetch('/api/me', { credentials: 'include' })).json();
        setTenantName(me?.tenantName || '');
        if (window.gtag) {
          window.gtag('set', 'user_properties', { tenant: me?.tenantName || user });
          window.gtag('config', 'G-ZCG0Z3F5RE', { user_id: user });
        }
      } catch {}
      return true;
    } catch {
      return false;
    }
  };

  const handleLogout = async () => {
    try { await fetch('/api/logout', { method: 'POST', credentials: 'include' }); } catch {}
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
          <Route path="/" element={<LandingPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-background">
        <HeaderIntegrated 
          onLogout={handleLogout}
          allData={werkstattData}
          tenantName={tenantName}
        />
        
        <main className="w-full min-h-screen">
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
                  tenantName={tenantName}
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
