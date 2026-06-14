"use client";

import { formatOdds } from "@/lib/utils";
import { useBetSlip } from "@/store/useBetSlip";

type Outcome = {
  id: string;
  name: string;
  oddsDecimal: number;
  status: string;
};

type Market = {
  id: string;
  name: string;
  type: string | null;
  allowOnlySingles: boolean;
  status: string;
  outcomes: Outcome[];
};

type MatchCardProps = {
  match: {
    id: string;
    name: string | null;
    homeTeam?: { name: string } | null;
    awayTeam?: { name: string } | null;
    startTime: Date;
    status: string;
    league: { name: string; sport: { name: string } };
    markets: Market[];
  };
};

import { motion } from "framer-motion";

export function MatchCard({ match }: MatchCardProps) {
  const matchName = match.name || (match.homeTeam && match.awayTeam ? `${match.homeTeam.name} vs ${match.awayTeam.name}` : "Unknown Match");
  const { legs, addLeg, removeLeg, oddsFormat } = useBetSlip();

  const isStarted = new Date() >= new Date(match.startTime) || match.status !== "Scheduled";

  const getOutcomeLegId = (outcomeId: string) => legs.find(l => l.id === outcomeId)?.id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.2 }}
      className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 sm:p-6 hover:border-zinc-700 transition-colors shadow-lg"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">
            {match.league.sport.name} &bull; {match.league.name}
          </div>
          <h3 className="text-xl font-bold text-white">{matchName}</h3>
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

      <div className="space-y-6 mt-6">
        {(() => {
          const openMarkets = match.markets.filter((m) => m.status === "Open");
          if (openMarkets.length === 0) {
            return <p className="text-sm text-zinc-500">No open markets currently available.</p>;
          }

          // Group markets by type
          const groupedMarkets = openMarkets.reduce((acc, market) => {
            const groupKey = market.type || market.name; // fallback to name if type is missing
            if (!acc[groupKey]) {
              acc[groupKey] = [];
            }
            acc[groupKey].push(market);
            return acc;
          }, {} as Record<string, typeof openMarkets>);

          return Object.entries(groupedMarkets).map(([groupName, markets]) => (
            <div key={groupName} className="space-y-4 border border-zinc-800 rounded-lg p-4 bg-zinc-900/50">
              <h4 className="text-md font-bold text-white border-b border-zinc-800 pb-2">{groupName}</h4>
              <div className="space-y-4">
                {markets.map((market) => (
                  <div key={market.id}>
                    {/* Only show market name if it's different from the group name or if there are multiple markets in the group */}
                    {(markets.length > 1 || market.name !== groupName) && (
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-semibold text-zinc-300">{market.name}</span>
                        {market.allowOnlySingles && (
                          <span className="text-[10px] bg-yellow-500/20 text-yellow-500 px-1.5 py-0.5 rounded uppercase">
                            Singles Only
                          </span>
                        )}
                      </div>
                    )}
                    {markets.length === 1 && market.name === groupName && market.allowOnlySingles && (
                      <div className="mb-2">
                        <span className="text-[10px] bg-yellow-500/20 text-yellow-500 px-1.5 py-0.5 rounded uppercase">
                          Singles Only
                        </span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {market.outcomes
                        .slice()
                        .sort((a, b) => {
                          if (a.oddsDecimal === b.oddsDecimal) {
                            return a.name.localeCompare(b.name);
                          }
                          return a.oddsDecimal - b.oddsDecimal;
                        })
                        .map((outcome) => {
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
                                    matchName: matchName,
                                    marketName: market.name,
                                    outcomeName: outcome.name,
                                    oddsDecimal: outcome.oddsDecimal,
                                    allowOnlySingles: market.allowOnlySingles,
                                  });
                                }
                              }}
                              className={`flex flex-col items-center justify-center p-3 rounded-lg border transition ${
                                isSelected
                                  ? "bg-green-600/20 border-green-500 text-white"
                                  : "bg-zinc-800 border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white"
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                              <span className="text-sm text-center mb-1 line-clamp-1">{outcome.name}</span>
                              <span className={`font-mono font-bold ${isSelected ? "text-green-400" : ""}`}>
                                {formatOdds(outcome.oddsDecimal, oddsFormat)}
                              </span>
                            </button>
                          );
                        })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ));
        })()}
      </div>
    </motion.div>
  );
}
