"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useBetSlip } from "@/store/useBetSlip";
import { useEffect, useState } from "react";

export function Header() {
  const { data: session } = useSession();
  const { oddsFormat, toggleOddsFormat } = useBetSlip();
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    if (session?.user) {
      // Fetch user balance
      fetch('/api/user/balance')
        .then(res => res.json())
        .then(data => {
          if (data.balance !== undefined) setBalance(data.balance);
        })
        .catch(console.error);
    }
  }, [session]);

  return (
    <header className="h-16 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-4 md:px-6 sticky top-0 z-50">
      <Link href="/" className="flex items-center gap-2">
        <span className="text-3xl">🚜</span>
        <span className="text-xl font-black text-white tracking-tight hidden sm:inline">
          Trocks<span className="text-green-500">Bet</span>
        </span>
      </Link>

      <div className="flex items-center gap-4 md:gap-6">
        <button
          onClick={toggleOddsFormat}
          className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-white transition"
        >
          {oddsFormat === 'decimal' ? 'Decimal' : 'American'}
        </button>

        {session?.user ? (
          <div className="flex items-center gap-3 md:gap-4">
            <div className="flex flex-col items-end hidden sm:flex">
              <span className="text-sm font-bold text-white">{session.user.name}</span>
              <span className="text-xs text-green-400 font-mono">
                {balance !== null ? `$${balance.toFixed(2)} SCC` : '...'}
              </span>
            </div>
            <Link href="/history" className="text-xs md:text-sm bg-zinc-800 hover:bg-zinc-700 px-2 md:px-3 py-1.5 rounded text-zinc-300 font-semibold">
              My Bets
            </Link>
            {(session.user as any).isAdmin && (
              <Link href="/admin" className="text-xs md:text-sm bg-zinc-800 hover:bg-zinc-700 px-2 md:px-3 py-1.5 rounded text-zinc-300">
                Admin
              </Link>
            )}
            <button
              onClick={() => signOut()}
              className="text-xs md:text-sm text-red-400 hover:text-red-300"
            >
              Logout
            </button>
          </div>
        ) : (
          <Link href="/login" className="bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 md:px-4 md:py-2 rounded font-semibold text-xs md:text-sm">
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
}
