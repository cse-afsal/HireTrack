import { db } from "./src/lib/db";

async function main() {
  try {
    const guestEmail = `guest_${Math.random().toString(36).substring(7)}@example.com`;
    const user = await db.user.create({
      data: {
        name: "Guest User",
        email: guestEmail,
      }
    });
    console.log("Creation successful:", user);
  } catch (e) {
    console.error("Creation failed:", e);
  }
}

main();
