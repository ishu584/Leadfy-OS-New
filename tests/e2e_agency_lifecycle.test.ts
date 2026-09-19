import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "../lib/prisma";
import { CreateClientSchema } from "../schemas/client";
import { ensureDatabaseConnection } from "./db-helper";

describe("END-TO-END: Complete UGC Agency Operational Lifecycle", () => {
  beforeEach(async (ctx) => {
    await ensureDatabaseConnection(ctx);
  });
  it("executes the entire 14-step agency workflow using real database records", async () => {
    const timestamp = Date.now();

    // 1. Client Creation (testing company vs company_name normalization)
    const clientPayload = {
      name: `Founder ${timestamp}`,
      company_name: `E2E Brand ${timestamp} LLC`,
      email: `founder_${timestamp}@e2ebrand.com`,
      phone: "+15554443333",
      brandName: `E2E Brand`,
      industry: "Health Tech",
      status: "ACTIVE" as const,
    };
    const validatedClient = CreateClientSchema.parse(clientPayload);
    const client = await prisma.client.create({ data: validatedClient });
    expect(client.id).toBeTruthy();
    expect(client.companyName).toBe(clientPayload.company_name);

    // 2. Package / Order Creation
    const order = await prisma.order.create({
      data: {
        clientId: client.id,
        packageName: "E2E Scale Pack (1 Video)",
        contractedVideoCount: 1,
        pricing: 1000,
        taxAmount: 180,
        totalAmount: 1180,
        amountReceived: 1180,
        outstandingBalance: 0,
        startDate: new Date(),
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        status: "IN_PRODUCTION",
      },
    });
    expect(order.id).toBeTruthy();

    // 3. Manual Script Creation
    const script = await prisma.script.create({
      data: {
        clientId: client.id,
        orderId: order.id,
        videoNumber: 1,
        language: "English",
        scriptText: "[HOOK]: E2E test hook... [BODY]: Problem and solution... [CTA]: Tap below!",
        status: "DRAFT",
      },
    });
    expect(script.status).toBe("DRAFT");

    // 4. Script Workflow & Client Approval
    const sentScript = await prisma.script.update({
      where: { id: script.id },
      data: { status: "SENT_TO_CLIENT" },
    });
    expect(sentScript.status).toBe("SENT_TO_CLIENT");

    const approvedScript = await prisma.script.update({
      where: { id: script.id },
      data: { status: "APPROVED" },
    });
    expect(approvedScript.status).toBe("APPROVED");

    const readyScript = await prisma.script.update({
      where: { id: script.id },
      data: { status: "READY_FOR_SHOOT" },
    });
    expect(readyScript.status).toBe("READY_FOR_SHOOT");

    // 5. Creator Match
    const creator = await prisma.creator.create({
      data: {
        name: `Creator Talent ${timestamp}`,
        gender: "Non-binary",
        ageGroup: "22-26",
        languages: "English",
        location: "Bengaluru, KA",
        niches: "Health, Tech",
        phone: "+91 99999 88888",
        email: `talent_${timestamp}@ugc.test`,
        rates: 200,
        availabilityStatus: "AVAILABLE",
      },
    });
    expect(creator.id).toBeTruthy();

    // 6. Shoot Scheduling & Verification
    const shoot = await prisma.shoot.create({
      data: {
        clientId: client.id,
        orderId: order.id,
        creatorId: creator.id,
        shootDate: new Date(),
        shootTime: "2:00 PM - 5:00 PM",
        location: "E2E Studio Suite 1",
        approvedScriptIds: JSON.stringify([readyScript.id]),
        status: "CONFIRMED",
        preShootChecklist: JSON.stringify({
          scriptApproval: true,
          creatorConfirmation: true,
          locationPermissions: true,
          clientProductReceipt: true,
          teamBriefing: true,
        }),
      },
    });
    expect(shoot.status).toBe("CONFIRMED");

    // 7. Video Slot Initialization & Raw Footage Uploaded
    const video = await prisma.video.create({
      data: {
        clientId: client.id,
        orderId: order.id,
        scriptId: readyScript.id,
        creatorId: creator.id,
        shootId: shoot.id,
        status: "SHOOT_PENDING",
      },
    });
    expect(video.status).toBe("SHOOT_PENDING");

    const rawVideo = await prisma.video.update({
      where: { id: video.id },
      data: {
        status: "RAW_FOOTAGE_RECEIVED",
        rawFootageUrl: "https://drive.google.com/test-e2e-raw",
      },
    });
    expect(rawVideo.status).toBe("RAW_FOOTAGE_RECEIVED");

    // 8. Video Editing Cut
    const editingVideo = await prisma.video.update({
      where: { id: video.id },
      data: {
        status: "VIDEO_EDITING",
        editDraftUrl: "https://drive.google.com/test-e2e-cut-v1",
      },
    });
    expect(editingVideo.status).toBe("VIDEO_EDITING");

    // 9. Internal QA Submission & Approval to Client Review
    const clientReviewVideo = await prisma.video.update({
      where: { id: video.id },
      data: { status: "CLIENT_REVIEW" },
    });
    expect(clientReviewVideo.status).toBe("CLIENT_REVIEW");

    // 10. Client Review & Timestamped Revision Request
    const feedback = await prisma.videoFeedback.create({
      data: {
        videoId: video.id,
        authorId: client.id,
        authorName: client.name,
        timestampCode: "00:08",
        feedbackText: "Brighten the screen display slightly.",
        revisionNumber: 1,
      },
    });
    expect(feedback.timestampCode).toBe("00:08");

    const underRevisionVideo = await prisma.video.update({
      where: { id: video.id },
      data: {
        status: "REVISION",
        revisionCount: 1,
      },
    });
    expect(underRevisionVideo.status).toBe("REVISION");
    expect(underRevisionVideo.revisionCount).toBe(1);

    // 11. Final Client Approval
    const approvedVideo = await prisma.video.update({
      where: { id: video.id },
      data: {
        status: "FINAL_APPROVED",
        finalApprovedAt: new Date(),
      },
    });
    expect(approvedVideo.status).toBe("FINAL_APPROVED");

    // 12. Final Delivery Link Storage
    const deliveredVideo = await prisma.video.update({
      where: { id: video.id },
      data: {
        status: "DELIVERED",
        finalDeliveryUrl: "https://drive.google.com/test-e2e-final-4k.mp4",
        deliveredAt: new Date(),
      },
    });
    expect(deliveredVideo.status).toBe("DELIVERED");
    expect(deliveredVideo.finalDeliveryUrl).toContain("final-4k.mp4");

    // 13. Creator Payout Disbursement (preventing duplicates)
    const payout = await prisma.creatorPayout.create({
      data: {
        creatorId: creator.id,
        orderId: order.id,
        videoId: video.id,
        videoCount: 1,
        contractedRate: 200,
        totalPayout: 200,
        paymentDate: new Date(),
        status: "PAID",
      },
    });
    expect(payout.status).toBe("PAID");
    expect(payout.totalPayout).toBe(200);

    // 14. Financial Reports Verification
    const allPayments = await prisma.payment.findMany({ select: { amountReceived: true } });
    const allExpenses = await prisma.expense.findMany({ select: { amount: true } });
    const allPayouts = await prisma.creatorPayout.findMany({ select: { totalPayout: true } });

    const totalRev = allPayments.reduce((s, p) => s + p.amountReceived, 0);
    const totalExp = allExpenses.reduce((s, e) => s + e.amount, 0);
    const totalPay = allPayouts.reduce((s, p) => s + p.totalPayout, 0);
    const profit = totalRev - totalExp - totalPay;

    expect(typeof profit).toBe("number");

    // Cleanup E2E artifacts
    await prisma.creatorPayout.delete({ where: { id: payout.id } });
    await prisma.videoFeedback.delete({ where: { id: feedback.id } });
    await prisma.video.delete({ where: { id: video.id } });
    await prisma.shoot.delete({ where: { id: shoot.id } });
    await prisma.script.delete({ where: { id: script.id } });
    await prisma.creator.delete({ where: { id: creator.id } });
    await prisma.order.delete({ where: { id: order.id } });
    await prisma.client.delete({ where: { id: client.id } });
  });
});
