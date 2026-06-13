import { prisma } from "@/lib/prisma";
import { MatchListFilter } from "@/components/MatchListFilter";

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
      <div className="flex items-center gap-4 mb-4">
        <h1 className="text-3xl font-black text-white">
          {searchParams.league ? 'League Matches' : 'Upcoming Matches'}
        </h1>
      </div>

      <MatchListFilter initialMatches={matches} />
    </div>
  );
}
