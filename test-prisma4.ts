import { PrismaClient } from "@prisma/client";
import "dotenv/config";

async function main() {
  try {
    const prisma = new PrismaClient({
      datasourceUrl: process.env.DATABASE_URL,
    });
    console.log("Client constructed.");
  } catch(e) {
    console.error("Failed:", e);
  }
}
main();
