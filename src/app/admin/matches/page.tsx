import { prisma } from "@/lib/prisma";
import { createMatch, updateMatchStatus, deleteMatch, createMarket, createOutcome } from "../actions";

export default async function MatchesAdmin() {
  const leagues = await prisma.league.findMany({
    include: { sport: true },
    orderBy: { name: 'asc' }
  });

  const teams = await prisma.team.findMany({
    orderBy: { name: 'asc' }
  });

  const templates = await prisma.marketTemplate.findMany({
    orderBy: { name: 'asc' }
  });

  const matches = await prisma.match.findMany({
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

  const activeMatches = matches.filter(m => m.status !== "Completed");
  const completedMatches = matches.filter(m => m.status === "Completed");

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
                <option value="">Select home team...</option>
                {teams.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-zinc-400 mb-1">Away Team</label>
              <select name="awayTeamId" className="w-full rounded-md border-0 bg-zinc-800 py-2 px-3 text-white focus:ring-2 focus:ring-green-500">
                <option value="">Select away team...</option>
                {teams.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-zinc-400 mb-1">Fallback Match Name</label>
              <input type="text" name="name" placeholder="e.g. Special Event" className="w-full rounded-md border-0 bg-zinc-800 py-2 px-3 text-white focus:ring-2 focus:ring-green-500" />
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
        <h2 className="text-2xl font-bold text-white mb-4 border-b border-zinc-800 pb-2">Active Matches</h2>
        {activeMatches.length === 0 && <p className="text-zinc-500">No active matches.</p>}
        {activeMatches.map(match => (
          <div key={match.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="text-sm text-zinc-400 mb-1">{match.league.sport.name} &gt; {match.league.name}</div>
                <h3 className="text-2xl font-bold text-white">
                  {match.name || (match.homeTeam && match.awayTeam ? `${match.homeTeam.name} vs ${match.awayTeam.name}` : "Unknown Match")}
                </h3>
                <div className="text-sm text-zinc-400 mt-1">Starts: {new Date(match.startTime).toLocaleString()}</div>
                <div className="text-sm text-zinc-400">Status: <span className="text-green-400">{match.status}</span></div>
              </div>

              <div className="flex flex-col gap-2 items-end">
                <form action={updateMatchStatus.bind(null, match.id, "Completed", "")}>
                  <button type="submit" className="text-white hover:text-green-400 text-sm bg-green-600/20 hover:bg-green-600/40 px-3 py-1 rounded border border-green-500/50 transition">Mark Completed</button>
                </form>
                <form action={deleteMatch.bind(null, match.id)}>
                  <button type="submit" className="text-red-500 hover:text-red-400 text-sm bg-red-500/10 hover:bg-red-500/20 px-3 py-1 rounded transition mt-2">Delete Match</button>
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
                        <div key={outcome.id} className="flex justify-between text-sm bg-zinc-800 p-2 rounded">
                          <span className="text-zinc-300">{outcome.name}</span>
                          <span className="font-mono text-green-400">{outcome.oddsDecimal.toFixed(2)}</span>
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
              <div className="space-y-4 h-fit">
                {/* Standard Market Form */}
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
                    <button type="submit" className="w-full bg-zinc-700 hover:bg-zinc-600 text-white px-4 py-2 rounded-md text-sm font-medium">Add Market</button>
                  </form>
                </div>

                {/* Template Market Form */}
                <div className="bg-zinc-800/30 rounded-lg p-4 border border-blue-900/50">
                  <h4 className="text-md font-semibold text-white mb-4">Add from Template</h4>
                  {templates.length === 0 ? (
                    <p className="text-sm text-zinc-500">No templates available. Create one first.</p>
                  ) : (
                    <form action={createMarket} className="space-y-4">
                      <input type="hidden" name="matchId" value={match.id} />
                      <input type="hidden" name="isTemplate" value="true" />

                      <div>
                        <label className="block text-sm text-zinc-400 mb-1">Select Template</label>
                        <select name="templateId" required className="w-full rounded-md border-0 bg-zinc-900 py-2 px-3 text-white focus:ring-1 focus:ring-blue-500">
                          <option value="">Choose...</option>
                          {templates.map(t => (
                            <option key={t.id} value={t.id}>{t.name} ({t.type})</option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-sm text-zinc-400 mb-1">Line (e.g. -1.5)</label>
                          <input type="number" step="0.5" name="line" className="w-full rounded-md border-0 bg-zinc-900 py-2 px-3 text-white focus:ring-1 focus:ring-blue-500" />
                        </div>
                        <div>
                          <label className="block text-sm text-zinc-400 mb-1">Player (if prop)</label>
                          <input type="text" name="player" className="w-full rounded-md border-0 bg-zinc-900 py-2 px-3 text-white focus:ring-1 focus:ring-blue-500" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm text-zinc-400 mb-1">Base Odds (Decimal)</label>
                        <input type="number" step="0.01" name="baseOdds" defaultValue="1.90" className="w-full rounded-md border-0 bg-zinc-900 py-2 px-3 text-white focus:ring-1 focus:ring-blue-500" />
                      </div>

                      <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-md text-sm font-medium">Generate Market</button>
                    </form>
                  )}
                </div>
              </div>
            </div>

          </div>
        ))}

        <h2 className="text-2xl font-bold text-white mb-4 mt-12 border-b border-zinc-800 pb-2">Completed Matches</h2>
        {completedMatches.length === 0 && <p className="text-zinc-500">No completed matches.</p>}
        {completedMatches.map(match => (
          <div key={match.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 opacity-60">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-sm text-zinc-400 mb-1">{match.league.sport.name} &gt; {match.league.name}</div>
                <h3 className="text-2xl font-bold text-white mb-1">
                  {match.name || (match.homeTeam && match.awayTeam ? `${match.homeTeam.name} vs ${match.awayTeam.name}` : "Unknown Match")}
                </h3>
                <div className="text-sm text-zinc-400">Status: <span className="text-green-400">{match.status}</span></div>
              </div>

              <div className="flex flex-col gap-2 items-end">
                <form action={updateMatchStatus.bind(null, match.id, "Scheduled", "")}>
                  <button type="submit" className="text-white hover:text-zinc-300 text-sm bg-zinc-700 hover:bg-zinc-600 px-3 py-1 rounded transition">Mark Active</button>
                </form>
                <form action={deleteMatch.bind(null, match.id)}>
                  <button type="submit" className="text-red-500 hover:text-red-400 text-sm bg-red-500/10 hover:bg-red-500/20 px-3 py-1 rounded transition mt-2">Delete Match</button>
                </form>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
