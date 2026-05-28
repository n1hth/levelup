import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://kutrryjfdbtsngkwhpny.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1dHJyeWpmZGJ0c25na3docG55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2MDAyMTMsImV4cCI6MjA5NDE3NjIxM30.Dz0s6yCv7G5NKAFIpreepqfuTspezaXwTj6UgIg9GBE');

async function test() {
  const email = `test_${Date.now()}@example.com`;
  const { data, error } = await supabase.auth.signUp({
    email,
    password: 'dummy_password_123'
  });
  console.log("Signup test:", data, error);
}

test();
