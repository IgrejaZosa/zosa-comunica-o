"use client";

import { createContext, useContext } from "react";
import type { Account, Profile } from "@/lib/types";

interface SessionData {
  profile: Profile;
  profiles: Profile[];
  accounts: Account[];
}

const SessionContext = createContext<SessionData | null>(null);

export function SessionProvider({
  value,
  children,
}: {
  value: SessionData;
  children: React.ReactNode;
}) {
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionData {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession deve ser usado dentro de <SessionProvider>");
  return ctx;
}
