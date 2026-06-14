"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createTemplate(formData: FormData) {
  const name = formData.get("name") as string;
  const type = formData.get("type") as string;
  const outcomesFormatStr = formData.get("outcomesFormat") as string;
  const allowOnlySingles = formData.get("allowOnlySingles") === "on";

  const defaultUserLimitStr = formData.get("defaultUserLimit") as string;
  const defaultTotalLimitStr = formData.get("defaultTotalLimit") as string;

  if (!name || !type || !outcomesFormatStr) return;

  const outcomesFormat = outcomesFormatStr.split(",").map(s => s.trim()).filter(s => s);

  await prisma.marketTemplate.create({
    data: {
      name,
      type,
      outcomesFormat,
      allowOnlySingles,
      defaultUserLimit: defaultUserLimitStr ? parseFloat(defaultUserLimitStr) : null,
      defaultTotalLimit: defaultTotalLimitStr ? parseFloat(defaultTotalLimitStr) : null,
    }
  });

  revalidatePath("/admin/templates");
}

export async function deleteTemplate(id: string) {
  await prisma.marketTemplate.delete({ where: { id } });
  revalidatePath("/admin/templates");
}
