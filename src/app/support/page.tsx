import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SupportClient } from "./SupportClient";

export default async function SupportPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const messages = await prisma.message.findMany({
    where: { userId: (session.user as any).id },
    orderBy: { createdAt: "desc" }
  });

  return <SupportClient initialMessages={messages} />;
}
