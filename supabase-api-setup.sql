-- SQL Setup für API Funktionalität
-- Führen Sie dieses SQL in Ihrem Supabase SQL Editor aus

-- 1. RPC Funktion für atomares Inkrement der API Usage
CREATE OR REPLACE FUNCTION increment_api_usage(p_username text, p_count bigint)
RETURNS void AS $$
BEGIN
  UPDATE tenants 
  SET api_usage = COALESCE(api_usage, 0) + p_count
  WHERE username = p_username;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Funktion um API Key zu generieren (UUID-basiert)
CREATE OR REPLACE FUNCTION generate_api_key(p_username text)
RETURNS text AS $$
DECLARE
  v_api_key text;
BEGIN
  -- Generate a unique API key
  v_api_key := 'sk_' || replace(gen_random_uuid()::text, '-', '');
  
  -- Update the tenant with the new API key
  UPDATE tenants 
  SET api_key = v_api_key
  WHERE username = p_username;
  
  RETURN v_api_key;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. View für API Usage Statistiken
CREATE OR REPLACE VIEW api_usage_stats AS
SELECT 
  username,
  tenant_name,
  api_usage,
  api_limit,
  api_validto,
  CASE 
    WHEN api_limit IS NULL THEN NULL
    ELSE ROUND((api_usage::numeric / api_limit::numeric) * 100, 2)
  END as usage_percentage,
  CASE 
    WHEN api_limit IS NOT NULL AND api_usage >= api_limit THEN true
    ELSE false
  END as limit_reached,
  CASE 
    WHEN api_validto IS NOT NULL AND api_validto < CURRENT_DATE THEN true
    ELSE false
  END as expired,
  active
FROM tenants
WHERE api_key IS NOT NULL;

-- 4. Beispiel: API Keys für bestehende Tenants generieren
-- Führen Sie dies nur aus, wenn Sie für alle Tenants API Keys erstellen möchten
-- UPDATE tenants SET api_key = 'sk_' || replace(gen_random_uuid()::text, '-', '') WHERE api_key IS NULL;

-- 5. Beispiel: Test-Daten für API Limits setzen
-- UPDATE tenants SET api_limit = 10000, api_usage = 0 WHERE username = 'zf';
-- UPDATE tenants SET api_limit = 5000, api_usage = 0 WHERE username = 'auteon';
-- UPDATE tenants SET api_validto = CURRENT_DATE + INTERVAL '365 days' WHERE username IN ('zf', 'auteon');

-- 6. Index für Performance
CREATE INDEX IF NOT EXISTS idx_tenants_api_key ON tenants(api_key);

COMMENT ON FUNCTION increment_api_usage IS 'Atomically increments API usage counter for a tenant';
COMMENT ON FUNCTION generate_api_key IS 'Generates a new API key for a tenant';
COMMENT ON VIEW api_usage_stats IS 'View showing API usage statistics for all tenants';

