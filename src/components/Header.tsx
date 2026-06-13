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

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <header className="h-16 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-4 md:px-6 sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-3xl">🚜</span>
          <span className="text-xl font-black text-white tracking-tight">
            Trocks<span className="text-green-500">Bet</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          <button
            onClick={toggleOddsFormat}
            className="text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-white transition"
          >
            {oddsFormat === 'decimal' ? 'Decimal' : 'American'}
          </button>

          {session?.user ? (
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end">
                <span className="text-sm font-bold text-white">{session.user.name}</span>
                <span className="text-xs text-green-400 font-mono">
                  {balance !== null ? `$${balance.toFixed(2)} SCC` : '...'}
                </span>
              </div>
              <Link href="/history" className="text-sm bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded text-zinc-300 font-semibold">
                My Bets
              </Link>
              {!(session.user as any).isAdmin && (
                <Link href="/support" className="text-sm bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded text-zinc-300 font-semibold">
                  Support
                </Link>
              )}
              {(session.user as any).isAdmin && (
                <Link href="/admin" className="text-sm bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded text-zinc-300">
                  Admin
                </Link>
              )}
              <button
                onClick={() => signOut()}
                className="text-sm text-red-400 hover:text-red-300"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link href="/login" className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded font-semibold text-sm">
              Sign In
            </Link>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="md:hidden flex items-center">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-zinc-300 hover:text-white focus:outline-none"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}></path>
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <div className="md:hidden bg-zinc-900 border-b border-zinc-800 fixed top-16 left-0 right-0 z-40 p-4 flex flex-col gap-4 shadow-xl">
          <button
            onClick={() => {
              toggleOddsFormat();
              setIsMenuOpen(false);
            }}
            className="w-full text-left text-sm font-bold uppercase tracking-wider text-zinc-300 p-2 bg-zinc-800/50 rounded"
          >
            Format: {oddsFormat === 'decimal' ? 'Decimal' : 'American'}
          </button>

          {session?.user ? (
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center p-2 bg-zinc-800/50 rounded mb-2">
                <span className="text-sm font-bold text-white">{session.user.name}</span>
                <span className="text-sm text-green-400 font-mono font-bold">
                  {balance !== null ? `$${balance.toFixed(2)}` : '...'}
                </span>
              </div>
              <Link href="/history" onClick={() => setIsMenuOpen(false)} className="w-full text-center text-sm bg-zinc-800 hover:bg-zinc-700 py-3 rounded text-white font-semibold">
                My Bets
              </Link>
              {!(session.user as any).isAdmin && (
                <Link href="/support" onClick={() => setIsMenuOpen(false)} className="w-full text-center text-sm bg-zinc-800 hover:bg-zinc-700 py-3 rounded text-white font-semibold">
                  Customer Service
                </Link>
              )}
              {(session.user as any).isAdmin && (
                <Link href="/admin" onClick={() => setIsMenuOpen(false)} className="w-full text-center text-sm bg-zinc-800 hover:bg-zinc-700 py-3 rounded text-white font-semibold">
                  Admin Panel
                </Link>
              )}
              <button
                onClick={() => {
                  signOut();
                  setIsMenuOpen(false);
                }}
                className="w-full text-center text-sm text-red-400 bg-red-500/10 hover:bg-red-500/20 py-3 rounded font-semibold mt-2"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link href="/login" onClick={() => setIsMenuOpen(false)} className="w-full text-center bg-green-600 hover:bg-green-500 text-white py-3 rounded font-bold text-sm">
              Sign In
            </Link>
          )}
        </div>
      )}
    </>
  );
}
