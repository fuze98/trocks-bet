"use client";

import { useState } from "react";
import { MatchCard } from "./MatchCard";
import { Search } from "lucide-react";

type Match = any; // Assuming we pass down the prisma payload

export function MatchListFilter({ initialMatches }: { initialMatches: Match[] }) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredMatches = initialMatches.filter((match) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      match.name.toLowerCase().includes(term) ||
      match.league.name.toLowerCase().includes(term) ||
      match.league.sport.name.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" />
        <input
          type="text"
          placeholder="Search teams, sports, or leagues..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-4 pl-12 pr-4 text-white focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition shadow-sm"
        />
      </div>

      {filteredMatches.length === 0 ? (
        <div className="text-center p-12 bg-zinc-900 border border-zinc-800 rounded-xl">
          <p className="text-zinc-400">No matches found matching your search.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredMatches.map(match => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      )}
    </div>
  );
}
