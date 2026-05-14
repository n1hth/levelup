const { createClient } = require('@supabase/supabase-js');
const s = createClient('https://kutrryjfdbtsngkwhpny.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1dHJyeWpmZGJ0c25na3docG55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2MDAyMTMsImV4cCI6MjA5NDE3NjIxM30.Dz0s6yCv7G5NKAFIpreepqfuTspezaXwTj6UgIg9GBE');

async function testInsert() {
  const { data, error } = await s.from('decks').insert({
    id: '123e4567-e89b-12d3-a456-426614174000',
    user_id: '768ee0c5-40fe-4a94-904f-77451c4fbee4',
    title: 'test',
    subject: 'test',
    description: 'test',
    color: 'test',
    tags: [],
    created_at: new Date().toISOString()
  });
  console.log("Insert Error:", error);
}
testInsert();
