import { prisma } from "@/lib/prisma";

export default async function LiabilitiesAdmin() {
  // Fetch all pending bets with their legs and outcome info
  const pendingBets = await prisma.bet.findMany({
    where: { status: "Pending" },
    include: {
      legs: {
        include: {
          marketOutcome: {
            include: {
              market: {
                include: {
                  match: {
                    include: {
                      league: { include: { sport: true } }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  // Calculate liabilities per outcome
  // We'll map Outcome ID -> { outcomeName, marketName, matchName, totalWagered, totalLiability }
  const liabilityMap: Record<string, {
    outcomeName: string;
    marketName: string;
    matchName: string;
    leagueName: string;
    totalWagered: number;
    totalLiability: number; // Potential win if this outcome hits
  }> = {};

  for (const bet of pendingBets) {
    for (const leg of bet.legs) {
      const outcome = leg.marketOutcome;
      if (!liabilityMap[outcome.id]) {
        liabilityMap[outcome.id] = {
          outcomeName: outcome.name,
          marketName: outcome.market.name,
          matchName: outcome.market.match.name,
          leagueName: outcome.market.match.league.name,
          totalWagered: 0,
          totalLiability: 0,
        };
      }

      // If it's a parlay, the wager/liability attribution is complex.
      // For simplicity, we attribute the full bet amount and full potential win to EVERY leg in the parlay.
      // This represents the "worst case" exposure if that specific outcome wins and the rest of the parlay hits.
      liabilityMap[outcome.id].totalWagered += bet.amount;
      liabilityMap[outcome.id].totalLiability += bet.potentialWin;
    }
  }

  // Sort by highest liability
  const sortedLiabilities = Object.values(liabilityMap).sort((a, b) => b.totalLiability - a.totalLiability);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Liabilities & Exposure</h1>
        <p className="text-zinc-400">Track total wagers and potential payouts across all pending bets.</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/50">
                <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Match</th>
                <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Market</th>
                <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Outcome</th>
                <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-right">Total Wagered</th>
                <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-right">Exposure (Payout)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {sortedLiabilities.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-zinc-500">
                    No pending bets found.
                  </td>
                </tr>
              ) : (
                sortedLiabilities.map((item, idx) => (
                  <tr key={idx} className="hover:bg-zinc-800/20 transition">
                    <td className="p-4">
                      <div className="text-xs text-zinc-500">{item.leagueName}</div>
                      <div className="text-sm font-medium text-white">{item.matchName}</div>
                    </td>
                    <td className="p-4 text-sm text-zinc-300">{item.marketName}</td>
                    <td className="p-4">
                      <span className="bg-zinc-800 text-zinc-200 px-2 py-1 rounded text-sm font-semibold">
                        {item.outcomeName}
                      </span>
                    </td>
                    <td className="p-4 text-right font-mono text-white">
                      ${item.totalWagered.toFixed(2)}
                    </td>
                    <td className="p-4 text-right font-mono font-bold text-red-400">
                      ${item.totalLiability.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="text-xs text-zinc-500 mt-4">
        * Note: For parlay bets, the full wager and potential payout are attributed to every individual leg to show maximum possible exposure if that specific leg wins.
      </div>
    </div>
  );
}
