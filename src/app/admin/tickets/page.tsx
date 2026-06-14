import { prisma } from "@/lib/prisma";
import { formatOdds } from "@/lib/utils";

export const revalidate = 5; // Real-time feel, refresh often

export default async function LiveTicketsAdmin() {
  const bets = await prisma.bet.findMany({
    where: { status: "Pending" },
    include: {
      user: true,
      legs: {
        include: {
          marketOutcome: {
            include: {
              market: {
                include: {
                  match: {
                    include: { league: { include: { sport: true } } }
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

  const getShortId = (id: string) => `#B-${id.substring(id.length - 4).toUpperCase()}`;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white mb-6">Live Ticket Feed (Pending Only)</h1>

      {bets.length === 0 ? (
        <p className="text-zinc-500">No pending tickets.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bets.map(bet => (
            <div key={bet.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-lg flex flex-col">
              <div className="flex justify-between items-center mb-3 border-b border-zinc-800 pb-3">
                <div>
                  <div className="font-bold text-white">{bet.user.username}</div>
                  <div className="text-xs text-zinc-500">{new Date(bet.createdAt).toLocaleString()}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-zinc-500 font-mono">{getShortId(bet.id)}</div>
                  <div className="text-xs font-bold uppercase text-blue-400 bg-blue-500/10 px-2 py-1 rounded">
                    {bet.legs.length === 1 ? 'Straight' : `${bet.legs.length}-Leg Parlay`}
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-3 mb-4">
                {bet.legs.map(leg => (
                  <div key={leg.id} className="text-sm pl-3 border-l-2 border-zinc-700">
                    <div className="text-white font-semibold flex justify-between">
                      <span>{leg.marketOutcome.name}</span>
                      <span className="text-green-400">{formatOdds(leg.oddsDecimal, 'decimal')}</span>
                    </div>
                    <div className="text-xs text-zinc-500">{leg.marketOutcome.market.name}</div>
                    <div className="text-[10px] text-zinc-600 line-clamp-1">
                      {leg.marketOutcome.market.match.name}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-sm pt-3 border-t border-zinc-800 bg-zinc-950/30 -mx-4 -mb-4 p-3 rounded-b-xl">
                <div>
                  <div className="text-xs text-zinc-500">Risk</div>
                  <div className="font-mono text-white">${bet.amount.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-xs text-zinc-500">Total Odds</div>
                  <div className="font-mono text-white">{formatOdds(bet.totalOdds, 'decimal')}</div>
                </div>
                <div>
                  <div className="text-xs text-zinc-500">To Win</div>
                  <div className="font-mono text-green-400">${(bet.potentialWin - bet.amount).toFixed(2)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
