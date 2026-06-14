"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateMarketLimit(formData: FormData) {
  const marketId = formData.get("marketId") as string;
  const limitStr = formData.get("totalLimit") as string;

  if (!marketId) return;

  const totalLimit = limitStr ? parseFloat(limitStr) : null;

  await prisma.market.update({
    where: { id: marketId },
    data: { totalLimit }
  });

  revalidatePath("/admin/alarms");
}

export async function toggleMarketStatus(formData: FormData) {
  const marketId = formData.get("marketId") as string;
  const status = formData.get("status") as string;

  if (!marketId || !status) return;

  await prisma.market.update({
    where: { id: marketId },
    data: { status }
  });

  revalidatePath("/admin/alarms");
}
