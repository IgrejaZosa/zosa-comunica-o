import { redirect } from "next/navigation";
import { getProfileAtual } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { SessionProvider } from "@/lib/session-context";
import { Header } from "@/components/Header";
import type { Account, Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfileAtual();
  if (!profile) redirect("/quem-e-voce");

  const supabase = createClient();
  const [{ data: profiles }, { data: accounts }] = await Promise.all([
    supabase.from("profiles").select("*").order("nome"),
    supabase.from("accounts").select("*").order("nome"),
  ]);

  return (
    <SessionProvider
      value={{
        profile,
        profiles: (profiles ?? []) as Profile[],
        accounts: (accounts ?? []) as Account[],
      }}
    >
      <Header />
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">{children}</main>
    </SessionProvider>
  );
}
