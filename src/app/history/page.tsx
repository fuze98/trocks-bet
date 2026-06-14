"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { formatOdds } from "@/lib/utils";
import { useBetSlip } from "@/store/useBetSlip";
import { toast } from "react-hot-toast";

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

  if (error) {
    return (
      <div className="p-4 sm:p-8 max-w-4xl mx-auto">
        <div className="bg-red-500/10 text-red-500 p-4 rounded-lg border border-red-500/20">
          {error}
        </div>
      </div>
    );
  }

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
                    <span>{new Date(bet.createdAt).toLocaleString()}</span>
                    <span className="bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded text-[10px] font-mono">
                      #{bet.id.slice(0, 8).toUpperCase()}
                    </span>
                  </div>
                  <div className="font-bold text-white uppercase text-sm tracking-wider">
                    {bet.legs.length === 1 ? 'Single Bet' : `${bet.legs.length}-Leg Parlay`}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {bet.status === 'Pending' && (
                    <button
                      onClick={async () => {
                        const confirmCashout = confirm(`Are you sure you want to cashout? Due to algorithmic adjustments, we can offer you $${(bet.amount * 0.1).toFixed(2)} for this ticket.`);
                        if (!confirmCashout) return;

                        try {
                          const res = await fetch('/api/bets/cashout', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ betId: bet.id })
                          });
                          const data = await res.json();
                          if (data.success) {
                            toast.success(`Cashed out for $${data.cashoutAmount.toFixed(2)}`);
                            setBets(bets.map(b => b.id === bet.id ? { ...b, status: 'Cashed Out' } : b));
                          } else {
                            toast.error(data.error);
                          }
                        } catch (error) {
                          toast.error('Cashout failed');
                        }
                      }}
                      className="px-3 py-1 bg-green-500/10 hover:bg-green-500/20 text-green-500 border border-green-500/20 rounded-full text-xs font-bold uppercase tracking-wider transition-colors"
                    >
                      Cashout ${(bet.amount * 0.1).toFixed(2)}
                    </button>
                  )}
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
                     bet.status === 'Push' ? `$${bet.amount.toFixed(2)}` :
                     bet.status === 'Cashed Out' ? `$${(bet.amount * 0.1).toFixed(2)}` :
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
