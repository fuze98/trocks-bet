import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const PRIZES = [
  { id: 1, type: "scc", amount: 5000, name: "+5000 SCC" },
  { id: 2, type: "bonus", amount: 0, name: "A free haircut from Gym Jones" },
  { id: 3, type: "bonus", amount: 0, name: "VIP early access to Trocksmas 2026" },
  { id: 4, type: "bonus", amount: 0, name: "Gym Jones Meet and Greet (5 mins)" },
  { id: 5, type: "scc", amount: -2500, name: "-2500 SCC" },
  { id: 6, type: "scc", amount: -5000, name: "-5000 SCC" },
];

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check cooldown
    const now = new Date();
    if (user.lastSpinTime) {
      const timeSinceLastSpin = now.getTime() - user.lastSpinTime.getTime();
      const hoursSinceLastSpin = timeSinceLastSpin / (1000 * 60 * 60);

      if (hoursSinceLastSpin < 24) {
        return NextResponse.json({
          error: "Cooldown active",
          timeRemaining: 24 - hoursSinceLastSpin,
          lastSpinTime: user.lastSpinTime
        }, { status: 429 });
      }
    }

    // Determine prize
    // 50% chance for negative SCC (-2500, -5000) -> items 5, 6
    // 50% chance for the rest (+5000 SCC, Haircut, VIP, Meet & Greet) -> items 1, 2, 3, 4

    const random = Math.random();
    let selectedPrize;

    if (random < 0.5) {
      // 50% chance for negative
      const isMinus2500 = Math.random() < 0.5;
      selectedPrize = isMinus2500 ? PRIZES[4] : PRIZES[5];
    } else {
      // 50% chance for positive/bonuses
      const subRandom = Math.random();
      if (subRandom < 0.25) selectedPrize = PRIZES[0];
      else if (subRandom < 0.5) selectedPrize = PRIZES[1];
      else if (subRandom < 0.75) selectedPrize = PRIZES[2];
      else selectedPrize = PRIZES[3];
    }

    // Apply prize
    await prisma.$transaction(async (tx) => {
      // Update last spin time and apply SCC changes if applicable
      await tx.user.update({
        where: { id: user.id },
        data: {
          lastSpinTime: now,
          balance: selectedPrize.type === "scc" ? { increment: selectedPrize.amount } : undefined
        }
      });

      // Insert bonus record if applicable
      if (selectedPrize.type === "bonus") {
        await tx.bonus.create({
          data: {
            userId: user.id,
            description: selectedPrize.name
          }
        });
      }
    });

    // Return the updated user info and the prize
    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id }
    });

    return NextResponse.json({
      success: true,
      prize: selectedPrize,
      balance: updatedUser?.balance
    });

  } catch (error: any) {
    console.error("Spin error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
