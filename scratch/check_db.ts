import { createClient } from '@supabase/supabase-api';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function checkColumns() {
  const { data, error } = await supabase.rpc('get_table_columns', { table_name: 'matchmaking_queue' });
  console.log('Columns:', data);
  console.log('Error:', error);
}

checkColumns();
