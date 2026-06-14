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

    const { betId } = await req.json();

    if (!betId) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const userId = (session.user as any).id;

    const result = await prisma.$transaction(async (tx) => {
      const bet = await tx.bet.findUnique({
        where: { id: betId }
      });

      if (!bet) throw new Error("Bet not found");
      if (bet.userId !== userId) throw new Error("Unauthorized");
      if (bet.status !== "Pending") throw new Error("Bet is no longer pending");

      // Joke Cashout: always exactly 10% of wager
      const cashoutAmount = bet.amount * 0.10;

      await tx.bet.update({
        where: { id: betId },
        data: {
          status: "Cashed Out",
          potentialWin: cashoutAmount // Update to reflect what they actually got
        }
      });

      await tx.user.update({
        where: { id: userId },
        data: { balance: { increment: cashoutAmount } }
      });

      return { cashoutAmount };
    });

    return NextResponse.json({ success: true, cashoutAmount: result.cashoutAmount });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 400 });
  }
}
