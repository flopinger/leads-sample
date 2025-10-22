-- SQL Fix für API Usage Tracking
-- Die Funktion muss api_key statt username verwenden

-- 1. Alte Funktion löschen
DROP FUNCTION IF EXISTS increment_api_usage(text, bigint);

-- 2. Neue Version der increment_api_usage Funktion erstellen
CREATE OR REPLACE FUNCTION increment_api_usage(p_api_key text, p_count bigint)
RETURNS void AS $$
BEGIN
  UPDATE tenants 
  SET api_usage = COALESCE(api_usage, 0) + p_count
  WHERE api_key = p_api_key;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION increment_api_usage IS 'Atomically increments API usage counter for a tenant by API key';

