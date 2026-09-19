import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "../lib/prisma";
import { ensureDatabaseConnection } from "./db-helper";

describe("Financial Engine, Net Profit, and Duplicate Payout Guard", () => {
  beforeEach(async (ctx) => {
    await ensureDatabaseConnection(ctx);
  });
  it("calculates real Net Profit based on database records", async () => {
    const [payments, expenses, payouts] = await Promise.all([
      prisma.payment.findMany({ select: { amountReceived: true } }),
      prisma.expense.findMany({ select: { amount: true } }),
      prisma.creatorPayout.findMany({ where: { status: { in: ["APPROVED", "PAID"] } }, select: { totalPayout: true } }),
    ]);

    const totalRevenue = payments.reduce((acc, p) => acc + p.amountReceived, 0);
    const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
    const totalPayouts = payouts.reduce((acc, p) => acc + p.totalPayout, 0);

    const netProfit = totalRevenue - totalExpenses - totalPayouts;

    expect(typeof netProfit).toBe("number");
    expect(totalRevenue).toBeGreaterThan(0);
    expect(totalExpenses).toBeGreaterThan(0);
  });

  it("CRITICAL RULE: Prevents issuing duplicate payouts for the same video", async () => {
    const creator = await prisma.creator.findFirst();
    const order = await prisma.order.findFirst();
    const video = await prisma.video.findFirst();

    expect(creator).toBeTruthy();
    expect(order).toBeTruthy();
    expect(video).toBeTruthy();

    // Check if an existing payout exists
    const existing = await prisma.creatorPayout.findUnique({
      where: { videoId: video!.id },
    });

    if (!existing) {
      // Create first payout
      await prisma.creatorPayout.create({
        data: {
          creatorId: creator!.id,
          orderId: order!.id,
          videoId: video!.id,
          videoCount: 1,
          contractedRate: 250,
          totalPayout: 250,
          status: "APPROVED",
        },
      });
    }

    // Attempt to create duplicate payout for the exact same videoId
    await expect(
      prisma.creatorPayout.create({
        data: {
          creatorId: creator!.id,
          orderId: order!.id,
          videoId: video!.id,
          videoCount: 1,
          contractedRate: 250,
          totalPayout: 250,
          status: "PENDING",
        },
      })
    ).rejects.toThrow(); // Prisma unique constraint violation!
  });
});
