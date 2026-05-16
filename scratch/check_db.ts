
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kutrryjfdbtsngkwhpny.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1dHJyeWpmZGJ0c25na3docG55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2MDAyMTMsImV4cCI6MjA5NDE3NjIxM30.Dz0s6yCv7G5NKAFIpreepqfuTspezaXwTj6UgIg9GBE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkColumns() {
  const { data, error } = await supabase.from('duel_requests').select('*').limit(1);
  if (error) {
    console.error("Error:", error.message);
  } else {
    if (data && data.length > 0) {
      console.log("Columns:", Object.keys(data[0]));
    } else {
      console.log("No data found, checking table info via RPC...");
      // Try a dummy insert and catch error to see columns? No, let's just try to insert with a random column and see error.
      const { error: err2 } = await supabase.from('duel_requests').insert({ dummy_column: 1 });
      console.log("Table structure hint:", err2?.message);
    }
  }
}
checkColumns();
