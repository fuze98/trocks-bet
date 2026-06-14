import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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

  async function suspendMarket(formData: FormData) {
    "use server";
    const marketId = formData.get("marketId") as string;
    if (!marketId) return;

    await prisma.market.update({
      where: { id: marketId },
      data: { status: "Suspended" }
    });
    revalidatePath("/admin/alarms");
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
              <form action={suspendMarket}>
                <input type="hidden" name="marketId" value={market.id} />
                <button type="submit" className="bg-red-600 hover:bg-red-500 text-white font-bold px-6 py-3 rounded shadow-lg transition">
                  Suspend Market
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
