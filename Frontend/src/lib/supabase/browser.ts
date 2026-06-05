"use client";

import { createClient } from "@supabase/supabase-js";
import { hasSupabaseBrowserConfig } from "@/lib/env";
import type { Database } from "@/types/supabase";

let supabaseBrowserClient: ReturnType<typeof createClient<Database>> | null | undefined;

export function createSupabaseBrowserClient() {
  if (supabaseBrowserClient !== undefined) {
    return supabaseBrowserClient;
  }

  if (!hasSupabaseBrowserConfig()) {
    supabaseBrowserClient = null;
    return null;
  }

  supabaseBrowserClient = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  return supabaseBrowserClient;
}
