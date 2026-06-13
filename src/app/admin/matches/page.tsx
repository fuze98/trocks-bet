import { prisma } from "@/lib/prisma";
import { createMatch, updateMatchStatus, deleteMatch, createMarket, createOutcome, updateMatchStartTime, updateOutcomeOdds } from "../actions";

export default async function MatchesAdmin() {
  const leagues = await prisma.league.findMany({
    include: { sport: true },
    orderBy: { name: 'asc' }
  });

  const matches = await prisma.match.findMany({
    include: {
      league: { include: { sport: true } },
      markets: {
        include: { outcomes: true }
      }
    },
    orderBy: { startTime: 'desc' }
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-6">Matches & Markets</h1>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Add New Match</h2>
          <form action={createMatch} className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-zinc-400 mb-1">League</label>
              <select name="leagueId" required className="w-full rounded-md border-0 bg-zinc-800 py-2 px-3 text-white focus:ring-2 focus:ring-green-500">
                <option value="">Select a league...</option>
                {leagues.map(l => (
                  <option key={l.id} value={l.id}>{l.sport.name} - {l.name}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-zinc-400 mb-1">Match Name (e.g. Team A vs Team B)</label>
              <input type="text" name="name" required className="w-full rounded-md border-0 bg-zinc-800 py-2 px-3 text-white focus:ring-2 focus:ring-green-500" />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-zinc-400 mb-1">Start Time</label>
              <input type="datetime-local" name="startTime" required className="w-full rounded-md border-0 bg-zinc-800 py-2 px-3 text-white focus:ring-2 focus:ring-green-500" />
            </div>
            <button type="submit" className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-md font-medium h-[40px]">
              Create Match
            </button>
          </form>
        </div>
      </div>

      <div className="space-y-6">
        {matches.map(match => (
          <div key={match.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="text-sm text-zinc-400 mb-1">{match.league.sport.name} &gt; {match.league.name}</div>
                <h3 className="text-2xl font-bold text-white">{match.name}</h3>

                {/* Editable Start Time */}
                <form action={async (formData: FormData) => {
                  "use server";
                  await updateMatchStartTime(match.id, formData.get("startTime") as string);
                }} className="flex items-center gap-2 mt-2">
                  <label className="text-sm text-zinc-400">Starts:</label>
                  <input
                    type="datetime-local"
                    name="startTime"
                    defaultValue={new Date(match.startTime.getTime() - match.startTime.getTimezoneOffset() * 60000).toISOString().slice(0,16)}
                    required
                    className="rounded border-0 bg-zinc-800 py-1 px-2 text-sm text-white focus:ring-1 focus:ring-green-500"
                  />
                  <button type="submit" className="bg-zinc-700 hover:bg-zinc-600 text-white px-2 py-1 rounded text-xs">Update Time</button>
                </form>

                <div className="text-sm text-zinc-400 mt-2">Status: <span className="text-green-400">{match.status}</span></div>
              </div>

              <div className="flex gap-2">
                 <form action={deleteMatch.bind(null, match.id)}>
                  <button type="submit" className="text-red-500 hover:text-red-400 text-sm bg-red-500/10 px-3 py-1 rounded">Delete Match</button>
                </form>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Markets List */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-white border-b border-zinc-800 pb-2">Markets</h4>
                {match.markets.length === 0 && <p className="text-zinc-500 text-sm">No markets created yet.</p>}

                {match.markets.map(market => (
                  <div key={market.id} className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50">
                    <div className="flex justify-between items-center mb-2">
                      <div className="font-medium text-white">{market.name}</div>
                      {market.allowOnlySingles && <span className="text-xs bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded">Singles Only</span>}
                    </div>

                    <div className="space-y-2 mb-4">
                      {market.outcomes.map(outcome => (
                        <div key={outcome.id} className="flex flex-col sm:flex-row sm:items-center justify-between text-sm bg-zinc-800 p-2 rounded gap-2">
                          <span className="text-zinc-300 font-medium">{outcome.name}</span>

                          {/* Editable Odds */}
                          <form action={async (formData: FormData) => {
                            "use server";
                            await updateOutcomeOdds(outcome.id, parseFloat(formData.get("odds") as string));
                          }} className="flex gap-2 items-center">
                            <input
                              type="number"
                              step="0.01"
                              name="odds"
                              defaultValue={outcome.oddsDecimal}
                              required
                              className="w-20 rounded border-0 bg-zinc-900 py-1 px-2 text-sm text-green-400 font-mono text-right focus:ring-1 focus:ring-green-500"
                            />
                            <button type="submit" className="bg-zinc-700 hover:bg-zinc-600 text-white px-2 py-1 rounded text-xs">Update Odds</button>
                          </form>
                        </div>
                      ))}
                    </div>

                    <form action={createOutcome} className="flex gap-2">
                      <input type="hidden" name="marketId" value={market.id} />
                      <input type="text" name="name" placeholder="Outcome (e.g. Over 2.5)" required className="flex-1 rounded border-0 bg-zinc-900 py-1 px-2 text-sm text-white focus:ring-1 focus:ring-green-500" />
                      <input type="number" step="0.01" name="odds" placeholder="Odds" required className="w-20 rounded border-0 bg-zinc-900 py-1 px-2 text-sm text-white focus:ring-1 focus:ring-green-500" />
                      <button type="submit" className="bg-zinc-700 hover:bg-zinc-600 text-white px-2 py-1 rounded text-sm">+</button>
                    </form>
                  </div>
                ))}
              </div>

              {/* Add Market Form */}
              <div className="bg-zinc-800/30 rounded-lg p-4 border border-zinc-800 h-fit">
                <h4 className="text-md font-semibold text-white mb-4">Add Market</h4>
                <form action={createMarket} className="space-y-4">
                  <input type="hidden" name="matchId" value={match.id} />
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Market Name (e.g. Moneyline)</label>
                    <input type="text" name="name" required className="w-full rounded-md border-0 bg-zinc-900 py-2 px-3 text-white focus:ring-1 focus:ring-green-500" />
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id={`singles-${match.id}`} name="allowOnlySingles" className="rounded bg-zinc-900 border-zinc-700 text-green-500 focus:ring-green-500" />
                    <label htmlFor={`singles-${match.id}`} className="text-sm text-zinc-300">Allow only singles (no parlays)</label>
                  </div>
                  <button type="submit" className="w-full bg-zinc-700 hover:bg-zinc-600 text-white px-4 py-2 rounded-md text-sm font-medium">Add Market</button>
                </form>
              </div>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}
