import { prisma } from "@/lib/prisma";
import { formatOdds } from "@/lib/utils";

export const revalidate = 0; // Disable static caching for live ticker feed

export default async function TicketsAdmin() {
  const bets = await prisma.bet.findMany({
    include: {
      user: true,
      legs: {
        include: {
          marketOutcome: {
            include: {
              market: {
                include: { match: true }
              }
            }
          }
        }
      }
    },
    orderBy: { createdAt: "desc" },
    take: 100 // Show latest 100 tickets
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-6">Live Ticket Feed</h1>
        <p className="text-zinc-400 mb-8">
          Real-time feed of all incoming bets across the platform.
        </p>

        <div className="space-y-4">
          {bets.length === 0 ? (
            <div className="text-center p-12 bg-zinc-900 border border-zinc-800 rounded-xl">
              <p className="text-zinc-500">No tickets found.</p>
            </div>
          ) : (
            bets.map(bet => (
              <div key={bet.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 sm:p-6 shadow-xl flex flex-col md:flex-row gap-6">

                {/* Customer Info Column */}
                <div className="md:w-1/4 border-b md:border-b-0 md:border-r border-zinc-800 pb-4 md:pb-0 pr-4">
                  <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Customer</div>
                  <div className="font-bold text-lg text-white mb-1">{bet.user.username}</div>
                  <div className="text-sm font-mono text-green-400 mb-2">Balance: ${bet.user.balance.toFixed(2)}</div>
                  <div className="text-xs text-zinc-500">Limit Multiplier: {bet.user.limitMultiplier}x</div>
                  <div className="text-xs text-zinc-500 mt-4">Placed: {new Date(bet.createdAt).toLocaleString()}</div>
                </div>

                {/* Bet Details Column */}
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div className="font-bold text-white uppercase tracking-wider text-sm">
                      {bet.legs.length > 1 ? `${bet.legs.length}-Leg Parlay` : 'Single Bet'}
                    </div>
                    <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                      bet.status === 'Won' ? 'bg-green-500/20 text-green-400' :
                      bet.status === 'Lost' ? 'bg-red-500/20 text-red-400' :
                      bet.status === 'Push' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {bet.status}
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    {bet.legs.map(leg => (
                      <div key={leg.id} className="bg-zinc-950 rounded-lg p-3 border border-zinc-800">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-sm font-bold text-zinc-200">{leg.marketOutcome.name}</span>
                          <span className="font-mono text-green-400 text-sm font-bold">{leg.oddsDecimal.toFixed(2)}</span>
                        </div>
                        <div className="text-xs text-zinc-400">{leg.marketOutcome.market.name}</div>
                        <div className="text-xs text-zinc-500 mt-1">{leg.marketOutcome.market.match.name}</div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-end pt-4 border-t border-zinc-800">
                    <div>
                      <div className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Risk Amount</div>
                      <div className="font-mono text-lg font-bold text-white">${bet.amount.toFixed(2)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Potential Payout</div>
                      <div className="font-mono text-xl font-bold text-green-400">${bet.potentialWin.toFixed(2)}</div>
                    </div>
                  </div>
                </div>

              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
