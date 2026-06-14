"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const PRIZES = [
  { label: "-2500 SCC", type: "lose", amount: -2500 },
  { label: "+5000 SCC", type: "win", amount: 5000 },
  { label: "VIP Access", type: "bonus", desc: "VIP Access" },
  { label: "-5000 SCC", type: "lose", amount: -5000 },
  { label: "Meet & Greet", type: "bonus", desc: "Meet & Greet" },
  { label: "Gym Jones Haircut", type: "bonus", desc: "Gym Jones Haircut" },
];

export function SpinWheelClient({
  canSpin,
  msUntilNextSpin,
  balance
}: {
  canSpin: boolean;
  msUntilNextSpin: number;
  balance: number;
}) {
  const router = useRouter();
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [timeLeft, setTimeLeft] = useState(msUntilNextSpin);

  useEffect(() => {
    if (timeLeft > 0) {
      const interval = setInterval(() => {
        setTimeLeft((prev) => Math.max(0, prev - 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timeLeft]);

  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${hours}h ${minutes}m ${seconds}s`;
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

      // Find the prize index
      const prizeIndex = PRIZES.findIndex(p =>
        (data.type === 'scc' && p.amount === data.amount) ||
        (data.type === 'bonus' && p.desc === data.description)
      );

      // Calculate rotation to land on the prize (360 degrees / 6 segments)
      const segmentAngle = 360 / PRIZES.length;

      // Calculate angle offset to point to top
      const offsetToTop = 270; // SVG starts 0 at right, so 270 is top
      const targetAngle = offsetToTop - (prizeIndex * segmentAngle) - (segmentAngle / 2);

      // Add extra spins (e.g. 5 full rotations)
      const extraSpins = 360 * 5;
      const totalRotation = rotation + extraSpins + (targetAngle - (rotation % 360));

      // Make sure total rotation is always positive and increasing
      const finalRotation = totalRotation < rotation ? totalRotation + 360 : totalRotation;


      setRotation(finalRotation);

      setTimeout(() => {
        setSpinning(false);
        if (data.type === 'scc') {
          if (data.amount > 0) {
            toast.success(`You won +${data.amount} SCC!`);
          } else {
            toast.error(`You lost ${Math.abs(data.amount)} SCC... Ouch.`);
          }
        } else {
          toast.success(`You won: ${data.description}!`);
        }
        router.refresh();
      }, 5000); // 5 seconds spin animation

    } catch (e) {
      toast.error("Something went wrong.");
      setSpinning(false);
    }
  };

  // SVG parameters
  const radius = 200;
  const center = 250;
  const strokeWidth = 100;

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-zinc-900 border border-zinc-800 rounded-xl shadow-lg">
      <div className="relative w-[500px] h-[500px] mb-8">
        {/* Pointer */}
        <div className="absolute top-[-20px] left-1/2 transform -translate-x-1/2 z-10 w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[40px] border-t-red-500 filter drop-shadow-md"></div>

        <motion.svg
          width="500"
          height="500"
          viewBox="0 0 500 500"
          className="rounded-full shadow-2xl drop-shadow-xl"
          animate={{ rotate: rotation }}
          transition={{ duration: 5, ease: [0.2, 0.8, 0.2, 1] }} // smooth deceleration
        >
          {PRIZES.map((prize, i) => {
            const startAngle = (i * 360) / PRIZES.length;
            const endAngle = ((i + 1) * 360) / PRIZES.length;

            // Calculate pie slice path
            const x1 = center + radius * Math.cos((Math.PI * startAngle) / 180);
            const y1 = center + radius * Math.sin((Math.PI * startAngle) / 180);
            const x2 = center + radius * Math.cos((Math.PI * endAngle) / 180);
            const y2 = center + radius * Math.sin((Math.PI * endAngle) / 180);

            const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;

            // Colors: Alternate dark grays with a green/red pop
            const fill = prize.type === "win" ? "#22c55e" : prize.type === "lose" ? "#ef4444" : i % 2 === 0 ? "#27272a" : "#3f3f46";

            return (
              <g key={i}>
                <path
                  d={`M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                  fill={fill}
                  stroke="#18181b"
                  strokeWidth="2"
                />

                {/* Text positioning (midpoint of slice, pushed out) */}
                <text
                  x={center + (radius * 0.65) * Math.cos((Math.PI * (startAngle + endAngle) / 2) / 180)}
                  y={center + (radius * 0.65) * Math.sin((Math.PI * (startAngle + endAngle) / 2) / 180)}
                  fill="white"
                  fontSize="14"
                  fontWeight="bold"
                  textAnchor="middle"
                  alignmentBaseline="middle"
                  transform={`rotate(${(startAngle + endAngle) / 2}, ${center + (radius * 0.65) * Math.cos((Math.PI * (startAngle + endAngle) / 2) / 180)}, ${center + (radius * 0.65) * Math.sin((Math.PI * (startAngle + endAngle) / 2) / 180)})`}
                >
                  {prize.label}
                </text>
              </g>
            );
          })}
          {/* Inner circle for aesthetics */}
          <circle cx={center} cy={center} r="30" fill="#18181b" />
          <circle cx={center} cy={center} r="10" fill="#a1a1aa" />
        </motion.svg>
      </div>

      {!canSpin && timeLeft > 0 ? (
        <div className="text-center">
          <p className="text-xl font-bold text-zinc-400 mb-2">Next Spin Available In</p>
          <div className="text-3xl font-mono text-red-400">{formatTime(timeLeft)}</div>
        </div>
      ) : (
        <button
          onClick={handleSpin}
          disabled={spinning}
          className="bg-green-600 hover:bg-green-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-black text-2xl px-12 py-4 rounded-xl shadow-[0_0_15px_rgba(34,197,94,0.5)] transition-all transform hover:scale-105 active:scale-95"
        >
          {spinning ? "SPINNING..." : "SPIN NOW"}
        </button>
      )}

      <div className="mt-8 text-center text-zinc-500 text-sm max-w-md">
        <p>You can spin the wheel once every 24 hours. Good luck, don&apos;t go broke!</p>
      </div>
    </div>
  );
}
