import { prisma } from "@/lib/prisma";

export default async function CustomersAdminPage() {
  const users = await prisma.user.findMany({
    where: { isAdmin: false },
    include: {
      bets: true,
      bonuses: true
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white mb-6">Customer Overview</h1>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-zinc-400 uppercase bg-zinc-950/50">
            <tr>
              <th className="px-4 py-3">Username</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3 text-right">Balance</th>
              <th className="px-4 py-3 text-right">Limit Multiplier</th>
              <th className="px-4 py-3 text-center">Total Bets</th>
              <th className="px-4 py-3 text-center">Total Bonuses</th>
              <th className="px-4 py-3 text-right">Total Wagered</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-zinc-500">No customers found.</td>
              </tr>
            ) : (
              users.map(user => {
                const totalWagered = user.bets.reduce((sum, bet) => sum + bet.amount, 0);
                return (
                  <tr key={user.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                    <td className="px-4 py-3 font-bold text-white">{user.username}</td>
                    <td className="px-4 py-3 text-zinc-400">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right font-mono text-green-400">${user.balance.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-mono text-zinc-300">{user.limitMultiplier.toFixed(2)}x</td>
                    <td className="px-4 py-3 text-center text-zinc-300">{user.bets.length}</td>
                    <td className="px-4 py-3 text-center text-zinc-300">{user.bonuses.length}</td>
                    <td className="px-4 py-3 text-right font-mono text-zinc-300">${totalWagered.toFixed(2)}</td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
