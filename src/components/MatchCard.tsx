"use client";

import { formatOdds } from "@/lib/utils";
import { useBetSlip } from "@/store/useBetSlip";
import { Clock } from "lucide-react";

type Outcome = {
  id: string;
  name: string;
  oddsDecimal: number;
  status: string;
};

type Market = {
  id: string;
  name: string;
  allowOnlySingles: boolean;
  status: string;
  outcomes: Outcome[];
};

type MatchCardProps = {
  match: {
    id: string;
    name: string;
    startTime: Date;
    status: string;
    league: { name: string; sport: { name: string } };
    markets: Market[];
  };
};

export function MatchCard({ match }: MatchCardProps) {
  const { legs, addLeg, removeLeg, oddsFormat } = useBetSlip();

  const isStarted = new Date() >= new Date(match.startTime) || match.status !== "Scheduled";

  // UX Enhancement: Highlight if starting within 24 hours
  const hoursUntilStart = (new Date(match.startTime).getTime() - new Date().getTime()) / (1000 * 60 * 60);
  const isStartingSoon = !isStarted && hoursUntilStart > 0 && hoursUntilStart <= 24;

  const getOutcomeLegId = (outcomeId: string) => legs.find(l => l.id === outcomeId)?.id;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 sm:p-6 hover:border-zinc-700 transition">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1 flex items-center gap-2">
            {match.league.sport.name} &bull; {match.league.name}
            {isStartingSoon && (
              <span className="flex items-center gap-1 text-[10px] bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded">
                <Clock className="w-3 h-3" /> Starting Soon
              </span>
            )}
          </div>
          <h3 className="text-xl font-bold text-white">{match.name}</h3>
          <div className="text-sm text-zinc-400 mt-1">
            {new Date(match.startTime).toLocaleString()}
          </div>
        </div>
        <div className={`px-2 py-1 rounded text-xs font-bold uppercase ${
          isStarted ? 'bg-red-500/20 text-red-500' : 'bg-zinc-800 text-zinc-300'
        }`}>
          {isStarted ? match.status : 'Scheduled'}
        </div>
      </div>

      <div className="space-y-4 mt-6">
        {match.markets.filter(m => m.status === "Open").map(market => {
          // Sort outcomes by decimal odds ascending
          const sortedOutcomes = [...market.outcomes].sort((a, b) => a.oddsDecimal - b.oddsDecimal);

          return (
            <div key={market.id}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-semibold text-zinc-300">{market.name}</span>
                {market.allowOnlySingles && (
                  <span className="text-[10px] bg-yellow-500/20 text-yellow-500 px-1.5 py-0.5 rounded uppercase">Singles Only</span>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {sortedOutcomes.map(outcome => {
                  const isSelected = getOutcomeLegId(outcome.id);

                  return (
                    <button
                      key={outcome.id}
                      disabled={isStarted || outcome.status !== "Pending"}
                      onClick={() => {
                        if (isSelected) {
                          removeLeg(outcome.id);
                        } else {
                          addLeg({
                            id: outcome.id,
                            matchId: match.id,
                            matchName: match.name,
                            marketName: market.name,
                            outcomeName: outcome.name,
                            oddsDecimal: outcome.oddsDecimal,
                            allowOnlySingles: market.allowOnlySingles
                          });
                        }
                      }}
                      className={`flex flex-col items-center justify-center p-3 rounded-lg border transition ${
                        isSelected
                          ? 'bg-green-600/20 border-green-500 text-white'
                          : 'bg-zinc-800 border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <span className="text-sm text-center mb-1 line-clamp-1">{outcome.name}</span>
                      <span className={`font-mono font-bold ${isSelected ? 'text-green-400' : ''}`}>
                        {formatOdds(outcome.oddsDecimal, oddsFormat)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
        {match.markets.filter(m => m.status === "Open").length === 0 && (
          <p className="text-sm text-zinc-500">No open markets currently available.</p>
        )}
      </div>
    </div>
  );
}
