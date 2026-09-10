import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/** Cliente do navegador. Sem login do Supabase Auth neste app (acesso e
 * identidade sao controlados pelos cookies proprios - ver src/lib/auth.ts
 * e src/proxy.ts), entao isso e so um cliente anon simples. */
export function createClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
