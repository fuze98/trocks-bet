import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding ...`);

  // Admin User: GymJones
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { username: 'GymJones' },
    update: {},
    create: {
      username: 'GymJones',
      passwordHash: adminPassword,
      balance: 1000000.0,
      isAdmin: true,
    },
  });
  console.log(`Created admin user with id: ${admin.id}`);

  // Initial Sport: Golf
  const golf = await prisma.sport.upsert({
    where: { name: 'Golf' },
    update: {},
    create: {
      name: 'Golf',
    },
  });
  console.log(`Created sport with id: ${golf.id}`);

  console.log(`Seeding finished.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
