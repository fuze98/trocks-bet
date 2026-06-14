import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user || !(session.user as any).isAdmin) {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen bg-zinc-950">
      {/* Admin Sidebar */}
      <div className="w-64 bg-zinc-900 border-r border-zinc-800 p-6 flex flex-col gap-6">
        <div className="flex items-center gap-2">
          <span className="text-3xl">🚜</span>
          <span className="text-xl font-bold text-white tracking-tight">
            Trocks<span className="text-green-500">Admin</span>
          </span>
        </div>
        <nav className="flex flex-col gap-4 overflow-y-auto">
          <div>
            <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 px-3">Live Action</div>
            <Link href="/admin/tickets" className="block px-3 py-2 rounded-md hover:bg-zinc-800 text-zinc-300 font-medium text-sm">
              Live Ticket Feed
            </Link>
            <Link href="/admin/alarms" className="block px-3 py-2 rounded-md hover:bg-zinc-800 text-zinc-300 font-medium text-sm">
              Market Alarms
            </Link>
          </div>

          <div>
            <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 px-3">Bookmaking</div>
            <Link href="/admin/sports" className="block px-3 py-2 rounded-md hover:bg-zinc-800 text-zinc-300 font-medium text-sm">
              Sports & Leagues
            </Link>
            <Link href="/admin/matches" className="block px-3 py-2 rounded-md hover:bg-zinc-800 text-zinc-300 font-medium text-sm">
              Matches & Markets
            </Link>
            <Link href="/admin/templates" className="block px-3 py-2 rounded-md hover:bg-zinc-800 text-zinc-300 font-medium text-sm">
              Market Templates
            </Link>
            <Link href="/admin/liabilities" className="block px-3 py-2 rounded-md hover:bg-zinc-800 text-zinc-300 font-medium text-sm">
              Liabilities & Exposure
            </Link>
          </div>

          <div>
            <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 px-3">Accounting</div>
            <Link href="/admin/stats" className="block px-3 py-2 rounded-md hover:bg-zinc-800 text-zinc-300 font-medium text-sm">
              Stats & P&L Dashboard
            </Link>
            <Link href="/admin/users" className="block px-3 py-2 rounded-md hover:bg-zinc-800 text-zinc-300 font-medium text-sm">
              Users & Grading
            </Link>
          </div>

          <div>
            <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 px-3">Support</div>
            <Link href="/admin/support" className="block px-3 py-2 rounded-md hover:bg-zinc-800 text-zinc-300 font-medium text-sm">
              Support Hub
            </Link>
          </div>

          <div className="mt-auto">
            <Link href="/" className="block px-3 py-2 rounded-md hover:bg-zinc-800 text-zinc-500 font-medium text-sm">
              Back to site
            </Link>
          </div>
        </nav>
      </div>

      {/* Admin Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
