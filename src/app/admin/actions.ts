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
