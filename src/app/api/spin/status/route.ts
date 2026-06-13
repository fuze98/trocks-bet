export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { lastSpinTime: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let canSpin = true;
    let timeRemaining = 0;

    if (user.lastSpinTime) {
      const now = new Date();
      const timeSinceLastSpin = now.getTime() - user.lastSpinTime.getTime();
      const hoursSinceLastSpin = timeSinceLastSpin / (1000 * 60 * 60);

      if (hoursSinceLastSpin < 24) {
        canSpin = false;
        timeRemaining = 24 - hoursSinceLastSpin;
      }
    }

    return NextResponse.json({
      canSpin,
      timeRemaining,
      lastSpinTime: user.lastSpinTime
    });

  } catch (error: any) {
    console.error("Spin status error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
