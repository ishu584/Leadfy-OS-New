import { describe, it, expect } from "vitest";
import { isValidVideoTransition } from "../schemas/video";
import { prisma } from "../lib/prisma";
import { ensureDatabaseConnection } from "./db-helper";

describe("9-Stage Video Production Pipeline & Client Review", () => {
  it("enforces strict linear 9-stage transitions", () => {
    expect(isValidVideoTransition("SCRIPT_APPROVED", "SHOOT_PENDING")).toBe(true);
    expect(isValidVideoTransition("SHOOT_PENDING", "RAW_FOOTAGE_RECEIVED")).toBe(true);
    expect(isValidVideoTransition("RAW_FOOTAGE_RECEIVED", "VIDEO_EDITING")).toBe(true);
    expect(isValidVideoTransition("VIDEO_EDITING", "INTERNAL_QA")).toBe(true);
    expect(isValidVideoTransition("INTERNAL_QA", "CLIENT_REVIEW")).toBe(true);
    expect(isValidVideoTransition("CLIENT_REVIEW", "REVISION")).toBe(true);
    expect(isValidVideoTransition("CLIENT_REVIEW", "FINAL_APPROVED")).toBe(true);
    expect(isValidVideoTransition("FINAL_APPROVED", "DELIVERED")).toBe(true);
  });

  it("CRITICAL RULE: Prevents marking DELIVERED without prior FINAL_APPROVED state", () => {
    expect(isValidVideoTransition("VIDEO_EDITING", "DELIVERED")).toBe(false);
    expect(isValidVideoTransition("INTERNAL_QA", "DELIVERED")).toBe(false);
    expect(isValidVideoTransition("CLIENT_REVIEW", "DELIVERED")).toBe(false);
    expect(isValidVideoTransition("REVISION", "DELIVERED")).toBe(false);
    expect(isValidVideoTransition("FINAL_APPROVED", "DELIVERED")).toBe(true);
  });

  it("records timestamped video feedback and increments revision counter", async (ctx) => {
    if (!(await ensureDatabaseConnection(ctx))) return;
    const video = await prisma.video.findFirst();
    const user = await prisma.user.findFirst();
    expect(video).toBeTruthy();
    expect(user).toBeTruthy();

    const previousRevision = video!.revisionCount;

    // Simulate client requesting revision with timestamp
    const feedback = await prisma.videoFeedback.create({
      data: {
        videoId: video!.id,
        authorId: user!.id,
        authorName: user!.name,
        timestampCode: "00:27",
        feedbackText: "Add subtitle highlight on key benefit.",
        revisionNumber: previousRevision + 1,
      },
    });

    const updatedVideo = await prisma.video.update({
      where: { id: video!.id },
      data: {
        status: "REVISION",
        revisionCount: { increment: 1 },
      },
    });

    expect(feedback.timestampCode).toBe("00:27");
    expect(updatedVideo.revisionCount).toBe(previousRevision + 1);
    expect(updatedVideo.status).toBe("REVISION");

    // Clean up
    await prisma.videoFeedback.delete({ where: { id: feedback.id } });
    await prisma.video.update({
      where: { id: video!.id },
      data: { revisionCount: previousRevision, status: video!.status },
    });
  });
});
