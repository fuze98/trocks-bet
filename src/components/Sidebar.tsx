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
    <div className="w-64 bg-zinc-900 border-r border-zinc-800 hidden md:flex flex-col h-[calc(100vh-64px)] sticky top-16 overflow-y-auto">
      <div className="p-4">
        <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4 px-2">Sports</h2>
        <nav className="space-y-1">
          <Link
            href="/"
            className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              pathname === "/" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
            }`}
          >
            All Matches
          </Link>

          {sports.map(sport => (
            <div key={sport.id} className="pt-2">
              <div className="px-3 py-1 text-sm font-semibold text-zinc-300">
                {sport.name}
              </div>
              {sport.leagues.map(league => (
                <Link
                  key={league.id}
                  href={`/?league=${league.id}`}
                  className={`block pl-6 pr-3 py-1.5 text-sm transition-colors ${
                    pathname === `/?league=${league.id}` ? "text-green-400" : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {league.name}
                </Link>
              ))}
            </div>
          ))}
        </nav>
      </div>
    </div>
  );
}
