import { createClient } from "@supabase/supabase-js";

// @ts-ignore - process might not be defined in Vite without config, but keeping as requested
const supabaseUrl = typeof process !== 'undefined' && process.env ? process.env.NEXT_PUBLIC_SUPABASE_URL! : (import.meta as any).env.VITE_NEXT_PUBLIC_SUPABASE_URL || (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseAnonKey = typeof process !== 'undefined' && process.env ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! : (import.meta as any).env.VITE_NEXT_PUBLIC_SUPABASE_ANON_KEY || (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase environment variables not configured");
}

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);
