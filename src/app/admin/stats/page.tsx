import { prisma } from "@/lib/prisma";
import { Suspense } from "react";

export const dynamic = 'force-dynamic';

export default async function StatsPage({
  searchParams,
}: {
  searchParams: { range?: string };
}) {
  const range = searchParams.range || "all";

  let dateFilter = {};
  const now = new Date();
  if (range === "today") {
    const today = new Date(now.setHours(0,0,0,0));
    dateFilter = { createdAt: { gte: today } };
  } else if (range === "week") {
    const lastWeek = new Date(now.setDate(now.getDate() - 7));
    dateFilter = { createdAt: { gte: lastWeek } };
  } else if (range === "month") {
    const lastMonth = new Date(now.setMonth(now.getMonth() - 1));
    dateFilter = { createdAt: { gte: lastMonth } };
  }

  const bets = await prisma.bet.findMany({
    where: { ...dateFilter },
    include: {
      user: true,
      legs: { include: { marketOutcome: { include: { market: { include: { match: { include: { league: { include: { sport: true } } } } } } } } } }
    }
  });

  const totalHandle = bets.reduce((acc, bet) => acc + bet.amount, 0);
  const totalPayouts = bets.reduce((acc, bet) => acc + (bet.status === "Won" || bet.status === "Cashed Out" ? bet.potentialWin : bet.status === "Push" ? bet.amount : 0), 0);
  const netProfit = totalHandle - totalPayouts;
  const paybackPercent = totalHandle > 0 ? (totalPayouts / totalHandle) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Stats & P&L</h1>
        <div className="flex gap-2">
          {["today", "week", "month", "all"].map(r => (
            <a key={r} href={`/admin/stats?range=${r}`} className={`px-3 py-1 rounded text-sm capitalize ${range === r ? 'bg-green-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}>
              {r}
            </a>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="text-sm text-zinc-500 mb-1">Total Handle (Volume)</div>
          <div className="text-2xl font-mono font-bold text-white">${totalHandle.toFixed(2)}</div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="text-sm text-zinc-500 mb-1">Total Payouts</div>
          <div className="text-2xl font-mono font-bold text-red-400">${totalPayouts.toFixed(2)}</div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="text-sm text-zinc-500 mb-1">Net Book Profit</div>
          <div className={`text-2xl font-mono font-bold ${netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {netProfit >= 0 ? '+' : ''}${netProfit.toFixed(2)}
          </div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="text-sm text-zinc-500 mb-1">Payback %</div>
          <div className="text-2xl font-mono font-bold text-white">{paybackPercent.toFixed(1)}%</div>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">Recent Graded Bets</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-zinc-400 uppercase bg-zinc-950/50">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Risk</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Profit/Loss</th>
              </tr>
            </thead>
            <tbody>
              {bets.filter(b => b.status !== "Pending").slice(0, 50).map(bet => {
                const isLossForBook = bet.status === "Won" || bet.status === "Cashed Out";
                const bookPnL = isLossForBook ? bet.amount - bet.potentialWin : bet.status === "Lost" ? bet.amount : 0;
                return (
                  <tr key={bet.id} className="border-b border-zinc-800 hover:bg-zinc-800/50">
                    <td className="px-4 py-3 text-zinc-300">{new Date(bet.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 font-medium text-white">{bet.user.username}</td>
                    <td className="px-4 py-3 text-zinc-400">{bet.legs.length === 1 ? 'Straight' : 'Parlay'}</td>
                    <td className="px-4 py-3 font-mono">${bet.amount.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs uppercase font-bold ${
                        bet.status === 'Won' ? 'text-green-500 bg-green-500/10' :
                        bet.status === 'Lost' ? 'text-red-500 bg-red-500/10' :
                        'text-zinc-400 bg-zinc-500/10'
                      }`}>{bet.status}</span>
                    </td>
                    <td className={`px-4 py-3 font-mono font-bold ${bookPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {bookPnL >= 0 ? '+' : ''}{bookPnL.toFixed(2)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
