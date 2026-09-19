import { describe, it, expect } from "vitest";
import { prisma } from "../lib/prisma";

describe("Creator Scheduling & Double-Booking Prevention", () => {
  it("prevents scheduling overlapping confirmed shoots for the same creator on the same date", async () => {
    // 1. Fetch an existing creator and client from seed
    const creator = await prisma.creator.findFirst({ where: { name: "Aarav Mehta" } });
    const client = await prisma.client.findFirst();
    const order = await prisma.order.findFirst();

    expect(creator).toBeTruthy();
    expect(client).toBeTruthy();
    expect(order).toBeTruthy();

    const targetDate = new Date("2026-11-20T10:00:00Z");

    // 2. Create the first confirmed shoot
    const shoot1 = await prisma.shoot.create({
      data: {
        clientId: client!.id,
        orderId: order!.id,
        creatorId: creator!.id,
        shootDate: targetDate,
        shootTime: "10:00 AM - 2:00 PM",
        location: "Studio Bandra West",
        status: "CONFIRMED",
      },
    });
    expect(shoot1.id).toBeTruthy();

    // 3. Attempt to verify conflict detection for overlapping shoot on the same day
    const dayStart = new Date(targetDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(targetDate);
    dayEnd.setHours(23, 59, 59, 999);

    const conflicting = await prisma.shoot.findFirst({
      where: {
        creatorId: creator!.id,
        status: { in: ["CONFIRMED", "SCHEDULED", "IN_PROGRESS"] },
        shootDate: { gte: dayStart, lte: dayEnd },
      },
    });

    // Expect conflict to be caught
    expect(conflicting).toBeTruthy();
    expect(conflicting?.id).toBe(shoot1.id);

    // Clean up
    await prisma.shoot.delete({ where: { id: shoot1.id } });
  });
});
