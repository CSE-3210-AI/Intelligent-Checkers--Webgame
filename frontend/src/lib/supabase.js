import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dnauxuozanmjdjchvbff.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuYXV4dW96YW5tamRqY2h2YmZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNTQ2MTYsImV4cCI6MjA4NzkzMDYxNn0.m4ChZ8o5u5TSRLq2JJb0ZzzxipPIQyEVWDtBI9jK_OY'; // Replace with your Supabase anon/public key

export const supabase = createClient(supabaseUrl, supabaseKey);
