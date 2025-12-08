import { createClient } from '@supabase/supabase-js';

// REPLACE THESE WITH YOUR ACTUAL SUPABASE KEYS
const supabaseUrl = "https://ujbhfbpigvwkoygytvww.supabase.co"; 
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqYmhmYnBpZ3Z3a295Z3l0dnd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxODY2MTMsImV4cCI6MjA4MDc2MjYxM30.xleJuD1h9F85dLqWL6uMB_KedCmLh0-CRLikByUSaaE"; 

export const supabase = createClient(supabaseUrl, supabaseKey);