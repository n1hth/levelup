
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kutrryjfdbtsngkwhpny.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1dHJyeWpmZGJ0c25na3docG55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2MDAyMTMsImV4cCI6MjA5NDE3NjIxM30.Dz0s6yCv7G5NKAFIpreepqfuTspezaXwTj6UgIg9GBE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkDuelRequests() {
  const { data, error } = await supabase.from('duel_requests').select('*');
  if (error) console.error(error);
  else {
    console.log("Duel Requests Count:", data.length);
    console.log("Latest Request:", data[data.length - 1]);
  }
}
checkDuelRequests();
