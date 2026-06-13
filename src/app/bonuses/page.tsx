import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Gift, Calendar } from "lucide-react";
import { format } from "date-fns";

export default async function BonusesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const userId = (session.user as any).id;

  const bonuses = await prisma.bonus.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-black italic uppercase text-white mb-2 flex items-center gap-2">
          <Gift className="w-8 h-8 text-green-500" />
          My Bonuses
        </h1>
        <p className="text-zinc-400">View all the exclusive non-monetary prizes you&apos;ve won from the Daily Spin.</p>
      </div>

      {bonuses.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 text-center">
          <Gift className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No bonuses yet</h3>
          <p className="text-zinc-500">Go spin the wheel for your chance to win exclusive prizes!</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {bonuses.map((bonus) => (
            <div key={bonus.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 hover:border-green-500/50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-green-500/10 rounded-lg text-green-500">
                    <Gift className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white">{bonus.description}</h3>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-zinc-500 mt-4">
                <Calendar className="w-4 h-4" />
                <span>Won on {format(bonus.createdAt, "MMM d, yyyy h:mm a")}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}