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

    const { legs, amount } = await req.json();

    if (!legs || !Array.isArray(legs) || legs.length === 0 || amount <= 0) {
      return NextResponse.json({ error: "Invalid bet request" }, { status: 400 });
    }

    const userId = (session.user as any).id;

    // Run transaction
    const betResult = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new Error("User not found");

      if (user.balance < amount) {
        throw new Error("Insufficient Social Credit Capital");
      }

      // Fetch all outcomes
      const outcomes = await tx.marketOutcome.findMany({
        where: { id: { in: legs } },
        include: { market: { include: { match: true } } }
      });

      if (outcomes.length !== legs.length) {
        throw new Error("One or more selections are no longer available");
      }

      let totalOdds = 1;
      let hasSinglesOnly = false;
      const matchIds = new Set<string>();

      for (const outcome of outcomes) {
        // Validation checks
        if (outcome.market.status !== "Open" || outcome.status !== "Pending") {
          throw new Error(`Market "${outcome.market.name}" is closed`);
        }
        if (outcome.market.match.status !== "Scheduled" || new Date() >= outcome.market.match.startTime) {
          throw new Error(`Match "${outcome.market.match.name}" has already started`);
        }
        if (outcome.market.allowOnlySingles) {
          hasSinglesOnly = true;
        }
        if (matchIds.has(outcome.market.match.id)) {
           throw new Error("Cannot parlay multiple outcomes from the same match");
        }
        matchIds.add(outcome.market.match.id);
        totalOdds *= outcome.oddsDecimal;
      }

      if (outcomes.length > 1 && hasSinglesOnly) {
        throw new Error("Parlay contains markets restricted to singles only");
      }

      // Deduct balance
      await tx.user.update({
        where: { id: userId },
        data: { balance: { decrement: amount } }
      });

      // Create bet
      const bet = await tx.bet.create({
        data: {
          userId,
          amount,
          totalOdds,
          potentialWin: amount * totalOdds,
          legs: {
            create: outcomes.map(o => ({
              marketOutcomeId: o.id,
              oddsDecimal: o.oddsDecimal
            }))
          }
        }
      });

      return bet;
    });

    return NextResponse.json({ success: true, betId: betResult.id });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 400 });
  }
}
