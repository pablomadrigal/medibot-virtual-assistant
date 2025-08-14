"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let supabaseClient: SupabaseClient | null = null;

export function createBrowserSupabaseClient(): SupabaseClient {
  // Return cached client if available
  if (supabaseClient) {
    return supabaseClient;
  }

  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    // During SSR/SSG, return a mock client that will be replaced on the client
    return {
      auth: {
        signInWithPassword: async () => ({ error: { message: 'Client not available during SSR' } }),
        signUp: async () => ({ error: { message: 'Client not available during SSR' } }),
        signOut: async () => ({ error: { message: 'Client not available during SSR' } }),
      },
    } as unknown as SupabaseClient;
  }

  const supabaseUrl: string = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const publicKey: string =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "";

  if (!supabaseUrl || !publicKey) {
    throw new Error(
      "Missing Supabase env vars: ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY are set."
    );
  }

  supabaseClient = createBrowserClient(supabaseUrl, publicKey);
  return supabaseClient;
}


