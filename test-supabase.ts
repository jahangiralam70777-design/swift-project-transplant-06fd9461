import { createClient } from '@supabase/supabase-js';
const supabase = createClient('http://localhost:54321', 'key');
console.log('getClaims exists:', typeof (supabase.auth as any).getClaims);
