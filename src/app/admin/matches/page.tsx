import { prisma } from "@/lib/prisma";
import { createMatch, updateMatchStatus, deleteMatch, createMarket, createOutcome } from "../actions";
import { AddMarketFromTemplate } from "@/components/AddMarketFromTemplate";

export default async function MatchesAdmin({ searchParams }: { searchParams: { tab?: string } }) {
  const activeTab = searchParams.tab || "active";

  const leagues = await prisma.league.findMany({
    include: {
      sport: true,
      teams: { orderBy: { name: 'asc' } }
    },
    orderBy: { name: 'asc' }
  });

  const matches = await prisma.match.findMany({
    where: {
      status: activeTab === "completed" ? "Completed" : { not: "Completed" }
    },
    include: {
      league: { include: { sport: true } },
      homeTeam: true,
      awayTeam: true,
      markets: {
        include: { outcomes: true }
      }
    },
    orderBy: { startTime: 'desc' }
  });

  const templates = await prisma.marketTemplate.findMany({
    orderBy: { name: 'asc' }
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
              <label className="block text-sm font-medium text-zinc-400 mb-1">Home Team</label>
              <select name="homeTeamId" className="w-full rounded-md border-0 bg-zinc-800 py-2 px-3 text-white focus:ring-2 focus:ring-green-500">
                <option value="">Select (optional)...</option>
                {leagues.flatMap(l => l.teams).map(t => (
                  <option key={`h-${t.id}`} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-zinc-400 mb-1">Away Team</label>
              <select name="awayTeamId" className="w-full rounded-md border-0 bg-zinc-800 py-2 px-3 text-white focus:ring-2 focus:ring-green-500">
                <option value="">Select (optional)...</option>
                {leagues.flatMap(l => l.teams).map(t => (
                  <option key={`a-${t.id}`} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-zinc-400 mb-1">Custom Name (if no teams)</label>
              <input type="text" name="customName" placeholder="e.g. Winner of Tournament" className="w-full rounded-md border-0 bg-zinc-800 py-2 px-3 text-white focus:ring-2 focus:ring-green-500" />
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

      <div className="flex gap-4 border-b border-zinc-800 pb-4 mb-6">
        <a href="/admin/matches?tab=active" className={`px-4 py-2 rounded-full text-sm font-bold ${activeTab !== "completed" ? "bg-green-500 text-black" : "bg-zinc-800 text-zinc-400 hover:text-white"}`}>Active Matches</a>
        <a href="/admin/matches?tab=completed" className={`px-4 py-2 rounded-full text-sm font-bold ${activeTab === "completed" ? "bg-green-500 text-black" : "bg-zinc-800 text-zinc-400 hover:text-white"}`}>Completed</a>
      </div>

      <div className="space-y-6">
        {matches.map(match => (
          <div key={match.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="text-sm text-zinc-400 mb-1">{match.league.sport.name} &gt; {match.league.name}</div>
                <h3 className="text-2xl font-bold text-white">{match.name}</h3>
                <div className="text-sm text-zinc-400 mt-2 mb-1 flex items-center gap-2">
                  <span>Starts:</span>
                  <form action={async (formData) => {
                    "use server";
                    const { updateMatchStartTime } = await import('../actions');
                    await updateMatchStartTime(match.id, formData.get("startTime") as string);
                  }} className="flex items-center gap-2">
                    <input
                      type="datetime-local"
                      name="startTime"
                      defaultValue={new Date(match.startTime.getTime() - match.startTime.getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
                      className="rounded border border-zinc-700 bg-zinc-800 py-1 px-2 text-xs text-white focus:ring-1 focus:ring-green-500"
                    />
                    <button type="submit" className="bg-zinc-700 hover:bg-zinc-600 px-2 py-1 rounded text-xs">Save</button>
                  </form>
                </div>
                <div className="text-sm text-zinc-400">Status: <span className="text-green-400">{match.status}</span></div>
              </div>

              <div className="flex gap-2 items-start">
                <form action={async () => {
                  "use server";
                  const { updateMatchStatus } = await import('../actions');
                  await updateMatchStatus(match.id, match.status === "Completed" ? "Scheduled" : "Completed");
                }}>
                  <button type="submit" className="text-zinc-300 hover:text-white text-sm bg-zinc-700 hover:bg-zinc-600 px-3 py-1 rounded transition-colors mr-2">
                    {match.status === "Completed" ? "Mark Active" : "Mark Completed"}
                  </button>
                </form>
                 <form action={deleteMatch.bind(null, match.id)}>
                  <button type="submit" className="text-red-500 hover:text-red-400 text-sm bg-red-500/10 px-3 py-1 rounded transition-colors">Delete Match</button>
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
                        <div key={outcome.id} className="flex justify-between items-center text-sm bg-zinc-800 p-2 rounded">
                          <span className="text-zinc-300 flex-1">{outcome.name}</span>
                          <form action={async (formData) => {
                            "use server";
                            const { updateOutcomeOdds } = await import('../actions');
                            await updateOutcomeOdds(outcome.id, formData.get("odds") as string);
                          }} className="flex items-center gap-2">
                            <input
                              type="number"
                              step="0.01"
                              name="odds"
                              defaultValue={outcome.oddsDecimal}
                              className="w-20 rounded border border-zinc-700 bg-zinc-900 py-1 px-2 text-sm text-green-400 font-mono text-right focus:ring-1 focus:ring-green-500"
                            />
                            <button type="submit" className="bg-zinc-700 hover:bg-zinc-600 px-2 py-1 rounded text-xs">Save</button>
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

              {/* Add Market Forms */}
              <div className="space-y-4 h-fit">

                {/* Add from Template */}
                <div className="bg-zinc-800/30 rounded-lg p-4 border border-zinc-800">
                  <h4 className="text-md font-semibold text-white mb-4">Add Market From Template</h4>
                  <AddMarketFromTemplate templates={templates} match={match} />
                </div>

                {/* Add Custom Market Form */}
                <div className="bg-zinc-800/30 rounded-lg p-4 border border-zinc-800">
                  <h4 className="text-md font-semibold text-white mb-4">Add Custom Market</h4>
                  <form action={createMarket} className="space-y-4">
                    <input type="hidden" name="matchId" value={match.id} />
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">Market Name (e.g. Moneyline)</label>
                      <input type="text" name="name" required className="w-full rounded-md border-0 bg-zinc-900 py-2 px-3 text-white focus:ring-1 focus:ring-green-500" />
                    </div>
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">Market Type Grouping</label>
                      <select name="type" className="w-full rounded-md border-0 bg-zinc-900 py-2 px-3 text-white focus:ring-1 focus:ring-green-500">
                        <option value="">None (Uses name)</option>
                        <option value="Moneyline">Moneyline</option>
                        <option value="Spread">Spread</option>
                        <option value="Total (Over/Under)">Total (Over/Under)</option>
                        <option value="Props">Props</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id={`singles-${match.id}`} name="allowOnlySingles" className="rounded bg-zinc-900 border-zinc-700 text-green-500 focus:ring-green-500" />
                      <label htmlFor={`singles-${match.id}`} className="text-sm text-zinc-300">Allow only singles (no parlays)</label>
                    </div>
                    <button type="submit" className="w-full bg-zinc-700 hover:bg-zinc-600 text-white px-4 py-2 rounded-md text-sm font-medium">Add Custom Market</button>
                  </form>
                </div>
              </div>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}
