"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { formatOdds } from "@/lib/utils";
import { useBetSlip } from "@/store/useBetSlip";
import toast from "react-hot-toast";

type BetHistory = {
  id: string;
  amount: number;
  totalOdds: number;
  potentialWin: number;
  status: string;
  createdAt: string;
  legs: {
    id: string;
    oddsDecimal: number;
    status: string;
    marketOutcome: {
      name: string;
      market: {
        name: string;
        match: {
          name: string;
          league: {
            name: string;
            sport: {
              name: string;
            }
          }
        }
      }
    }
  }[];
};

export default function HistoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { oddsFormat } = useBetSlip();

  const [bets, setBets] = useState<BetHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetch("/api/bets/history")
        .then(res => res.json())
        .then(data => {
          if (data.error) setError(data.error);
          else setBets(data.bets || []);
        })
        .catch(() => setError("Failed to load history"))
        .finally(() => setLoading(false));
    }
  }, [status, router]);

  if (status === "loading" || loading) {
    return (
      <div className="p-4 sm:p-8 max-w-4xl mx-auto flex justify-center items-center h-64">
        <div className="text-zinc-500">Loading history...</div>
      </div>
    );
  }

  const handleCashout = async (betId: string, amount: number) => {
    try {
      const res = await fetch("/api/bets/cashout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ betId })
      });
      const data = await res.json();

      if (res.ok) {
        setBets(bets.map(b => b.id === betId ? { ...b, status: "Cashed Out", potentialWin: data.cashoutAmount } : b));
        toast.success(`You successfully cashed out for $${data.cashoutAmount.toFixed(2)} (10% of your wager). Sucker!`, { duration: 5000 });
      } else {
        toast.error(data.error);
      }
    } catch (e) {
      toast.error("Failed to cashout");
    }
  };

  if (error) {
    return (
      <div className="p-4 sm:p-8 max-w-4xl mx-auto">
        <div className="bg-red-500/10 text-red-500 p-4 rounded-lg border border-red-500/20">
          {error}
        </div>
      </div>
    );
  }

  // Short ID helper
  const getShortId = (id: string) => `#B-${id.substring(id.length - 4).toUpperCase()}`;

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-black text-white mb-8">My Bets</h1>

      {bets.length === 0 ? (
        <div className="text-center p-12 bg-zinc-900 border border-zinc-800 rounded-xl">
          <p className="text-zinc-400">You have no betting history.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {bets.map(bet => (
            <div key={bet.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition">
              {/* Header */}
              <div className="p-4 border-b border-zinc-800 bg-zinc-950/50 flex justify-between items-center">
                <div>
                  <div className="text-xs text-zinc-500 mb-1 flex items-center gap-2">
                    <span className="font-mono text-zinc-400">{getShortId(bet.id)}</span>
                    <span>&bull;</span>
                    <span>{new Date(bet.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="font-bold text-white uppercase text-sm tracking-wider flex items-center gap-4">
                    {bet.legs.length === 1 ? 'Single Bet' : `${bet.legs.length}-Leg Parlay`}
                    {bet.status === 'Pending' && (
                      <button
                        onClick={() => handleCashout(bet.id, bet.amount)}
                        className="text-xs bg-green-600 hover:bg-green-500 text-white px-2 py-1 rounded transition ml-4"
                      >
                        Cashout ${(bet.amount * 0.10).toFixed(2)}
                      </button>
                    )}
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  bet.status === 'Won' ? 'bg-green-500/20 text-green-500' :
                  bet.status === 'Lost' ? 'bg-red-500/20 text-red-500' :
                  bet.status === 'Push' ? 'bg-zinc-500/20 text-zinc-400' :
                  bet.status === 'Cashed Out' ? 'bg-blue-500/20 text-blue-400' :
                  'bg-yellow-500/20 text-yellow-500'
                }`}>
                  {bet.status}
                </div>
              </div>

              {/* Legs */}
              <div className="p-4 space-y-4">
                {bet.legs.map(leg => (
                  <div key={leg.id} className="relative pl-4 border-l-2 border-zinc-800">
                    <div className="text-xs text-zinc-500 mb-1">
                      {leg.marketOutcome.market.match.league.sport.name} &bull; {leg.marketOutcome.market.match.league.name}
                    </div>
                    <div className="text-sm text-zinc-400 mb-1">
                      {leg.marketOutcome.market.match.name}
                    </div>
                    <div className="font-bold text-white flex justify-between items-end">
                      <span>{leg.marketOutcome.name}</span>
                      <span className="font-mono text-green-400">{formatOdds(leg.oddsDecimal, oddsFormat)}</span>
                    </div>
                    <div className="text-xs text-zinc-500 flex justify-between items-center mt-1">
                      <span>{leg.marketOutcome.market.name}</span>
                      <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                        leg.status === 'Won' ? 'bg-green-500/20 text-green-500' :
                        leg.status === 'Lost' ? 'bg-red-500/20 text-red-500' :
                        leg.status === 'Push' ? 'bg-zinc-500/20 text-zinc-400' :
                        'text-zinc-600'
                      }`}>
                        {leg.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-zinc-800 bg-zinc-950/50 flex flex-wrap gap-4 sm:gap-8 justify-between sm:justify-start">
                <div>
                  <div className="text-xs text-zinc-500 mb-1">Total Odds</div>
                  <div className="font-mono font-bold text-white">{formatOdds(bet.totalOdds, oddsFormat)}</div>
                </div>
                <div>
                  <div className="text-xs text-zinc-500 mb-1">Wager</div>
                  <div className="font-mono font-bold text-white">${bet.amount.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-xs text-zinc-500 mb-1">To Win</div>
                  <div className="font-mono font-bold text-green-400">
                    ${(bet.potentialWin - bet.amount).toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-zinc-500 mb-1">Payout</div>
                  <div className="font-mono font-bold text-white">
                    {bet.status === 'Won' ? `$${bet.potentialWin.toFixed(2)}` :
                     bet.status === 'Cashed Out' ? `$${bet.potentialWin.toFixed(2)}` :
                     bet.status === 'Push' ? `$${bet.amount.toFixed(2)}` :
                     bet.status === 'Lost' ? '$0.00' :
                     '-'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
