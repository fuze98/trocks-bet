const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const sport = await prisma.sport.create({ data: { name: 'Football' } });
  const league = await prisma.league.create({ data: { name: 'NFL', sportId: sport.id } });

  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 1);

  const match = await prisma.match.create({
    data: {
      name: 'Eagles vs Cowboys',
      leagueId: league.id,
      startTime: futureDate,
      status: 'Scheduled'
    }
  });

  const market = await prisma.market.create({
    data: { name: 'Moneyline', matchId: match.id }
  });

  await prisma.marketOutcome.createMany({
    data: [
      { name: 'Eagles', marketId: market.id, oddsDecimal: 1.9 },
      { name: 'Cowboys', marketId: market.id, oddsDecimal: 2.1 }
    ]
  });

  console.log('Seeded successfully!');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
