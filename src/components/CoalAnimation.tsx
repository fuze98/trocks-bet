"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export function CoalAnimation({ onComplete }: { onComplete: () => void }) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      onComplete();
    }, 4000); // 4 seconds animation
    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden flex items-center">
      {/* The Truck */}
      <motion.div
        initial={{ x: "-200px" }}
        animate={{ x: "120vw" }}
        transition={{ duration: 3, ease: "easeInOut" }}
        className="absolute text-[120px] drop-shadow-2xl z-10"
        style={{ top: '40%' }}
      >
        🛻

        {/* Rolling Coal Smoke Clouds */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: [0, 1, 0.8, 0], scale: [0.5, 3, 5, 8], x: [-50, -300, -600, -1000], y: [0, -50, -100, -200] }}
          transition={{ duration: 2.5, delay: 0.5, ease: "easeOut" }}
          className="absolute top-1/2 -left-10 w-24 h-24 bg-zinc-950 rounded-full blur-xl opacity-90 -z-10"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: [0, 1, 0.9, 0], scale: [0.5, 2.5, 6, 10], x: [-40, -250, -500, -800], y: [10, -20, -40, -100] }}
          transition={{ duration: 2.8, delay: 0.6, ease: "easeOut" }}
          className="absolute top-1/2 -left-10 w-32 h-32 bg-black rounded-full blur-2xl opacity-95 -z-10"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: [0, 0.8, 0.5, 0], scale: [0.5, 2, 4, 7], x: [-60, -400, -800, -1200], y: [-10, -80, -150, -300] }}
          transition={{ duration: 2.4, delay: 0.7, ease: "easeOut" }}
          className="absolute top-1/2 -left-10 w-20 h-20 bg-zinc-900 rounded-full blur-xl opacity-80 -z-10"
        />
      </motion.div>

      {/* Full screen smoke fade */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.4, 0] }}
        transition={{ duration: 3, delay: 0.5 }}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm -z-20"
      />
    </div>
  );
}
