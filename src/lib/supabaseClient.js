
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ayomxspoosbrsldbbptc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5b214c3Bvb3NicnNsZGJicHRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYyMDUwOTYsImV4cCI6MjA2MTc4MTA5Nn0.eHEJnJgzeZkxzCAfIHXg1tYUYk8spWiMamybyVk6FfQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
