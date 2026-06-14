"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export async function updateUserBalance(userId: string, formData: FormData) {
  const amountStr = formData.get("amount") as string;
  if (!amountStr) return;
  const amount = parseFloat(amountStr);

  await prisma.user.update({
    where: { id: userId },
    data: { balance: amount },
  });

  revalidatePath("/admin/users");
}

export async function updateUserLimit(userId: string, formData: FormData) {
  const multiplierStr = formData.get("limitMultiplier") as string;
  if (!multiplierStr) return;
  const limitMultiplier = parseFloat(multiplierStr);

  await prisma.user.update({
    where: { id: userId },
    data: { limitMultiplier },
  });

  revalidatePath("/admin/users");
}

export async function resetUserPassword(userId: string) {
  const tempPassword = "trocksbet" + Math.floor(Math.random() * 10000);
  const hashedPassword = await bcrypt.hash(tempPassword, 10);

  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash: hashedPassword,
      isTemporaryPwd: true
    },
  });

  return tempPassword;
}

export async function gradeMarket(marketId: string, formData: FormData) {
  const winningOutcomeId = formData.get("winningOutcomeId") as string;
  const gradeType = formData.get("gradeType") as string; // 'won', 'push'

  if (!marketId || !gradeType) return;

  const market = await prisma.market.findUnique({
    where: { id: marketId },
    include: { outcomes: true }
  });

  if (!market) return;

  // Grade the outcomes
  for (const outcome of market.outcomes) {
    let outcomeStatus = "Lost";
    if (gradeType === "push") {
      outcomeStatus = "Push";
    } else if (outcome.id === winningOutcomeId) {
      outcomeStatus = "Won";
    }

    await prisma.marketOutcome.update({
      where: { id: outcome.id },
      data: { status: outcomeStatus }
    });
  }

  // Update Market status
  await prisma.market.update({
    where: { id: marketId },
    data: { status: "Graded" }
  });

  // Evaluate Bets
  const betLegs = await prisma.betLeg.findMany({
    where: { marketOutcome: { marketId: marketId } },
    include: { bet: { include: { legs: { include: { marketOutcome: true } } } } }
  });

  // Unique bets affected
  const affectedBets = Array.from(new Set(betLegs.map(bl => bl.betId)));

  for (const betId of affectedBets) {
    const bet = await prisma.bet.findUnique({
      where: { id: betId },
      include: { legs: { include: { marketOutcome: true } } }
    });

    if (!bet) continue;

    let hasLostLeg = false;
    let hasPendingLeg = false;
    let pushMultiplier = 1;

    for (const leg of bet.legs) {
      const status = leg.marketOutcome.status;
      // Sync leg status with outcome status
      await prisma.betLeg.update({
        where: { id: leg.id },
        data: { status: status }
      });

      if (status === "Pending") hasPendingLeg = true;
      if (status === "Lost") hasLostLeg = true;
      if (status === "Push") {
         // Remove this leg's odds from the total calculation
         pushMultiplier *= leg.oddsDecimal;
      }
    }

    if (hasLostLeg) {
      await prisma.bet.update({
        where: { id: bet.id },
        data: { status: "Lost" }
      });
    } else if (!hasPendingLeg) {
      // Won or Push (if all pushed, it's just refund)
      const adjustedOdds = bet.totalOdds / pushMultiplier;
      const finalPayout = bet.amount * adjustedOdds;

      await prisma.bet.update({
        where: { id: bet.id },
        data: { status: "Won", potentialWin: finalPayout }
      });

      // Payout user
      await prisma.user.update({
        where: { id: bet.userId },
        data: { balance: { increment: finalPayout } }
      });
    }
  }

  revalidatePath("/admin/users");
  revalidatePath("/admin/matches");
}
