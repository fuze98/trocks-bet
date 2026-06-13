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
      const marketUpdates = [];

      for (const outcome of outcomes) {
        // Validation checks
        if (outcome.market.status !== "Open" || outcome.status !== "Pending") {
          throw new Error(`Market "${outcome.market.name}" is closed or suspended`);
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

        // Limit Checks
        if (outcome.market.userLimit) {
          const maxWager = outcome.market.userLimit * user.limitMultiplier;
          if (amount > maxWager) {
            throw new Error(`Exceeds maximum wager of $${maxWager.toFixed(2)} for ${outcome.market.name}`);
          }
        }

        if (outcome.market.totalLimit) {
          // Calculate total wagers on this market currently
          const marketLegs = await tx.betLeg.findMany({
            where: { marketOutcome: { marketId: outcome.market.id } },
            include: { bet: true }
          });
          const totalWageredSoFar = marketLegs.reduce((sum, leg) => sum + leg.bet.amount, 0);

          if (totalWageredSoFar + amount > outcome.market.totalLimit) {
            // Exceeds total limit. Suspend the market and reject the bet.
            marketUpdates.push({ id: outcome.market.id, status: "Suspended" });
            const err: any = new Error(`Market ${outcome.market.name} has reached its capacity and has been suspended. Please check alarms.`);
            err.marketUpdates = marketUpdates;
            throw err;
          }
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
    // If the transaction threw an error because of limits, check if we have suspended markets to commit
    if (error.marketUpdates) {
       for (const update of error.marketUpdates) {
         await prisma.market.update({
            where: { id: update.id },
            data: { status: update.status }
         });
       }
    }
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 400 });
  }
}
