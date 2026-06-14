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
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const COOLDOWN_HOURS = 24;
    if (user.lastSpinTime) {
      const timeSinceLastSpin = Date.now() - user.lastSpinTime.getTime();
      const cooldownMs = COOLDOWN_HOURS * 60 * 60 * 1000;
      if (timeSinceLastSpin < cooldownMs) {
        return NextResponse.json({ error: "Cooldown active" }, { status: 400 });
      }
    }

    // Spin Logic: 50% lose, 50% win.
    const PRIZES = [
      { type: "scc", amount: -2500 },
      { type: "scc", amount: 5000 },
      { type: "bonus", description: "VIP Access" },
      { type: "scc", amount: -5000 },
      { type: "bonus", description: "Meet & Greet" },
      { type: "bonus", description: "Gym Jones Haircut" },
    ];

    const randomIdx = Math.floor(Math.random() * PRIZES.length);
    const wonPrize = PRIZES[randomIdx];

    await prisma.$transaction(async (tx) => {
      // Update last spin time
      await tx.user.update({
        where: { id: userId },
        data: { lastSpinTime: new Date() }
      });

      if (wonPrize.type === "scc") {
        await tx.user.update({
          where: { id: userId },
          data: { balance: { increment: wonPrize.amount } }
        });
      } else if (wonPrize.type === "bonus") {
        await tx.bonus.create({
          data: {
            userId: userId,
            description: wonPrize.description!,
            status: "Active"
          }
        });
      }
    });

    return NextResponse.json(wonPrize);

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
