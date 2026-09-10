"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { useSession } from "@/lib/session-context";

const NAV = [
  { href: "/calendario", label: "Calendário" },
  { href: "/quadro", label: "Quadro" },
  { href: "/backlog", label: "Backlog Mensal" },
  { href: "/sprint", label: "Sprint Atual" },
  { href: "/indicadores", label: "Indicadores" },
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile } = useSession();

  function trocarPessoa() {
    document.cookie = "zosa_usuario_id=; Max-Age=0; path=/";
    router.push("/quem-e-voce");
    router.refresh();
  }

  return (
    <header className="border-b border-zosa-border bg-white sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <Link href="/quadro" className="shrink-0">
          <Logo heightClassName="h-7" textClassName="text-base" />
        </Link>
        <nav className="flex items-center gap-1 overflow-x-auto">
          {NAV.map((item) => {
            const ativo = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  ativo
                    ? "bg-zosa-dark text-white"
                    : "text-zosa-muted hover:bg-zosa-cream hover:text-zosa-ink"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-3 shrink-0">
          <span
            className="hidden sm:inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold text-white"
            style={{ backgroundColor: profile.cor }}
            title={profile.nome}
          >
            {profile.nome.slice(0, 1).toUpperCase()}
          </span>
          <span className="hidden sm:block text-sm font-medium text-zosa-ink">
            {profile.nome}
          </span>
          <button onClick={trocarPessoa} className="btn-secondary">
            Trocar pessoa
          </button>
        </div>
      </div>
    </header>
  );
}
