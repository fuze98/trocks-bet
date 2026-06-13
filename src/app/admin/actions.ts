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
  const leagueId = formData.get("leagueId") as string;
  const homeTeamId = formData.get("homeTeamId") as string;
  const awayTeamId = formData.get("awayTeamId") as string;
  const startTimeStr = formData.get("startTime") as string;
  const customName = formData.get("customName") as string;

  if (!leagueId || !startTimeStr) return;
  if (!customName && (!homeTeamId || !awayTeamId)) return;

  let name = customName;
  if (!name) {
    const homeTeam = await prisma.team.findUnique({ where: { id: homeTeamId } });
    const awayTeam = await prisma.team.findUnique({ where: { id: awayTeamId } });
    if (homeTeam && awayTeam) {
      name = `${homeTeam.name} - ${awayTeam.name}`;
    } else {
      return;
    }
  }

  await prisma.match.create({
    data: {
      name,
      leagueId,
      homeTeamId: homeTeamId || null,
      awayTeamId: awayTeamId || null,
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
  const outcomesFormatStr = formData.get("outcomesFormat") as string;
  const allowOnlySingles = formData.get("allowOnlySingles") === "on";
  const defaultUserLimitStr = formData.get("defaultUserLimit") as string;
  const defaultTotalLimitStr = formData.get("defaultTotalLimit") as string;

  if (!name || !type) return;

  // Split comma separated outcomes
  const outcomesFormat = outcomesFormatStr ? outcomesFormatStr.split(',').map(s => s.trim()).filter(s => s) : [];

  await prisma.marketTemplate.create({
    data: {
      name,
      type,
      allowOnlySingles,
      outcomesFormat,
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
  const line = formData.get("line") as string;
  const player = formData.get("player") as string;

  if (!templateId || !matchId) return;

  const template = await prisma.marketTemplate.findUnique({ where: { id: templateId } });
  const match = await prisma.match.findUnique({ where: { id: matchId }, include: { homeTeam: true, awayTeam: true } });
  if (!template || !match) return;

  const market = await prisma.market.create({
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

  if (template.outcomesFormat && template.outcomesFormat.length > 0) {
    const outcomesData = template.outcomesFormat.map(fmt => {
      let text = fmt;
      text = text.replace("{home}", match.homeTeam?.name || "Home Team");
      text = text.replace("{away}", match.awayTeam?.name || "Away Team");
      text = text.replace("{line}", line ? (Number(line) > 0 && text.includes("Spread") ? `+${line}` : line) : "");
      text = text.replace("{inverse_line}", line ? (Number(line) * -1 > 0 ? `+${Number(line) * -1}` : String(Number(line) * -1)) : "");
      text = text.replace("{player}", player || "");

      return {
        name: text.trim(),
        marketId: market.id,
        oddsDecimal: 1.91, // Default odds
        status: "Pending"
      };
    });

    await prisma.marketOutcome.createMany({
      data: outcomesData
    });
  }

  revalidatePath("/admin/matches");
}

export async function createTeam(formData: FormData) {
  const name = formData.get("name") as string;
  const leagueId = formData.get("leagueId") as string;

  if (!name || !leagueId) return;

  await prisma.team.create({
    data: { name, leagueId },
  });

  revalidatePath("/admin/sports");
}

export async function deleteTeam(id: string) {
  await prisma.team.delete({
    where: { id },
  });
  revalidatePath("/admin/sports");
}
