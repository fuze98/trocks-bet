import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await req.json();
    const { betId } = body;

    if (!betId) {
      return NextResponse.json({ error: "Missing betId" }, { status: 400 });
    }

    const bet = await prisma.bet.findUnique({
      where: { id: betId }
    });

    if (!bet || bet.userId !== userId) {
      return NextResponse.json({ error: "Bet not found or unauthorized" }, { status: 404 });
    }

    if (bet.status !== "Pending") {
      return NextResponse.json({ error: "Only pending bets can be cashed out" }, { status: 400 });
    }

    const cashoutAmount = bet.amount * 0.10; // 10% Joke cashout

    await prisma.$transaction([
      prisma.bet.update({
        where: { id: bet.id },
        data: { status: "Cashed Out" }
      }),
      prisma.user.update({
        where: { id: userId },
        data: { balance: { increment: cashoutAmount } }
      })
    ]);

    return NextResponse.json({ success: true, cashoutAmount });

  } catch (error: any) {
    console.error("Cashout Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}