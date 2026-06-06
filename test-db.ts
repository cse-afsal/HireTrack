import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

async function main() {
  const interviews = await db.interview.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log("Latest interviews:", interviews);
  
  const user = await db.user.findFirst();
  console.log("First user:", user);
}

main().catch(console.error).finally(() => db.$disconnect());
