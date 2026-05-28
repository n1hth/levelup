import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://kutrryjfdbtsngkwhpny.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1dHJyeWpmZGJ0c25na3docG55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2MDAyMTMsImV4cCI6MjA5NDE3NjIxM30.Dz0s6yCv7G5NKAFIpreepqfuTspezaXwTj6UgIg9GBE');

async function test() {
  const { data: d1, error: e1 } = await supabase.auth.signInWithPassword({
    email: 'nonexistent123456789@example.com',
    password: 'wrongpassword'
  });
  console.log("Non-existent:", e1?.message);

  const { data: d2, error: e2 } = await supabase.auth.signInWithPassword({
    email: 'test@example.com', // Need a known existing email, maybe we don't know one. Let's just create one.
    password: 'wrongpassword'
  });
  console.log("Existing (maybe):", e2?.message);
}

test();
