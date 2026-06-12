import { prisma } from "@/lib/prisma";
import { createSport, deleteSport, createLeague, deleteLeague } from "../actions";

export default async function SportsAdmin() {
  const sports = await prisma.sport.findMany({
    include: { leagues: true },
    orderBy: { name: 'asc' }
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-6">Sports & Leagues</h1>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Add New Sport</h2>
          <form action={createSport} className="flex gap-4">
            <input
              type="text"
              name="name"
              placeholder="Sport Name (e.g., Football)"
              required
              className="flex-1 rounded-md border-0 bg-zinc-800 py-2 px-4 text-white placeholder-zinc-400 focus:ring-2 focus:ring-green-500"
            />
            <button type="submit" className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-md font-medium">
              Add Sport
            </button>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sports.map(sport => (
          <div key={sport.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-zinc-800">
              <h3 className="text-2xl font-bold text-white">{sport.name}</h3>
              <form action={deleteSport.bind(null, sport.id)}>
                <button type="submit" className="text-red-500 hover:text-red-400 text-sm">Delete</button>
              </form>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Leagues</h4>

              {sport.leagues.length === 0 ? (
                <p className="text-sm text-zinc-500">No leagues yet.</p>
              ) : (
                <ul className="space-y-2">
                  {sport.leagues.map(league => (
                    <li key={league.id} className="flex justify-between items-center bg-zinc-800 px-3 py-2 rounded-md">
                      <span className="text-zinc-200">{league.name}</span>
                      <form action={deleteLeague.bind(null, league.id)}>
                        <button type="submit" className="text-red-500 hover:text-red-400 text-xs">Remove</button>
                      </form>
                    </li>
                  ))}
                </ul>
              )}

              <form action={createLeague} className="flex gap-2 mt-4 pt-4 border-t border-zinc-800/50">
                <input type="hidden" name="sportId" value={sport.id} />
                <input
                  type="text"
                  name="name"
                  placeholder="New League"
                  required
                  className="flex-1 rounded-md border-0 bg-zinc-800 py-1 px-3 text-sm text-white placeholder-zinc-400 focus:ring-1 focus:ring-green-500"
                />
                <button type="submit" className="bg-zinc-700 hover:bg-zinc-600 text-white px-3 py-1 rounded-md text-sm">
                  Add
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
