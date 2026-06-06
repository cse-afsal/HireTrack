import { PrismaClient } from "@prisma/client";

async function main() {
  try {
    const prisma = new PrismaClient({});
    console.log("Creation successful");
  } catch (e) {
    console.error("Creation failed:", e);
  }
}

main();
