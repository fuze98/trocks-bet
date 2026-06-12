"use client";

import { useBetSlip } from "@/store/useBetSlip";
import { formatOdds } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp, ChevronDown, Trash2 } from "lucide-react";

export function BetSlip() {
  const { legs, riskAmount, oddsFormat, removeLeg, clearSlip, setRiskAmount } = useBetSlip();
  const { data: session } = useSession();
  const [isPlacing, setIsPlacing] = useState(false);
  const [error, setError] = useState("");
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);
  const router = useRouter();

  // Validate parlay limits
  const hasSinglesOnly = legs.some(l => l.allowOnlySingles);
  const isInvalidParlay = legs.length > 1 && hasSinglesOnly;

  // Calculate Odds
  let totalDecimalOdds = 1;
  legs.forEach(leg => {
    totalDecimalOdds *= leg.oddsDecimal;
  });

  const potentialWin = riskAmount * totalDecimalOdds;

  const handlePlaceBet = async () => {
    if (!session) {
      router.push("/login");
      return;
    }
    if (legs.length === 0 || riskAmount <= 0) return;

    setIsPlacing(true);
    setError("");

    try {
      const res = await fetch("/api/bets/place", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          legs: legs.map(l => l.id),
          amount: riskAmount,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to place bet");
      } else {
        clearSlip();
        setIsMobileExpanded(false);
        // Refresh to update balance and ui
        window.location.reload();
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setIsPlacing(false);
    }
  };

  const betSlipContentJSX = (
    <>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isInvalidParlay && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded">
            One or more selections are restricted to singles only. Please remove them to place a parlay.
          </div>
        )}

        {legs.map(leg => (
          <div key={leg.id} className="bg-zinc-800 rounded-lg p-3 relative group border border-transparent hover:border-zinc-700">
            <button
              onClick={() => removeLeg(leg.id)}
              className="absolute top-2 right-2 text-zinc-500 hover:text-zinc-300 transition-opacity p-1"
            >
              <Trash2 size={14} />
            </button>
            <div className="text-xs text-zinc-400 mb-1 line-clamp-1 pr-6">{leg.matchName}</div>
            <div className="font-bold text-white mb-1">{leg.outcomeName}</div>
            <div className="flex justify-between items-end">
              <div className="text-xs text-zinc-500">{leg.marketName}</div>
              <div className="font-mono text-green-400 font-bold">{formatOdds(leg.oddsDecimal, oddsFormat)}</div>
            </div>
            {leg.allowOnlySingles && (
              <div className="mt-2 text-[10px] text-yellow-500 uppercase tracking-wider">Singles Only</div>
            )}
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-zinc-800 bg-zinc-950/50 shrink-0">
        <div className="flex justify-between text-sm mb-4">
          <span className="text-zinc-400">Total Odds</span>
          <span className="font-mono text-white font-bold">{formatOdds(totalDecimalOdds, oddsFormat)}</span>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <label className="text-sm text-zinc-400">Risk</label>
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">$</span>
            <input
              type="number"
              value={riskAmount || ''}
              onChange={(e) => setRiskAmount(parseFloat(e.target.value) || 0)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded py-2 pl-7 pr-3 text-white focus:ring-1 focus:ring-green-500 focus:border-green-500 outline-none font-mono"
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="flex justify-between text-sm mb-6">
          <span className="text-zinc-400">To Win</span>
          <span className="font-mono text-green-400 font-bold">
            ${riskAmount > 0 ? (potentialWin - riskAmount).toFixed(2) : '0.00'}
          </span>
        </div>

        {error && <div className="text-red-400 text-xs mb-3 text-center">{error}</div>}

        <button
          onClick={handlePlaceBet}
          disabled={isPlacing || isInvalidParlay || riskAmount <= 0}
          className="w-full bg-green-600 hover:bg-green-500 disabled:bg-zinc-700 disabled:text-zinc-500 disabled:cursor-not-allowed text-white font-bold py-3 rounded uppercase tracking-wider text-sm transition"
        >
          {isPlacing ? "Placing Bet..." : "Place Bet"}
        </button>
      </div>
    </>
  );

  // Desktop empty state
  if (legs.length === 0) {
    return (
      <div className="w-80 bg-zinc-900 border-l border-zinc-800 flex-col hidden lg:flex h-[calc(100vh-64px)] sticky top-16">
        <div className="p-4 border-b border-zinc-800 bg-zinc-950/50">
          <h2 className="font-bold text-white uppercase tracking-wider text-sm">Bet Slip</h2>
        </div>
        <div className="p-6 text-center text-zinc-500 text-sm flex-1">
          Your bet slip is empty.
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Layout */}
      <div className="w-80 bg-zinc-900 border-l border-zinc-800 flex-col hidden lg:flex h-[calc(100vh-64px)] sticky top-16 overflow-hidden">
        <div className="p-4 border-b border-zinc-800 bg-zinc-950/50 flex justify-between items-center shrink-0">
          <h2 className="font-bold text-white uppercase tracking-wider text-sm">
            Bet Slip <span className="bg-green-600 text-white px-2 py-0.5 rounded-full text-xs ml-2">{legs.length}</span>
          </h2>
          <button onClick={clearSlip} className="text-xs text-zinc-400 hover:text-white">Clear All</button>
        </div>
        {betSlipContentJSX}
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
        <AnimatePresence>
          {isMobileExpanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40"
              onClick={() => setIsMobileExpanded(false)}
            />
          )}
        </AnimatePresence>

        <motion.div
          className="bg-zinc-900 border-t border-zinc-800 rounded-t-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-50 relative flex flex-col"
          initial={false}
          animate={{
            height: isMobileExpanded ? "85vh" : "64px",
          }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.2}
          onDragEnd={(e, { offset, velocity }) => {
            const swipeThreshold = 50;
            if (offset.y > swipeThreshold || velocity.y > 500) {
              setIsMobileExpanded(false);
            } else if (offset.y < -swipeThreshold || velocity.y < -500) {
              setIsMobileExpanded(true);
            }
          }}
        >
          {/* Mobile Header / Minimized Bar */}
          <div
            className="h-16 px-4 flex items-center justify-between cursor-pointer shrink-0 bg-zinc-900 rounded-t-2xl"
            onClick={() => setIsMobileExpanded(!isMobileExpanded)}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                {legs.length}
              </div>
              <span className="font-bold text-white uppercase tracking-wider text-sm">
                Bet Slip
              </span>
            </div>

            <div className="flex items-center gap-4">
              {!isMobileExpanded && (
                <span className="font-mono text-green-400 font-bold text-sm">
                  {formatOdds(totalDecimalOdds, oddsFormat)}
                </span>
              )}
              {isMobileExpanded ? (
                <ChevronDown className="text-zinc-400" />
              ) : (
                <ChevronUp className="text-zinc-400" />
              )}
            </div>
          </div>

          {/* Mobile Expanded Content */}
          <AnimatePresence>
            {isMobileExpanded && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 overflow-hidden flex flex-col bg-zinc-900"
              >
                <div className="px-4 pb-2 flex justify-end shrink-0">
                  <button onClick={clearSlip} className="text-xs text-zinc-400 hover:text-white">Clear All</button>
                </div>
                {betSlipContentJSX}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </>
  );
}
