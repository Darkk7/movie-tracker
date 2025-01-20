import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mfgwpmieenmhobnxrnij.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mZ3dwbWllZW5taG9ibnhybmlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzcyMjAwOTUsImV4cCI6MjA1Mjc5NjA5NX0.YgFuV54cOpNTdxv_m_lHKrrQVp0rfFsLpiAHEKpnIa0';
const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;