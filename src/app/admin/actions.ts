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
  const homeTeamId = formData.get("homeTeamId") as string;
  const awayTeamId = formData.get("awayTeamId") as string;
  const leagueId = formData.get("leagueId") as string;
  const startTimeStr = formData.get("startTime") as string;

  if (!leagueId || !startTimeStr || (!name && (!homeTeamId || !awayTeamId))) return;

  await prisma.match.create({
    data: {
      name: name || null,
      homeTeamId: homeTeamId || null,
      awayTeamId: awayTeamId || null,
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
  const matchId = formData.get("matchId") as string;
  const isTemplate = formData.get("isTemplate") === "true";

  if (!matchId) return;

  if (isTemplate) {
    const templateId = formData.get("templateId") as string;
    const lineStr = formData.get("line") as string;
    const player = formData.get("player") as string;
    const baseOddsStr = formData.get("baseOdds") as string;

    if (!templateId) return;

    const template = await prisma.marketTemplate.findUnique({ where: { id: templateId } });
    const match = await prisma.match.findUnique({ where: { id: matchId }, include: { homeTeam: true, awayTeam: true } });

    if (!template || !match) return;

    const line = lineStr ? parseFloat(lineStr) : 0;
    const inverseLine = line > 0 ? `-${line}` : `+${Math.abs(line)}`;
    const lineSign = line > 0 ? `+${line}` : `${line}`;

    const replacements: Record<string, string> = {
      "{home}": match.homeTeam?.name || "Home",
      "{away}": match.awayTeam?.name || "Away",
      "{player}": player || "Player",
      "{line}": lineSign,
      "{inverse_line}": inverseLine,
    };

    const marketName = `${template.name}${lineStr ? ` ${lineSign}` : ''}${player ? ` - ${player}` : ''}`;
    const baseOdds = parseFloat(baseOddsStr) || 1.90;

    await prisma.$transaction(async (tx) => {
      const market = await tx.market.create({
        data: {
          name: marketName,
          type: template.type,
          matchId,
          allowOnlySingles: template.allowOnlySingles,
          userLimit: template.defaultUserLimit,
          totalLimit: template.defaultTotalLimit,
          status: "Open"
        }
      });

      for (const format of template.outcomesFormat) {
        let outcomeName = format;
        for (const [key, val] of Object.entries(replacements)) {
          outcomeName = outcomeName.replace(new RegExp(key, "g"), val);
        }

        await tx.marketOutcome.create({
          data: {
            name: outcomeName.trim(),
            marketId: market.id,
            oddsDecimal: baseOdds,
            status: "Pending"
          }
        });
      }
    });

  } else {
    // Custom market creation
    const name = formData.get("name") as string;
    const type = formData.get("type") as string;
    const allowOnlySingles = formData.get("allowOnlySingles") === "on";

    if (!name) return;

    await prisma.market.create({
      data: {
        name,
        matchId,
        type: type || null,
        allowOnlySingles,
        status: "Open"
      }
    });
  }

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

export async function updateMarketStatus(formData: FormData) {
  const marketId = formData.get("marketId") as string;
  const status = formData.get("status") as string;

  if (!marketId || !status) return;

  await prisma.market.update({
    where: { id: marketId },
    data: { status },
  });

  revalidatePath("/admin/matches");
}

export async function deleteMarket(formData: FormData) {
  const marketId = formData.get("marketId") as string;

  if (!marketId) return;

  await prisma.market.delete({
    where: { id: marketId },
  });

  revalidatePath("/admin/matches");
}
