"use client";

import { createContext, useContext } from "react";
import { useProjetos } from "@/lib/hooks";
import type { Account, Profile, Projeto } from "@/lib/types";

interface SessionData {
  profile: Profile;
  profiles: Profile[];
  accounts: Account[];
  projetos: Projeto[];
}

interface SessionInicial {
  profile: Profile;
  profiles: Profile[];
  accounts: Account[];
}

const SessionContext = createContext<SessionData | null>(null);

/** Busca os projetos com Realtime UMA vez aqui (não em cada card/linha
 * que precisa deles) e disponibiliza via useSession() - evitar dezenas
 * de assinaturas Realtime duplicadas numa tela com muitos itens. */
export function SessionProvider({
  value,
  children,
}: {
  value: SessionInicial;
  children: React.ReactNode;
}) {
  const projetos = useProjetos();
  return <SessionContext.Provider value={{ ...value, projetos }}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionData {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession deve ser usado dentro de <SessionProvider>");
  return ctx;
}
