
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kutrryjfdbtsngkwhpny.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1dHJyeWpmZGJ0c25na3docG55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2MDAyMTMsImV4cCI6MjA5NDE3NjIxM30.Dz0s6yCv7G5NKAFIpreepqfuTspezaXwTj6UgIg9GBE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testInsert() {
  console.log("Testing insert into duel_requests...");
  // Use existing IDs from the system if possible, or just random ones to test constraints
  const testSender = '037a1c72-97b7-4952-b169-216503ba67e8'; // A valid user ID?
  const testReceiver = '037a1c72-97b7-4952-b169-216503ba67e8'; // Self test
  
  const { data, error } = await supabase.from('duel_requests').insert({
    sender_id: testSender,
    receiver_id: testReceiver,
    status: 'pending'
  }).select();

  if (error) {
    console.error("Insert failed:", error.message);
    console.error("Error details:", error);
  } else {
    console.log("Insert successful:", data);
  }
}
testInsert();
