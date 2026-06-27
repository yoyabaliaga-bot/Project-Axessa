import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://xgjylhdvubxwszteqyna.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnanlsaGR2dWJ4d3N6dGVxeW5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0OTE2MjMsImV4cCI6MjA5ODA2NzYyM30.8bPY9_e5j-gkZRTR5oXC6oloYFCCrK1qxGylbbCzQj4";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnanlsaGR2dWJ4d3N6dGVxeW5hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjQ5MTYyMywiZXhwOjIwOTgwNjc2MjN9.yUXPbZtyth8pxZV4U8LauwRYWwXvXDaSbHFF-kUr2uU";

// Public client (anon key) - for browser use with RLS
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client (service role) - for backend operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
