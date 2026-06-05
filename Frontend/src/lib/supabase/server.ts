import { createClient } from "@supabase/supabase-js";
import { hasSupabaseServerConfig } from "@/lib/env";
import type { Database } from "@/types/supabase";

let supabaseAdminClient: ReturnType<typeof createClient<Database>> | null | undefined;

export function createSupabaseAdmin() {
  if (supabaseAdminClient !== undefined) {
    return supabaseAdminClient;
  }

  if (!hasSupabaseServerConfig()) {
    supabaseAdminClient = null;
    return null;
  }

  supabaseAdminClient = createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false
      }
    }
  );

  return supabaseAdminClient;
}
