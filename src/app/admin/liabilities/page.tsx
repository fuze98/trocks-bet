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

  // To calculate Net Profit, we need to know the total wagers per MARKET.
  // Then for each outcome in that market, Net Profit = (Total Market Wagers) - (Outcome Liability)
  const marketWagersMap: Record<string, number> = {};

  // First pass: Calculate total wagered per market
  for (const bet of pendingBets) {
    for (const leg of bet.legs) {
      const marketId = leg.marketOutcome.marketId;
      if (!marketWagersMap[marketId]) {
        marketWagersMap[marketId] = 0;
      }
      marketWagersMap[marketId] += bet.amount;
    }
  }

  // Second pass: Build liability and profit per outcome
  const liabilityMap: Record<string, {
    outcomeName: string;
    marketName: string;
    marketId: string;
    matchName: string;
    leagueName: string;
    totalWageredOnOutcome: number;
    totalLiability: number;
  }> = {};

  for (const bet of pendingBets) {
    for (const leg of bet.legs) {
      const outcome = leg.marketOutcome;
      if (!liabilityMap[outcome.id]) {
        liabilityMap[outcome.id] = {
          outcomeName: outcome.name,
          marketName: outcome.market.name,
          marketId: outcome.marketId,
          matchName: outcome.market.match.name,
          leagueName: outcome.market.match.league.name,
          totalWageredOnOutcome: 0,
          totalLiability: 0,
        };
      }

      liabilityMap[outcome.id].totalWageredOnOutcome += bet.amount;
      liabilityMap[outcome.id].totalLiability += bet.potentialWin;
    }
  }

  // Calculate Net Profit and Sort
  const sortedLiabilities = Object.values(liabilityMap).map(item => {
    const totalMarketWagers = marketWagersMap[item.marketId] || 0;
    // Net Profit = All money wagered on this entire market - The payout if this specific outcome hits
    const netProfit = totalMarketWagers - item.totalLiability;
    return { ...item, totalMarketWagers, netProfit };
  }).sort((a, b) => a.netProfit - b.netProfit); // Sort by lowest net profit first (highest risk)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Liabilities & Exposure</h1>
        <p className="text-zinc-400">Track total wagers, potential payouts, and net profit for each possible outcome.</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/50">
                <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Match & Market</th>
                <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Outcome</th>
                <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-right">Total Market Pool</th>
                <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-right">Outcome Wagers</th>
                <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-right">Exposure (Payout)</th>
                <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-right">Net Book Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {sortedLiabilities.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-zinc-500">
                    No pending bets found.
                  </td>
                </tr>
              ) : (
                sortedLiabilities.map((item, idx) => (
                  <tr key={idx} className="hover:bg-zinc-800/20 transition">
                    <td className="p-4">
                      <div className="text-xs text-zinc-500">{item.leagueName}</div>
                      <div className="text-sm font-medium text-white">{item.matchName}</div>
                      <div className="text-xs text-zinc-400 mt-0.5">{item.marketName}</div>
                    </td>
                    <td className="p-4">
                      <span className="bg-zinc-800 text-zinc-200 px-2 py-1 rounded text-sm font-semibold">
                        {item.outcomeName}
                      </span>
                    </td>
                    <td className="p-4 text-right font-mono text-zinc-400">
                      ${item.totalMarketWagers.toFixed(2)}
                    </td>
                    <td className="p-4 text-right font-mono text-white">
                      ${item.totalWageredOnOutcome.toFixed(2)}
                    </td>
                    <td className="p-4 text-right font-mono font-bold text-zinc-300">
                      ${item.totalLiability.toFixed(2)}
                    </td>
                    <td className={`p-4 text-right font-mono font-bold ${item.netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {item.netProfit >= 0 ? '+' : '-'}${Math.abs(item.netProfit).toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="text-xs text-zinc-500 mt-4 max-w-3xl leading-relaxed">
        <strong>* Note on Parlays:</strong> For simplicity, parlay wager amounts and potential payouts are attributed fully to every individual leg within the parlay. <br/>
        <strong>* Net Book Profit</strong> is calculated as: <code>(Total Money Wagered on the Entire Market) - (Potential Payout if this Outcome Wins)</code>. A green number means the sportsbook profits if this outcome hits. A red number means the sportsbook loses money.
      </div>
    </div>
  );
}
