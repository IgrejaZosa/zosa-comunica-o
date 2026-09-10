import { Logo } from "@/components/Logo";
import { EscolherUsuarioForm } from "@/components/EscolherUsuarioForm";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function QuemEVocePage() {
  const supabase = createClient();
  const { data: profiles } = await supabase.from("profiles").select("*").order("nome");

  return (
    <div className="min-h-screen flex items-center justify-center bg-zosa-cream px-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Logo heightClassName="h-12" textClassName="text-2xl" />
        </div>
        <EscolherUsuarioForm profiles={(profiles ?? []) as Profile[]} />
      </div>
    </div>
  );
}
