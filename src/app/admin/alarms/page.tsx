import { prisma } from "@/lib/prisma";

export const revalidate = 0;

export default async function AlarmsAdmin() {
  const suspendedMarkets = await prisma.market.findMany({
    where: { status: "Suspended" },
    include: {
      match: true,
      outcomes: true
    }
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-6">Market Alarms</h1>
        <p className="text-zinc-400 mb-8">
          Review suspended markets that have exceeded their total limits.
        </p>

        <div className="space-y-6">
          {suspendedMarkets.length === 0 ? (
            <div className="text-center p-12 bg-zinc-900 border border-zinc-800 rounded-xl">
              <p className="text-zinc-500">No active alarms. All systems normal.</p>
            </div>
          ) : (
            suspendedMarkets.map(market => (
              <div key={market.id} className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 shadow-xl">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <div className="text-sm text-red-400 font-bold uppercase tracking-wider mb-1">Suspended Market</div>
                    <h3 className="text-xl font-bold text-white">{market.match.name} - {market.name}</h3>
                    <div className="text-sm text-zinc-400 mt-2">
                      Total Limit: ${market.totalLimit?.toFixed(2) || 'None'}
                    </div>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  {market.outcomes.map(outcome => (
                    <div key={outcome.id} className="flex justify-between items-center bg-zinc-900/50 p-3 rounded-lg border border-red-500/10">
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
                          className="w-20 rounded border border-zinc-700 bg-zinc-950 py-1 px-2 text-sm text-green-400 font-mono text-right focus:ring-1 focus:ring-green-500"
                        />
                        <button type="submit" className="bg-zinc-800 hover:bg-zinc-700 px-3 py-1 rounded text-xs">Save Odds</button>
                      </form>
                    </div>
                  ))}
                </div>

                <form action={async (formData) => {
                  "use server";
                  const { updateMarketLimitsAndReopen } = await import('../actions');
                  await updateMarketLimitsAndReopen(
                    market.id,
                    formData.get("userLimit") as string,
                    formData.get("totalLimit") as string
                  );
                }} className="bg-zinc-950 p-4 rounded-lg border border-zinc-800 flex flex-wrap gap-4 items-end">
                  <div className="flex-1 min-w-[150px]">
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">New User Limit</label>
                    <input
                      type="number"
                      step="0.01"
                      name="userLimit"
                      defaultValue={market.userLimit || ""}
                      className="w-full rounded border border-zinc-700 bg-zinc-900 py-2 px-3 text-sm text-white focus:ring-1 focus:ring-green-500"
                    />
                  </div>
                  <div className="flex-1 min-w-[150px]">
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">New Total Limit</label>
                    <input
                      type="number"
                      step="0.01"
                      name="totalLimit"
                      defaultValue={market.totalLimit || ""}
                      className="w-full rounded border border-zinc-700 bg-zinc-900 py-2 px-3 text-sm text-white focus:ring-1 focus:ring-green-500"
                    />
                  </div>
                  <button type="submit" className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-6 rounded transition-colors h-[38px]">
                    Re-Open Market
                  </button>
                </form>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
