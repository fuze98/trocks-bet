"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useBetSlip } from "@/store/useBetSlip";
import { useEffect, useState, useRef } from "react";
import { Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export function Header() {
  const { data: session } = useSession();
  const { oddsFormat, toggleOddsFormat } = useBetSlip();
  const [balance, setBalance] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close menu if clicked outside
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (session?.user) {
      fetch('/api/user/balance')
        .then(res => res.json())
        .then(data => {
          if (data.balance !== undefined) setBalance(data.balance);
        })
        .catch(console.error);
    }
  }, [session]);

  const BalanceDisplay = () => (
    <div className="flex flex-col items-end">
      <span className="text-sm font-bold text-white">{session?.user?.name}</span>
      <span className="text-xs text-green-400 font-mono">
        {balance !== null ? `$${balance.toFixed(2)} SCC` : '...'}
      </span>
    </div>
  );

  return (
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
            <BalanceDisplay />
            <Link href="/history" className="text-sm bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded text-zinc-300 font-semibold">
              My Bets
            </Link>
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

      {/* Mobile Menu Toggle Button */}
      <div className="md:hidden flex items-center">
        {session?.user ? (
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 -mr-2 text-zinc-400 hover:text-white"
          >
            <Menu className="w-6 h-6" />
          </button>
        ) : (
          <Link href="/login" className="bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded font-semibold text-xs">
            Sign In
          </Link>
        )}
      </div>

      {/* Mobile Sidebar Menu */}
      <AnimatePresence>
        {mobileMenuOpen && session?.user && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 z-[60] md:hidden"
            />

            {/* Drawer */}
            <motion.div
              ref={menuRef}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className="fixed top-0 right-0 bottom-0 w-64 bg-zinc-900 border-l border-zinc-800 shadow-2xl z-[70] md:hidden flex flex-col"
            >
              <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50">
                <BalanceDisplay />
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 -mr-2 text-zinc-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 flex flex-col gap-2">
                <button
                  onClick={toggleOddsFormat}
                  className="w-full text-left px-3 py-3 rounded bg-zinc-800/50 text-sm font-bold uppercase tracking-wider text-zinc-300 hover:bg-zinc-800 transition"
                >
                  Odds: {oddsFormat === 'decimal' ? 'Decimal' : 'American'}
                </button>

                <Link
                  href="/history"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-3 rounded bg-zinc-800/50 hover:bg-zinc-800 text-sm font-semibold text-zinc-200"
                >
                  My Bets
                </Link>

                {(session.user as any).isAdmin && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-3 rounded bg-zinc-800/50 hover:bg-zinc-800 text-sm text-zinc-200"
                  >
                    Admin Dashboard
                  </Link>
                )}
              </div>

              <div className="mt-auto p-4 border-t border-zinc-800 bg-zinc-950/50">
                <button
                  onClick={() => signOut()}
                  className="w-full px-3 py-2 rounded border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 text-sm font-semibold"
                >
                  Logout
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
