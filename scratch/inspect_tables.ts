
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kutrryjfdbtsngkwhpny.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1dHJyeWpmZGJ0c25na3docG55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2MDAyMTMsImV4cCI6MjA5NDE3NjIxM30.Dz0s6yCv7G5NKAFIpreepqfuTspezaXwTj6UgIg9GBE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectTable() {
  console.log("Inspecting 'duels' table...");
  // We can't query information_schema directly with anon key usually.
  // But we can try to select one record and see the structure if possible.
  const { data, error } = await supabase.from('duels').select('*').limit(1);
  if (error) console.error("Error fetching duels:", error);
  else console.log("Duel Record Sample:", data);

  console.log("\nInspecting 'duel_requests' table...");
  const { data: reqs, error: reqErr } = await supabase.from('duel_requests').select('*').limit(1);
  if (reqErr) console.error("Error fetching requests:", reqErr);
  else console.log("Request Record Sample:", reqs);
}
inspectTable();
