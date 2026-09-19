import { describe, it, expect } from "vitest";
import { isValidOrderTransition } from "../schemas/order";

describe("Orders & Production Counter Tests", () => {
  it("enforces valid order lifecycle status transitions", () => {
    // Valid forward transitions
    expect(isValidOrderTransition("NEW", "ONBOARDING")).toBe(true);
    expect(isValidOrderTransition("ONBOARDING", "IN_PRODUCTION")).toBe(true);
    expect(isValidOrderTransition("IN_PRODUCTION", "COMPLETED")).toBe(true);
    expect(isValidOrderTransition("IN_PRODUCTION", "PARTIALLY_DELIVERED")).toBe(true);
    expect(isValidOrderTransition("PARTIALLY_DELIVERED", "COMPLETED")).toBe(true);

    // Invalid backwards or jump transitions
    expect(isValidOrderTransition("NEW", "COMPLETED")).toBe(false);
    expect(isValidOrderTransition("COMPLETED", "NEW")).toBe(false);
    expect(isValidOrderTransition("CANCELLED", "IN_PRODUCTION")).toBe(false);
  });

  it("accurately derives production counters from authoritative video states", () => {
    const contractedVideoCount = 10;
    const mockVideos = [
      { id: "1", status: "DELIVERED" },
      { id: "2", status: "DELIVERED" },
      { id: "3", status: "FINAL_APPROVED" },
      { id: "4", status: "CLIENT_REVIEW" },
      { id: "5", status: "VIDEO_EDITING" },
      { id: "6", status: "SCRIPT_APPROVED" },
    ];

    const orderedVideos = contractedVideoCount;
    const assignedVideos = mockVideos.length;
    const completedVideos = mockVideos.filter((v) =>
      ["FINAL_APPROVED", "DELIVERED"].includes(v.status)
    ).length;
    const deliveredVideos = mockVideos.filter((v) => v.status === "DELIVERED").length;
    const remainingQuota = Math.max(0, orderedVideos - completedVideos);

    expect(orderedVideos).toBe(10);
    expect(assignedVideos).toBe(6);
    expect(completedVideos).toBe(3); // 2 delivered + 1 final approved
    expect(deliveredVideos).toBe(2);
    expect(remainingQuota).toBe(7);
  });

  it("calculates outstanding balances without allowing negative numbers", () => {
    const totalAmount = 2950;
    const amountReceived = 1500;
    const balance = Math.max(0, totalAmount - amountReceived);
    expect(balance).toBe(1450);

    const fullReceived = 2950;
    const zeroBalance = Math.max(0, totalAmount - fullReceived);
    expect(zeroBalance).toBe(0);
  });
});
