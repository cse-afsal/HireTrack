import { PrismaClient } from "@prisma/client";
import config from "./prisma.config.js";

async function main() {
  try {
    const prisma = new PrismaClient(config);
    console.log("Client constructed.");
  } catch(e) {
    console.error("Failed:", e);
  }
}
main();
