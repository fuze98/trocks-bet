import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { BetSlip } from "@/components/BetSlip";
import { prisma } from "@/lib/prisma";
import Providers from "./providers";
import "./globals.css";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Only render layout for main app, admin has its own layout
  const isServerAdminLayout = false; // Next.js layout resolution handles admin/layout.tsx overrides automatically

  const sports = await prisma.sport.findMany({
    include: { leagues: true },
    orderBy: { name: 'asc' }
  });

  return (
    <html lang="en">
      <body className={`bg-zinc-950 text-zinc-100 min-h-screen flex flex-col`}>
        <Providers>
          <Header />
          <div className="flex flex-1 max-w-[1600px] mx-auto w-full">
            <Sidebar sports={sports} />
            <main className="flex-1 overflow-x-hidden min-h-[calc(100vh-64px)]">
              {children}
            </main>
            <BetSlip />
          </div>
        </Providers>
      </body>
    </html>
  );
}
