import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function BonusesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const bonuses = await prisma.bonus.findMany({
    where: { userId: (session.user as any).id },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-8">
        <h1 className="text-3xl font-black text-white">
          My Bonuses & Prizes
        </h1>
      </div>

      {bonuses.length === 0 ? (
        <div className="text-center p-12 bg-zinc-900 border border-zinc-800 rounded-xl">
          <p className="text-zinc-400">You haven&apos;t won any bonuses yet. Go spin the wheel!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bonuses.map(bonus => (
            <div key={bonus.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex justify-between items-center hover:border-zinc-700 transition">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">{bonus.description}</h3>
                <p className="text-sm text-zinc-500">Won on: {new Date(bonus.createdAt).toLocaleDateString()}</p>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                bonus.status === 'Active' ? 'bg-green-500/20 text-green-400' : 'bg-zinc-800 text-zinc-500'
              }`}>
                {bonus.status}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
