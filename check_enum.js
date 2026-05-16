import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase
    .from('duels')
    .update({ status: 'cancelled_seen' })
    .eq('id', 'some-fake-id');
  console.log(error ? error.message : "Success");
}
check();
