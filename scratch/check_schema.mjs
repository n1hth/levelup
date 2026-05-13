import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://kutrryjfdbtsngkwhpny.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1dHJyeWpmZGJ0c25na3docG55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2MDAyMTMsImV4cCI6MjA5NDE3NjIxM30.Dz0s6yCv7G5NKAFIpreepqfuTspezaXwTj6UgIg9GBE'
);

// Check all columns by trying various known names
const cols = ['id','player1_id','player2_id','p1_id','p2_id','mode','status','p1_deck_id','p2_deck_id','p1_topic','p2_topic','p1_answer','p2_answer','created_at','updated_at','topic','duel_mode'];

for (const col of cols) {
  const { data, error } = await supabase.from('duels').select(col).limit(0);
  console.log(`  ${col}: ${error ? '❌ ' + error.message : '✅ exists'}`);
}

console.log('\n--- matchmaking_queue columns ---');
const mqCols = ['id','user_id','deck_id','mode','matched_duel_id','created_at','status'];
for (const col of mqCols) {
  const { data, error } = await supabase.from('matchmaking_queue').select(col).limit(0);
  console.log(`  ${col}: ${error ? '❌ ' + error.message : '✅ exists'}`);
}
