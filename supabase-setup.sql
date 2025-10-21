-- SQL für Supabase tenants Tabelle
CREATE TABLE tenants (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  tenant_name TEXT NOT NULL,
  logo_file TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Beispiel-Daten einfügen
INSERT INTO tenants (username, password, tenant_name, logo_file) VALUES
('admin', 'admin123', 'Admin', 'zf-logo.svg'),
('demo', 'demo123', 'Demo', 'auteon-logo.jpg'),
('zf', 'zf123', 'ZF', 'zf-logo.svg'),
('auteon', 'auteon123', 'Auteon', 'auteon-logo.jpg');
