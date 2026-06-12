import { prisma } from "@/lib/prisma";
import { updateUserBalance, gradeMarket } from "./actions";
import { ResetPasswordButton } from "./ResetPasswordButton";

export default async function UsersAdmin() {
  const users = await prisma.user.findMany({
    where: { isAdmin: false },
    include: {
      bets: {
        include: { legs: { include: { marketOutcome: { include: { market: { include: { match: true } } } } } } },
        orderBy: { createdAt: 'desc' }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const ungradedMarkets = await prisma.market.findMany({
    where: { status: "Open" },
    include: {
      match: true,
      outcomes: true
    },
    orderBy: { match: { startTime: 'asc' } }
  });

  return (
    <div className="space-y-12">

      {/* Grading Section */}
      <section>
        <h1 className="text-3xl font-bold text-white mb-6">Grading Dashboard</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {ungradedMarkets.length === 0 && <p className="text-zinc-500">No open markets to grade.</p>}
          {ungradedMarkets.map(market => (
            <div key={market.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <div className="text-sm text-zinc-400 mb-1">{market.match.name}</div>
              <h3 className="text-xl font-bold text-white mb-4">{market.name}</h3>

              <form action={gradeMarket.bind(null, market.id)} className="space-y-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Select Result:</label>
                  <select name="winningOutcomeId" className="w-full rounded bg-zinc-800 border-0 text-white p-2">
                    <option value="">Select Winning Outcome...</option>
                    {market.outcomes.map(o => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <input type="radio" id={`win-${market.id}`} name="gradeType" value="won" defaultChecked className="bg-zinc-800 border-zinc-700 text-green-500" />
                    <label htmlFor={`win-${market.id}`} className="text-sm text-white">Standard Grade</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="radio" id={`push-${market.id}`} name="gradeType" value="push" className="bg-zinc-800 border-zinc-700 text-yellow-500" />
                    <label htmlFor={`push-${market.id}`} className="text-sm text-white">Push (Refund / Void)</label>
                  </div>
                </div>

                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded py-2 text-sm font-medium">
                  Grade Market
                </button>
              </form>
            </div>
          ))}
        </div>
      </section>

      {/* Users Section */}
      <section>
        <h2 className="text-3xl font-bold text-white mb-6">User Management</h2>
        <div className="space-y-6">
          {users.length === 0 && <p className="text-zinc-500">No users registered yet.</p>}
          {users.map(user => (
            <div key={user.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <div className="flex justify-between items-start mb-6 pb-6 border-b border-zinc-800">
                <div>
                  <h3 className="text-2xl font-bold text-white">{user.username}</h3>
                  <div className="text-sm text-zinc-400 mt-1">Joined: {new Date(user.createdAt).toLocaleDateString()}</div>
                  <div className="mt-2">
                    <ResetPasswordButton userId={user.id} />
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm text-zinc-400 mb-1">Social Credit Capital</div>
                  <form action={updateUserBalance.bind(null, user.id)} className="flex items-center gap-2">
                    <input
                      type="number"
                      name="amount"
                      defaultValue={user.balance}
                      step="0.01"
                      className="w-32 rounded bg-zinc-800 border-0 py-1 px-2 text-white font-mono text-right focus:ring-1 focus:ring-green-500"
                    />
                    <button type="submit" className="bg-zinc-700 hover:bg-zinc-600 text-white px-3 py-1 rounded text-sm">
                      Update
                    </button>
                  </form>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-white mb-4">Bet History</h4>
                {user.bets.length === 0 ? (
                  <p className="text-sm text-zinc-500">No bets placed.</p>
                ) : (
                  <div className="space-y-4">
                    {user.bets.map(bet => (
                      <div key={bet.id} className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50">
                        <div className="flex justify-between items-center mb-3">
                          <div className="font-medium text-white">
                            {bet.legs.length > 1 ? `${bet.legs.length}-Leg Parlay` : 'Single Bet'}
                          </div>
                          <div className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                            bet.status === 'Won' ? 'bg-green-500/20 text-green-400' :
                            bet.status === 'Lost' ? 'bg-red-500/20 text-red-400' :
                            bet.status === 'Push' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-blue-500/20 text-blue-400'
                          }`}>
                            {bet.status}
                          </div>
                        </div>

                        <div className="space-y-2 mb-3">
                          {bet.legs.map(leg => (
                            <div key={leg.id} className="text-sm border-l-2 border-zinc-600 pl-3">
                              <div className="text-zinc-300">{leg.marketOutcome.name} <span className="text-zinc-500">({leg.marketOutcome.market.name})</span></div>
                              <div className="text-xs text-zinc-500">{leg.marketOutcome.market.match.name}</div>
                            </div>
                          ))}
                        </div>

                        <div className="flex justify-between text-sm pt-3 border-t border-zinc-700/50">
                          <span className="text-zinc-400">Risk: <span className="text-white">${bet.amount.toFixed(2)}</span></span>
                          <span className="text-zinc-400">To Win: <span className="text-green-400">${(bet.potentialWin - bet.amount).toFixed(2)}</span></span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
