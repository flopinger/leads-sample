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
    const dates = (werkstattDataRaw || []).flatMap(item => {
      const itemDates = [];
      
      // Main item updated_at
      if (item.updated_at) itemDates.push(item.updated_at);
      
      // Relationships updated_at
      if (item.relationships && Array.isArray(item.relationships)) {
        item.relationships.forEach(rel => {
          if (rel.updated_at) itemDates.push(rel.updated_at);
        });
      }
      
      // Events updated_at (fallback for other data structures)
      if (item.events && Array.isArray(item.events)) {
        item.events.forEach(event => {
          if (event.updated_at) itemDates.push(event.updated_at);
        });
      }
      
      return itemDates;
    }).filter(Boolean);
    
    if (dates.length === 0) return null;
    
    // Sort dates safely, handling invalid dates
    const validDates = dates
      .map(dateStr => {
        try {
          const date = new Date(dateStr);
          return isNaN(date.getTime()) ? null : { date, original: dateStr };
        } catch {
          return null;
        }
      })
      .filter(Boolean)
      .sort((a, b) => b.date - a.date);
    
    return validDates.length > 0 ? validDates[0].date : null;
  }, []);

  useEffect(() => {
    if (latestUpdatedAt && typeof window !== 'undefined') {
      try {
        // Force manual formatting for Safari compatibility
        const day = latestUpdatedAt.getDate().toString().padStart(2, '0');
        const month = (latestUpdatedAt.getMonth() + 1).toString().padStart(2, '0');
        const year = latestUpdatedAt.getFullYear();
        const formatted = `${day}.${month}.${year}`;
        
        console.log('Safari debug - latestUpdatedAt:', latestUpdatedAt);
        console.log('Safari debug - formatted:', formatted);
        
        window.__LATEST_UPDATED_AT__ = formatted;
      } catch (error) {
        console.warn('Safari date formatting error:', error);
        window.__LATEST_UPDATED_AT__ = 'Unbekannt';
      }
    } else {
      console.log('Safari debug - latestUpdatedAt is null or window undefined');
    }
    if (tenantName && typeof window !== 'undefined') {
      window.__TENANT_NAME__ = tenantName;
      try { document.title = `Werkstattadressen – ${tenantName}`; } catch {}
    }
    if (window.gtag) {
      // Ensure user property is set whenever tenantName is known
      if (tenantName) {
        window.gtag('set', 'user_properties', { tenant: tenantName });
        // Also update config so subsequent events definitely carry the property
        window.gtag('config', 'G-ZCG0Z3F5RE', { user_properties: { tenant: tenantName } });
        // Emit a small test event so DebugView reflects the change immediately
        window.gtag('event', 'tenant_ready', { tenant: tenantName, debug_mode: true });
      }
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
