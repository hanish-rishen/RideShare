// lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://pbfirnpgjabstoalmhqq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBiZmlybnBnamFic3RvYWxtaHFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjE5OTk0OTIsImV4cCI6MjAzNzU3NTQ5Mn0.J0KXOuM01e4CuprKH8hDQQUT0GsaI5FR6enX9WrM_H8';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
