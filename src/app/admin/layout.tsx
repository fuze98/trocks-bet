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
        <nav className="flex flex-col gap-1">
          <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-4 mb-2 px-3">Live Action</div>
          <Link href="/admin/tickets" className="px-3 py-2 rounded-md hover:bg-zinc-800 text-zinc-300 font-medium">Pending Tickets</Link>
          <Link href="/admin/alarms" className="px-3 py-2 rounded-md hover:bg-zinc-800 text-zinc-300 font-medium">Market Alarms</Link>

          <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-6 mb-2 px-3">Bookmaking</div>
          <Link href="/admin/matches" className="px-3 py-2 rounded-md hover:bg-zinc-800 text-zinc-300 font-medium">Matches & Grader</Link>
          <Link href="/admin/templates" className="px-3 py-2 rounded-md hover:bg-zinc-800 text-zinc-300 font-medium">Market Templates</Link>
          <Link href="/admin/sports" className="px-3 py-2 rounded-md hover:bg-zinc-800 text-zinc-300 font-medium">Sports & Teams</Link>

          <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-6 mb-2 px-3">Accounting</div>
          <Link href="/admin/stats" className="px-3 py-2 rounded-md hover:bg-zinc-800 text-zinc-300 font-medium">Stats & P&L</Link>
          <Link href="/admin/liabilities" className="px-3 py-2 rounded-md hover:bg-zinc-800 text-zinc-300 font-medium">Market Liabilities</Link>
          <Link href="/admin/users" className="px-3 py-2 rounded-md hover:bg-zinc-800 text-zinc-300 font-medium">Customers</Link>

          <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-6 mb-2 px-3">Other</div>
          <Link href="/admin/support" className="px-3 py-2 rounded-md hover:bg-zinc-800 text-zinc-300 font-medium">Support Hub</Link>

          <Link href="/" className="px-3 py-2 rounded-md hover:bg-zinc-800 text-zinc-500 font-medium mt-12">
            Exit Admin
          </Link>
        </nav>
      </div>

      {/* Admin Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
