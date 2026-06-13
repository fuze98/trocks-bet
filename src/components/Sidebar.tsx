"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Sport = {
  id: string;
  name: string;
  leagues: { id: string; name: string }[];
};

export function Sidebar({ sports }: { sports: Sport[] }) {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-zinc-950/50 backdrop-blur-md border-r border-zinc-800/50 hidden md:flex flex-col h-[calc(100vh-64px)] sticky top-16 overflow-y-auto shadow-[4px_0_24px_-12px_rgba(0,0,0,0.5)]">
      <div className="p-6">
        <h2 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4 px-2">Sports</h2>
        <nav className="space-y-2">
          <Link
            href="/"
            className={`block px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${
              pathname === "/"
                ? "bg-green-500/10 text-green-400 border border-green-500/20 shadow-sm"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800/50 border border-transparent"
            }`}
          >
            All Matches
          </Link>

          {sports.map(sport => (
            <div key={sport.id} className="pt-4">
              <div className="px-4 py-1 text-xs font-black text-zinc-300 uppercase tracking-wide">
                {sport.name}
              </div>
              <div className="mt-1 space-y-1">
                {sport.leagues.map(league => (
                  <Link
                    key={league.id}
                    href={`/?league=${league.id}`}
                    className={`block pl-8 pr-4 py-2 text-sm font-medium rounded-lg transition-all ${
                      pathname === `/?league=${league.id}`
                        ? "text-green-400 bg-green-500/5 border border-green-500/10"
                        : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/30 border border-transparent"
                    }`}
                  >
                    {league.name}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </div>
    </div>
  );
}
