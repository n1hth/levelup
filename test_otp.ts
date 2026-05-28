import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://kutrryjfdbtsngkwhpny.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1dHJyeWpmZGJ0c25na3docG55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2MDAyMTMsImV4cCI6MjA5NDE3NjIxM30.Dz0s6yCv7G5NKAFIpreepqfuTspezaXwTj6UgIg9GBE');

async function test() {
  const { data: d1, error: e1 } = await supabase.auth.signInWithOtp({
    email: 'nonexistent123456789@example.com',
    options: {
      shouldCreateUser: false
    }
  });
  console.log("Non-existent OTP:", e1?.message || e1, d1);

  // We don't have a guaranteed existing email to test, but let's test a likely one or see if it throws rate limits.
  // We'll just see what nonexistent returns.
}

test();
