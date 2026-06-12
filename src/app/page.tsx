import { prisma } from "@/lib/prisma";
import { MatchCard } from "@/components/MatchCard";

export const revalidate = 60; // revalidate every minute

export default async function Home({
  searchParams,
}: {
  searchParams: { league?: string }
}) {
  const whereClause = searchParams.league ? { leagueId: searchParams.league } : {};

  const matches = await prisma.match.findMany({
    where: {
      ...whereClause,
      // Status not completed to keep history clean,
      // but showing in-progress matches is standard so users can see score/status
      status: { not: "Completed" }
    },
    include: {
      league: { include: { sport: true } },
      markets: {
        where: { status: "Open" },
        include: { outcomes: { where: { status: "Pending" } } }
      }
    },
    orderBy: { startTime: 'asc' }
  });

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-8">
        <h1 className="text-3xl font-black text-white">
          {searchParams.league ? 'League Matches' : 'Upcoming Matches'}
        </h1>
      </div>

      {matches.length === 0 ? (
        <div className="text-center p-12 bg-zinc-900 border border-zinc-800 rounded-xl">
          <p className="text-zinc-400">No upcoming matches found.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {matches.map(match => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      )}
    </div>
  );
}
