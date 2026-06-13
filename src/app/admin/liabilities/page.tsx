import { prisma } from "@/lib/prisma";

export default async function LiabilitiesAdmin() {
  const openMarkets = await prisma.market.findMany({
    where: { status: "Open" },
    include: {
      match: { include: { league: { include: { sport: true } } } },
      outcomes: {
        include: {
          betLegs: {
            where: { bet: { status: "Pending" } },
            include: { bet: true }
          }
        }
      }
    },
    orderBy: { match: { startTime: 'asc' } }
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-6">Liabilities & Exposure</h1>
        <p className="text-zinc-400 mb-8">
          This page shows the total wagers and net profit/loss for each outcome if it wins.
          <br />
          <span className="text-green-400 font-semibold">Net Profit = (Total Market Wagers) - (Liability on Outcome)</span>
        </p>

        <div className="space-y-6">
          {openMarkets.length === 0 ? (
            <div className="text-center p-12 bg-zinc-900 border border-zinc-800 rounded-xl">
              <p className="text-zinc-500">No open markets found.</p>
            </div>
          ) : (
            openMarkets.map(market => {
              // Calculate total wagers placed across all outcomes in this market
              const totalMarketPool = market.outcomes.reduce((sum, outcome) => {
                const outcomeTotalWagered = outcome.betLegs.reduce((acc, leg) => acc + leg.bet.amount, 0);
                return sum + outcomeTotalWagered;
              }, 0);

              return (
                <div key={market.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                  <div className="mb-4">
                    <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">
                      {market.match.league.sport.name} &bull; {market.match.league.name}
                    </div>
                    <h3 className="text-xl font-bold text-white">{market.match.name}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-sm font-semibold text-zinc-300">{market.name} {market.type ? `(${market.type})` : ''}</span>
                    </div>
                    <div className="text-sm text-zinc-400 mt-2">
                      Total Market Wagers: <span className="font-mono text-white">${totalMarketPool.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-zinc-800">
                          <th className="py-3 px-4 font-medium text-zinc-400 text-sm">Outcome</th>
                          <th className="py-3 px-4 font-medium text-zinc-400 text-sm">Odds</th>
                          <th className="py-3 px-4 font-medium text-zinc-400 text-sm text-right">Total Wagered</th>
                          <th className="py-3 px-4 font-medium text-zinc-400 text-sm text-right">Liability (Payout)</th>
                          <th className="py-3 px-4 font-medium text-zinc-400 text-sm text-right">Net Book Profit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {market.outcomes.map(outcome => {
                          const totalWagered = outcome.betLegs.reduce((acc, leg) => acc + leg.bet.amount, 0);
                          const liability = outcome.betLegs.reduce((acc, leg) => acc + leg.bet.potentialWin, 0);
                          const netProfit = totalMarketPool - liability;

                          const isProfit = netProfit >= 0;

                          return (
                            <tr key={outcome.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                              <td className="py-3 px-4 text-sm text-zinc-300">{outcome.name}</td>
                              <td className="py-3 px-4 font-mono text-sm text-green-400">{outcome.oddsDecimal.toFixed(2)}</td>
                              <td className="py-3 px-4 font-mono text-sm text-white text-right">${totalWagered.toFixed(2)}</td>
                              <td className="py-3 px-4 font-mono text-sm text-red-400 text-right">${liability.toFixed(2)}</td>
                              <td className={`py-3 px-4 font-mono text-sm text-right font-bold ${isProfit ? 'text-green-500' : 'text-red-500'}`}>
                                {isProfit ? '+' : ''}${netProfit.toFixed(2)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
