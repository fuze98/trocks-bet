import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const bets = await prisma.bet.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        legs: {
          include: {
            marketOutcome: {
              include: {
                market: {
                  include: {
                    match: {
                      include: {
                        league: {
                          include: { sport: true }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    return NextResponse.json({ bets });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
