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
import APIDocumentation from './components/APIDocumentation';

// Data
import werkstattDataRaw from './assets/werkstatt-data.json';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tenantName, setTenantName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiUsage, setApiUsage] = useState(0);
  const [apiLimit, setApiLimit] = useState(null);
  const [apiValidTo, setApiValidTo] = useState(null);
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

  // Safari-compatible date parsing function
  const parseDateSafari = (dateStr) => {
    if (!dateStr) return null;
    
    try {
      // Handle the specific format: "2025-10-09 22:22:24.486274 UTC"
      // Safari has issues with microseconds, so we'll strip them
      let cleanDateStr = dateStr;
      
      // Remove microseconds (everything after the last dot before UTC)
      if (cleanDateStr.includes(' UTC')) {
        cleanDateStr = cleanDateStr.replace(/\.\d+ UTC$/, ' UTC');
      }
      
      // Try parsing the cleaned string
      let date = new Date(cleanDateStr);
      
      // If that fails, try removing UTC suffix
      if (isNaN(date.getTime())) {
        cleanDateStr = cleanDateStr.replace(' UTC', '');
        date = new Date(cleanDateStr);
      }
      
      // If still fails, try ISO format conversion
      if (isNaN(date.getTime())) {
        // Convert "2025-10-09 22:22:24" to "2025-10-09T22:22:24Z"
        cleanDateStr = cleanDateStr.replace(' ', 'T') + 'Z';
        date = new Date(cleanDateStr);
      }
      
      return isNaN(date.getTime()) ? null : date;
    } catch (error) {
      console.warn('Safari date parsing error for:', dateStr, error);
      return null;
    }
  };

  // Compute latest updated_at date across data
  const latestUpdatedAt = useMemo(() => {
    console.log('Safari debug - werkstattDataRaw length:', werkstattDataRaw?.length);
    
    const dates = (werkstattDataRaw || []).flatMap(item => {
      const itemDates = [];
      
      // Main item updated_at
      if (item.updated_at) {
        console.log('Safari debug - found item.updated_at:', item.updated_at);
        itemDates.push(item.updated_at);
      }
      
      // Relationships updated_at
      if (item.relationships && Array.isArray(item.relationships)) {
        item.relationships.forEach(rel => {
          if (rel.updated_at) {
            console.log('Safari debug - found relationship.updated_at:', rel.updated_at);
            itemDates.push(rel.updated_at);
          }
        });
      }
      
      // Events updated_at (fallback for other data structures)
      if (item.events && Array.isArray(item.events)) {
        item.events.forEach(event => {
          if (event.updated_at) {
            console.log('Safari debug - found event.updated_at:', event.updated_at);
            itemDates.push(event.updated_at);
          }
        });
      }
      
      return itemDates;
    }).filter(Boolean);
    
    console.log('Safari debug - total dates found:', dates.length);
    console.log('Safari debug - first few dates:', dates.slice(0, 3));
    
    if (dates.length === 0) return null;
    
    // Sort dates safely, handling invalid dates with Safari-compatible parsing
    const validDates = dates
      .map(dateStr => {
        const date = parseDateSafari(dateStr);
        return date ? { date, original: dateStr } : null;
      })
      .filter(Boolean)
      .sort((a, b) => b.date - a.date);
    
    console.log('Safari debug - valid dates count:', validDates.length);
    if (validDates.length > 0) {
      console.log('Safari debug - latest date:', validDates[0].date);
      console.log('Safari debug - latest date original:', validDates[0].original);
    }
    
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
  // Fetch user info and API data on mount
  const fetchUserData = async () => {
    try {
      const res = await fetch('/api/me', { credentials: 'include' });
      if (!res.ok) return;
      
      const data = await res.json();
      if (data && data.user) {
        setIsAuthenticated(true);
        setTenantName(data.tenantName || '');
        
        // Set API data if available
        if (data.apiKey) {
          setApiKey(data.apiKey);
          setApiUsage(data.apiUsage || 0);
          setApiLimit(data.apiLimit);
          setApiValidTo(data.apiValidTo);
        }
        
        // Initialize GA4 user properties and user_id early in the session
        try {
          if (window.gtag) {
            window.gtag('set', 'user_properties', { tenant: data.tenantName || data.user });
            window.gtag('set', { user_id: data.user });
          }
        } catch {}
      }
    } catch (error) {
      // Not authenticated
    }
  };

  useEffect(() => {
    fetchUserData();
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
            <Route 
              path="/api-docs" 
              element={
                <APIDocumentation 
                  apiKey={apiKey}
                  apiUsage={apiUsage}
                  apiLimit={apiLimit}
                  apiValidTo={apiValidTo}
                />
              } 
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
