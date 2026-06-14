import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatOdds } from "@/lib/utils";

export const revalidate = 0; // Disable static caching for stats

export default async function StatsAdmin({ searchParams }: { searchParams: { timeframe?: string } }) {
  const timeframe = searchParams.timeframe || 'all';

  let dateFilter = {};
  const now = new Date();

  if (timeframe === 'today') {
    const today = new Date(now.setHours(0, 0, 0, 0));
    dateFilter = { gte: today };
  } else if (timeframe === 'week') {
    const weekAgo = new Date(now.setDate(now.getDate() - 7));
    dateFilter = { gte: weekAgo };
  } else if (timeframe === 'month') {
    const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
    dateFilter = { gte: monthAgo };
  }

  // Fetch all graded bets
  const bets = await prisma.bet.findMany({
    where: {
      status: { not: "Pending" },
      createdAt: dateFilter
    },
    include: {
      user: true,
      legs: {
        include: {
          marketOutcome: {
            include: {
              market: {
                include: {
                  match: {
                    include: {
                      league: {
                        include: { sport: true }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  // Calculate Aggregates
  let totalHandle = 0;
  let totalPayout = 0;

  // Group by Sport -> League -> Match
  const sportsData: Record<string, any> = {};

  bets.forEach(bet => {
    totalHandle += bet.amount;

    let payout = 0;
    if (bet.status === "Won") payout = bet.potentialWin;
    if (bet.status === "Push") payout = bet.amount;
    if (bet.status === "Cashed Out") payout = bet.amount * 0.1;

    totalPayout += payout;

    // To prevent complex parlay logic breaking the tree, we assign the bet to the first leg's match
    if (bet.legs.length > 0) {
      const matchInfo = bet.legs[0].marketOutcome.market.match;
      const leagueInfo = matchInfo.league;
      const sportInfo = leagueInfo.sport;

      if (!sportsData[sportInfo.name]) sportsData[sportInfo.name] = { handle: 0, payout: 0, leagues: {} };
      sportsData[sportInfo.name].handle += bet.amount;
      sportsData[sportInfo.name].payout += payout;

      if (!sportsData[sportInfo.name].leagues[leagueInfo.name]) sportsData[sportInfo.name].leagues[leagueInfo.name] = { handle: 0, payout: 0, matches: {} };
      sportsData[sportInfo.name].leagues[leagueInfo.name].handle += bet.amount;
      sportsData[sportInfo.name].leagues[leagueInfo.name].payout += payout;

      if (!sportsData[sportInfo.name].leagues[leagueInfo.name].matches[matchInfo.name]) sportsData[sportInfo.name].leagues[leagueInfo.name].matches[matchInfo.name] = { handle: 0, payout: 0, tickets: [] };
      sportsData[sportInfo.name].leagues[leagueInfo.name].matches[matchInfo.name].handle += bet.amount;
      sportsData[sportInfo.name].leagues[leagueInfo.name].matches[matchInfo.name].payout += payout;

      // Store light ticket data
      sportsData[sportInfo.name].leagues[leagueInfo.name].matches[matchInfo.name].tickets.push({
        id: bet.id,
        user: bet.user.username,
        amount: bet.amount,
        payout,
        status: bet.status
      });
    }
  });

  const netProfit = totalHandle - totalPayout;
  const paybackPercentage = totalHandle > 0 ? (totalPayout / totalHandle) * 100 : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Stats & P&L</h1>
        <p className="text-zinc-400 mb-6">Financial performance and betting volume analysis.</p>

        {/* Timeframe Filters */}
        <div className="flex gap-2 mb-8">
          <Link href="/admin/stats?timeframe=today" className={`px-4 py-2 rounded-full text-sm font-bold ${timeframe === 'today' ? 'bg-green-500 text-black' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}>Today</Link>
          <Link href="/admin/stats?timeframe=week" className={`px-4 py-2 rounded-full text-sm font-bold ${timeframe === 'week' ? 'bg-green-500 text-black' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}>This Week</Link>
          <Link href="/admin/stats?timeframe=month" className={`px-4 py-2 rounded-full text-sm font-bold ${timeframe === 'month' ? 'bg-green-500 text-black' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}>This Month</Link>
          <Link href="/admin/stats?timeframe=all" className={`px-4 py-2 rounded-full text-sm font-bold ${timeframe === 'all' ? 'bg-green-500 text-black' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}>All Time</Link>
        </div>

        {/* Topline Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
            <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Total Handle (Volume)</div>
            <div className="text-2xl font-mono text-white">${totalHandle.toFixed(2)}</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
            <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Customer Payouts</div>
            <div className="text-2xl font-mono text-white">${totalPayout.toFixed(2)}</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
            <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Sportsbook Net Profit</div>
            <div className={`text-2xl font-mono ${netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              ${netProfit.toFixed(2)}
            </div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
            <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Payback %</div>
            <div className={`text-2xl font-mono ${paybackPercentage <= 100 ? 'text-green-400' : 'text-red-400'}`}>
              {paybackPercentage.toFixed(2)}%
            </div>
          </div>
        </div>

        {/* Drilldown View */}
        <h2 className="text-xl font-bold text-white mb-4">P&L by Event</h2>
        <div className="space-y-4">
          {Object.entries(sportsData).map(([sportName, sport]) => (
            <div key={sportName} className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
              <div className="bg-zinc-800/50 p-4 flex justify-between items-center font-bold text-white">
                <span>{sportName}</span>
                <div className="flex gap-8 text-sm font-mono">
                  <span className="text-zinc-400">Vol: ${(sport as any).handle.toFixed(2)}</span>
                  <span className={(sport as any).handle - (sport as any).payout >= 0 ? 'text-green-400' : 'text-red-400'}>
                    Net: ${((sport as any).handle - (sport as any).payout).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="p-4 space-y-4">
                {Object.entries((sport as any).leagues).map(([leagueName, league]) => (
                  <div key={leagueName} className="border border-zinc-800 rounded">
                    <div className="bg-zinc-900/80 p-3 flex justify-between items-center text-sm font-semibold text-zinc-200">
                      <span>{leagueName}</span>
                      <div className="flex gap-6 font-mono text-xs">
                        <span className="text-zinc-500">Vol: ${(league as any).handle.toFixed(2)}</span>
                        <span className={(league as any).handle - (league as any).payout >= 0 ? 'text-green-500' : 'text-red-500'}>
                          Net: ${((league as any).handle - (league as any).payout).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="p-2 space-y-2 bg-black/20">
                      {Object.entries((league as any).matches).map(([matchName, matchData]) => (
                        <details key={matchName} className="group bg-zinc-950 border border-zinc-800 rounded overflow-hidden">
                          <summary className="p-3 text-sm text-zinc-300 cursor-pointer hover:bg-zinc-900 flex justify-between items-center">
                            <span>{matchName}</span>
                            <div className="flex items-center gap-4">
                              <span className="text-xs text-zinc-500">{(matchData as any).tickets.length} tickets</span>
                              <span className={`text-xs font-mono ${(matchData as any).handle - (matchData as any).payout >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                Net: ${((matchData as any).handle - (matchData as any).payout).toFixed(2)}
                              </span>
                              <span className="text-zinc-500 group-open:rotate-180 transition-transform">▼</span>
                            </div>
                          </summary>
                          <div className="p-3 bg-zinc-900 border-t border-zinc-800">
                            <table className="w-full text-xs text-left text-zinc-400">
                              <thead className="uppercase border-b border-zinc-800">
                                <tr>
                                  <th className="pb-2">Ticket ID</th>
                                  <th className="pb-2">User</th>
                                  <th className="pb-2 text-right">Risk</th>
                                  <th className="pb-2 text-right">Payout</th>
                                  <th className="pb-2 text-right">Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(matchData as any).tickets.map((t: any) => (
                                  <tr key={t.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/50">
                                    <td className="py-2 font-mono">#{t.id.slice(0, 8).toUpperCase()}</td>
                                    <td className="py-2">{t.user}</td>
                                    <td className="py-2 text-right font-mono">${t.amount.toFixed(2)}</td>
                                    <td className="py-2 text-right font-mono text-white">${t.payout.toFixed(2)}</td>
                                    <td className={`py-2 text-right font-bold ${t.status === 'Won' ? 'text-green-500' : t.status === 'Lost' ? 'text-red-500' : 'text-zinc-500'}`}>
                                      {t.status}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </details>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}