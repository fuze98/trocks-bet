import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SpinWheelClient } from "./SpinWheelClient";
import { prisma } from "@/lib/prisma";

export default async function SpinPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: (session.user as any).id },
    select: { balance: true, lastSpinTime: true }
  });

  if (!user) {
    redirect("/login");
  }

  // Calculate cooldown
  const COOLDOWN_HOURS = 24;
  let canSpin = true;
  let msUntilNextSpin = 0;

  if (user.lastSpinTime) {
    const timeSinceLastSpin = Date.now() - user.lastSpinTime.getTime();
    const cooldownMs = COOLDOWN_HOURS * 60 * 60 * 1000;
    if (timeSinceLastSpin < cooldownMs) {
      canSpin = false;
      msUntilNextSpin = cooldownMs - timeSinceLastSpin;
    }
  }

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-8">
        <h1 className="text-3xl font-black text-white">
          Daily Spin Wheel
        </h1>
      </div>

      <SpinWheelClient
        canSpin={canSpin}
        msUntilNextSpin={msUntilNextSpin}
        balance={user.balance}
      />
    </div>
  );
}
