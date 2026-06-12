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
        <nav className="flex flex-col gap-2">
          <Link
            href="/admin/sports"
            className="px-3 py-2 rounded-md hover:bg-zinc-800 text-zinc-300 font-medium"
          >
            Sports & Leagues
          </Link>
          <Link
            href="/admin/matches"
            className="px-3 py-2 rounded-md hover:bg-zinc-800 text-zinc-300 font-medium"
          >
            Matches & Markets
          </Link>
          <Link
            href="/admin/users"
            className="px-3 py-2 rounded-md hover:bg-zinc-800 text-zinc-300 font-medium"
          >
            Users & Grading
          </Link>
          <Link
            href="/"
            className="px-3 py-2 rounded-md hover:bg-zinc-800 text-zinc-500 font-medium mt-auto"
          >
            Back to site
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
