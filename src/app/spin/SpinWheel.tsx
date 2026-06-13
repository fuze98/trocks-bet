"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";

const PRIZES = [
  { id: 1, type: "scc", name: "+5000 SCC", color: "bg-green-500", text: "text-white" },
  { id: 2, type: "bonus", name: "Gym Jones Haircut", color: "bg-blue-500", text: "text-white" },
  { id: 3, type: "bonus", name: "Trocksmas VIP", color: "bg-purple-500", text: "text-white" },
  { id: 4, type: "bonus", name: "Meet & Greet", color: "bg-yellow-500", text: "text-black" },
  { id: 5, type: "scc", name: "-2500 SCC", color: "bg-red-500", text: "text-white" },
  { id: 6, type: "scc", name: "-5000 SCC", color: "bg-red-600", text: "text-white" },
];

export default function SpinWheel() {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [canSpin, setCanSpin] = useState<boolean | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/spin/status");
      if (res.ok) {
        const data = await res.json();
        setCanSpin(data.canSpin);
        setTimeRemaining(data.timeRemaining);
      }
    } catch (error) {
      console.error("Failed to fetch spin status:", error);
    }
  };

  const handleSpin = async () => {
    if (!canSpin || spinning) return;

    setSpinning(true);

    try {
      const res = await fetch("/api/spin", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to spin");
        setSpinning(false);
        return;
      }

      // Calculate rotation to land on the correct prize
      const prizeIndex = PRIZES.findIndex(p => p.id === data.prize.id);

      // Each slice is 60 degrees (360 / 6).
      // We want the chosen slice to be at the top (0 degrees).
      // Since our CSS draws them starting from top and going clockwise,
      // the slice at index i is at angle (i * 60).
      // To bring it to top, we need to rotate by -(i * 60).
      // We add a few full rotations (e.g. 5 * 360 = 1800) for effect.
      // We also offset by 30 degrees so the pointer points to the middle of the slice.
      const sliceAngle = 360 / PRIZES.length;
      const targetRotation = rotation + (360 * 5) - (prizeIndex * sliceAngle) - (sliceAngle / 2);

      setRotation(targetRotation);

      setTimeout(() => {
        setSpinning(false);
        setCanSpin(false);
        setTimeRemaining(24);

        if (data.prize.type === "scc" && data.prize.amount < 0) {
          toast.error(`Tragic! You won ${data.prize.name}`);
        } else {
          toast.success(`Congratulations! You won ${data.prize.name}`);
        }

        // Trigger balance update via custom event if we had one, or a simple reload
        // A full page reload is safest to ensure header balance updates, but we could also use Zustand.
        // For now we'll rely on the user navigating or reloading.

      }, 5000); // 5 seconds for the spin animation

    } catch (error) {
      console.error("Spin error:", error);
      toast.error("An error occurred");
      setSpinning(false);
    }
  };

  const formatTime = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.floor((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-4">
      <h1 className="text-3xl font-black italic uppercase text-white mb-2">Daily Free Spin</h1>
      <p className="text-zinc-400 mb-8 text-center max-w-md">
        Spin the wheel once every 24 hours for a chance to win SCC or exclusive prizes. Beware the negative wedges!
      </p>

      <div className="relative w-72 h-72 sm:w-96 sm:h-96">
        {/* Pointer */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-4 z-10 w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[30px] border-white drop-shadow-md" />

        {/* Wheel */}
        <motion.div
          className="w-full h-full rounded-full overflow-hidden border-4 border-zinc-800 shadow-2xl relative"
          animate={{ rotate: rotation }}
          transition={{ duration: 5, ease: [0.1, 0.7, 0.1, 1] }}
        >
          {PRIZES.map((prize, i) => {
            const angle = i * (360 / PRIZES.length);
            return (
              <div
                key={prize.id}
                className={`absolute w-1/2 h-1/2 origin-bottom-right flex items-center justify-center p-4 ${prize.color}`}
                style={{
                  transform: `rotate(${angle}deg) skewY(-30deg)`, // Skew for 60 degree slice
                }}
              >
                <div
                  className={`transform skewY(30deg) rotate(30deg) ${prize.text} font-bold text-xs sm:text-sm text-center max-w-[80px] break-words`}
                  style={{ transformOrigin: 'center center' }}
                >
                  {prize.name}
                </div>
              </div>
            );
          })}
        </motion.div>
      </div>

      <div className="mt-12">
        {canSpin === null ? (
          <button disabled className="bg-zinc-800 text-zinc-500 px-8 py-3 rounded-full font-black uppercase text-xl animate-pulse">
            Loading...
          </button>
        ) : canSpin ? (
          <button
            onClick={handleSpin}
            disabled={spinning}
            className={`px-8 py-3 rounded-full font-black uppercase text-xl shadow-lg transition-transform ${spinning ? 'bg-zinc-600 text-zinc-400 scale-95 cursor-not-allowed' : 'bg-green-500 text-black hover:scale-105 active:scale-95'}`}
          >
            {spinning ? 'Spinning...' : 'SPIN NOW'}
          </button>
        ) : (
          <div className="flex flex-col items-center">
            <button disabled className="bg-zinc-800 text-zinc-500 px-8 py-3 rounded-full font-black uppercase text-xl cursor-not-allowed">
              Come Back Later
            </button>
            {timeRemaining !== null && (
              <p className="text-zinc-400 mt-2">Next spin in: {formatTime(timeRemaining)}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}