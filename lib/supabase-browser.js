"use client";

import { createClient } from "@supabase/supabase-js";

let browserClient = null;

export function getSupabaseBrowserClient() {
  if (browserClient) {
    return browserClient;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) {
    throw new Error("Supabase browser configuration is missing.");
  }

  browserClient = createClient(url, anonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
    },
  });

  return browserClient;
}

export async function getCurrentAccessToken() {
  const client = getSupabaseBrowserClient();
  const {
    data: { session },
  } = await client.auth.getSession();

  return session?.access_token ?? "";
}
