import { prisma } from "@/lib/prisma";
import { updateMarketLimit, toggleMarketStatus } from "./actions";

export const dynamic = 'force-dynamic';

export default async function AlarmsAdmin() {
  const marketsWithLimits = await prisma.market.findMany({
    where: {
      status: "Open",
      totalLimit: { not: null }
    },
    include: {
      match: true,
      outcomes: {
        include: { betLegs: { include: { bet: true } } }
      }
    }
  });

  const alerts = [];

  for (const market of marketsWithLimits) {
    if (!market.totalLimit) continue;

    // Calculate total pool risk for this market
    let totalRisk = 0;
    for (const outcome of market.outcomes) {
      for (const leg of outcome.betLegs) {
         if (leg.bet.status === "Pending") {
            // Simplified total pool calculation: just sum the bet amounts
            totalRisk += leg.bet.amount;
         }
      }
    }

    if (totalRisk >= market.totalLimit) {
      alerts.push({ market, totalRisk });
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white mb-6">Market Alarms</h1>

      <p className="text-zinc-400 mb-8">
        Displays open markets that have reached or exceeded their configured Total Market Limit. You can suspend them to prevent further action.
      </p>

      {alerts.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
          <p className="text-zinc-500">No alarms triggered. All market limits are within boundaries.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map(({ market, totalRisk }) => (
            <div key={market.id} className="bg-red-950/30 border border-red-900/50 rounded-xl p-6 flex justify-between items-center shadow-[0_0_15px_rgba(239,68,68,0.1)]">
              <div>
                <div className="text-xs text-red-400 font-bold uppercase tracking-wider mb-1">Limit Reached</div>
                <h3 className="text-xl font-bold text-white">{market.name}</h3>
                <div className="text-sm text-zinc-400 mt-1">{market.match.name}</div>
                <div className="flex gap-4 mt-3">
                   <div className="text-sm">
                     <span className="text-zinc-500">Current Risk:</span> <span className="font-mono text-white font-bold">${totalRisk.toFixed(2)}</span>
                   </div>
                   <div className="text-sm">
                     <span className="text-zinc-500">Market Limit:</span> <span className="font-mono text-zinc-300">${market.totalLimit?.toFixed(2)}</span>
                   </div>
                </div>
              </div>
              <div className="flex flex-col gap-2 items-end">
                <form action={updateMarketLimit} className="flex gap-2">
                  <input type="hidden" name="marketId" value={market.id} />
                  <input type="number" step="0.01" name="totalLimit" defaultValue={market.totalLimit || ""} className="w-24 rounded bg-red-950 border border-red-800 text-white text-sm px-2 focus:ring-1 focus:ring-red-500 font-mono" placeholder="Limit" />
                  <button type="submit" className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs px-3 py-1 rounded transition">
                    Update Limit
                  </button>
                </form>
                <form action={toggleMarketStatus}>
                  <input type="hidden" name="marketId" value={market.id} />
                  <input type="hidden" name="status" value="Suspended" />
                  <button type="submit" className="bg-red-600 hover:bg-red-500 text-white font-bold px-6 py-2 rounded shadow-lg transition w-full">
                    Suspend Market
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
