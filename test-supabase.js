import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE;

console.log('Testing Supabase connection...');
console.log('URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseServiceRole, {
  auth: { persistSession: false }
});

// Test: Fetch all tenants
const { data, error } = await supabase
  .from('tenants')
  .select('username, tenant_name, active')
  .eq('active', true);

if (error) {
  console.error('❌ Error:', error);
} else {
  console.log('✅ Success! Found tenants:');
  console.table(data);
  console.log('\n💡 You can login with these usernames:');
  data.forEach(tenant => {
    console.log(`   - ${tenant.username} (${tenant.tenant_name})`);
  });
}

