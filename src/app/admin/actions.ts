"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createSport(formData: FormData) {
  const name = formData.get("name") as string;
  if (!name) return;

  await prisma.sport.create({
    data: { name },
  });

  revalidatePath("/admin/sports");
}

export async function deleteSport(id: string) {
  await prisma.sport.delete({
    where: { id },
  });
  revalidatePath("/admin/sports");
}

export async function createLeague(formData: FormData) {
  const name = formData.get("name") as string;
  const sportId = formData.get("sportId") as string;

  if (!name || !sportId) return;

  await prisma.league.create({
    data: { name, sportId },
  });

  revalidatePath("/admin/sports");
}

export async function deleteLeague(id: string) {
  await prisma.league.delete({
    where: { id },
  });
  revalidatePath("/admin/sports");
}

export async function createMatch(formData: FormData) {
  const name = formData.get("name") as string;
  const leagueId = formData.get("leagueId") as string;
  const startTimeStr = formData.get("startTime") as string;

  if (!name || !leagueId || !startTimeStr) return;

  await prisma.match.create({
    data: {
      name,
      leagueId,
      startTime: new Date(startTimeStr),
      status: "Scheduled",
    },
  });

  revalidatePath("/admin/matches");
}

export async function updateMatchStatus(matchId: string, status: string, expectedResultTime?: string) {
  await prisma.match.update({
    where: { id: matchId },
    data: {
      status,
      ...(expectedResultTime ? { expectedResultTime: new Date(expectedResultTime) } : {})
    },
  });
  revalidatePath("/admin/matches");
}

export async function deleteMatch(id: string) {
  await prisma.match.delete({
    where: { id },
  });
  revalidatePath("/admin/matches");
}

export async function createMarket(formData: FormData) {
  const name = formData.get("name") as string;
  const matchId = formData.get("matchId") as string;
  const type = formData.get("type") as string;
  const allowOnlySingles = formData.get("allowOnlySingles") === "on";

  if (!name || !matchId) return;

  await prisma.market.create({
    data: {
      name,
      matchId,
      type: type || null,
      allowOnlySingles,
      status: "Open"
    }
  });

  revalidatePath(`/admin/matches`);
}

export async function createOutcome(formData: FormData) {
  const name = formData.get("name") as string;
  const marketId = formData.get("marketId") as string;
  const oddsStr = formData.get("odds") as string;

  if (!name || !marketId || !oddsStr) return;

  const oddsDecimal = parseFloat(oddsStr);

  await prisma.marketOutcome.create({
    data: {
      name,
      marketId,
      oddsDecimal,
      status: "Pending"
    }
  });

  revalidatePath(`/admin/matches`);
}

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

export async function updateMatchStartTime(matchId: string, startTime: string) {
  if (!matchId || !startTime) return;
  await prisma.match.update({
    where: { id: matchId },
    data: { startTime: new Date(startTime) }
  });
  revalidatePath("/admin/matches");
  revalidatePath("/");
}

export async function updateOutcomeOdds(outcomeId: string, oddsStr: string) {
  if (!outcomeId || !oddsStr) return;
  const oddsDecimal = parseFloat(oddsStr);
  await prisma.marketOutcome.update({
    where: { id: outcomeId },
    data: { oddsDecimal }
  });
  revalidatePath("/admin/matches");
  revalidatePath("/");
}

export async function updateUserLimit(userId: string, limitMultiplierStr: string) {
  if (!userId || !limitMultiplierStr) return;
  const limitMultiplier = parseFloat(limitMultiplierStr);
  await prisma.user.update({
    where: { id: userId },
    data: { limitMultiplier }
  });
  revalidatePath("/admin/users");
}

export async function updateMarketLimitsAndReopen(marketId: string, userLimitStr: string, totalLimitStr: string) {
  if (!marketId) return;

  const data: any = { status: "Open" };
  if (userLimitStr) data.userLimit = parseFloat(userLimitStr);
  if (totalLimitStr) data.totalLimit = parseFloat(totalLimitStr);

  await prisma.market.update({
    where: { id: marketId },
    data
  });

  revalidatePath("/admin/alarms");
  revalidatePath("/admin/matches");
  revalidatePath("/");
}

export async function createMarketTemplate(formData: FormData) {
  const name = formData.get("name") as string;
  const type = formData.get("type") as string;
  const allowOnlySingles = formData.get("allowOnlySingles") === "on";
  const defaultUserLimitStr = formData.get("defaultUserLimit") as string;
  const defaultTotalLimitStr = formData.get("defaultTotalLimit") as string;

  if (!name || !type) return;

  await prisma.marketTemplate.create({
    data: {
      name,
      type,
      allowOnlySingles,
      defaultUserLimit: defaultUserLimitStr ? parseFloat(defaultUserLimitStr) : null,
      defaultTotalLimit: defaultTotalLimitStr ? parseFloat(defaultTotalLimitStr) : null
    }
  });

  revalidatePath("/admin/templates");
  revalidatePath("/admin/matches");
}

export async function deleteMarketTemplate(id: string) {
  if (!id) return;
  await prisma.marketTemplate.delete({ where: { id } });
  revalidatePath("/admin/templates");
  revalidatePath("/admin/matches");
}

export async function createMarketFromTemplate(formData: FormData) {
  const templateId = formData.get("templateId") as string;
  const matchId = formData.get("matchId") as string;

  if (!templateId || !matchId) return;

  const template = await prisma.marketTemplate.findUnique({ where: { id: templateId } });
  if (!template) return;

  await prisma.market.create({
    data: {
      name: template.name,
      type: template.type,
      matchId,
      allowOnlySingles: template.allowOnlySingles,
      userLimit: template.defaultUserLimit,
      totalLimit: template.defaultTotalLimit,
      status: "Open"
    }
  });

  revalidatePath("/admin/matches");
}
