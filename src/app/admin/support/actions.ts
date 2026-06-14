"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function replyToMessage(formData: FormData) {
  const messageId = formData.get("messageId") as string;
  const reply = formData.get("reply") as string;

  if (!messageId || !reply) return;

  await prisma.message.update({
    where: { id: messageId },
    data: { reply }
  });

  revalidatePath("/admin/support");
}
