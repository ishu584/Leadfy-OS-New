const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding LEADYFY OS database...");

  // Safe Idempotency Check: Do not overwrite or delete existing records
  const existingUsersCount = await prisma.user.count();
  if (existingUsersCount > 0) {
    console.log(`✓ Database already initialized (${existingUsersCount} existing users found).`);
    console.log("  Skipping seed to protect existing data and preserve user accounts.");
    return;
  }

  const defaultPassword = await bcrypt.hash("Password123!", 10);

  // 1. Create Core Users
  const owner = await prisma.user.create({
    data: {
      email: "owner@leadyfy.com",
      passwordHash: defaultPassword,
      name: "Marcus Vance (Owner)",
      role: "OWNER",
      active: true,
    },
  });

  const admin = await prisma.user.create({
    data: {
      email: "admin@leadyfy.com",
      passwordHash: defaultPassword,
      name: "Elena Rostova (Operations Admin)",
      role: "ADMIN",
      active: true,
    },
  });

  const salesUser = await prisma.user.create({
    data: {
      email: "sales@leadyfy.com",
      passwordHash: defaultPassword,
      name: "Sarah Jenkins (Sales Lead)",
      role: "EMPLOYEE",
      employeeRole: "SALES",
      active: true,
    },
  });

  const writerUser = await prisma.user.create({
    data: {
      email: "writer@leadyfy.com",
      passwordHash: defaultPassword,
      name: "David Chen (Senior Scriptwriter)",
      role: "EMPLOYEE",
      employeeRole: "SCRIPT_WRITER",
      active: true,
    },
  });

  const shootManagerUser = await prisma.user.create({
    data: {
      email: "shoot@leadyfy.com",
      passwordHash: defaultPassword,
      name: "Chloe Bennett (Shoot Director)",
      role: "EMPLOYEE",
      employeeRole: "SHOOT_MANAGER",
      active: true,
    },
  });

  const editorUser = await prisma.user.create({
    data: {
      email: "editor@leadyfy.com",
      passwordHash: defaultPassword,
      name: "Alex Rivera (Lead Video Editor)",
      role: "EMPLOYEE",
      employeeRole: "EDITOR",
      active: true,
    },
  });

  const clientUser = await prisma.user.create({
    data: {
      email: "client@lumina.com",
      passwordHash: defaultPassword,
      name: "Sophia Carter (Brand VP)",
      role: "CLIENT",
      active: true,
    },
  });

  // 2. Create Employee Profiles with confidential salaries
  await prisma.employee.create({
    data: {
      userId: salesUser.id,
      employeeCode: "EMP-SALES-01",
      roleType: "SALES",
      salary: 65000,
      joiningDate: new Date("2024-01-15"),
      department: "Client Growth & Acquisitions",
    },
  });

  await prisma.employee.create({
    data: {
      userId: writerUser.id,
      employeeCode: "EMP-SCR-02",
      roleType: "SCRIPT_WRITER",
      salary: 58000,
      joiningDate: new Date("2024-02-01"),
      department: "Creative Writing",
    },
  });

  await prisma.employee.create({
    data: {
      userId: shootManagerUser.id,
      employeeCode: "EMP-SHT-03",
      roleType: "SHOOT_MANAGER",
      salary: 62000,
      joiningDate: new Date("2024-02-15"),
      department: "Production & Logistics",
    },
  });

  await prisma.employee.create({
    data: {
      userId: editorUser.id,
      employeeCode: "EMP-EDT-04",
      roleType: "EDITOR",
      salary: 60000,
      joiningDate: new Date("2024-03-01"),
      department: "Post-Production",
    },
  });

  // 3. Create Clients
  const luminaClient = await prisma.client.create({
    data: {
      userId: clientUser.id,
      name: "Sophia Carter",
      companyName: "Lumina Glow Skincare Pvt Ltd", // Canonical companyName
      email: "client@lumina.com",
      phone: "+1 (555) 234-5678",
      whatsapp: "+1 (555) 234-5678",
      brandName: "Lumina Glow",
      industry: "Beauty & D2C Cosmetics",
      taxId: "GST-LUMINA-8899",
      assignedEmployeeId: salesUser.id,
      source: "Inbound Marketing",
      status: "ACTIVE",
      assets: "https://drive.google.com/drive/folders/lumina-brand-kit-sample",
    },
  });

  const novaClient = await prisma.client.create({
    data: {
      name: "Liam O'Connor",
      companyName: "Nova Energy Supplements Inc", // Canonical companyName
      email: "liam@novaenergy.io",
      phone: "+1 (555) 876-5432",
      whatsapp: "+1 (555) 876-5432",
      brandName: "Nova Energy",
      industry: "Health & Wellness",
      taxId: "GST-NOVA-1024",
      assignedEmployeeId: salesUser.id,
      source: "Referral",
      status: "ONBOARDING",
    },
  });

  // 4. Create Creators
  const creatorAarav = await prisma.creator.create({
    data: {
      name: "Aarav Mehta",
      gender: "Male",
      ageGroup: "22-28",
      languages: "English, Hindi",
      location: "Mumbai, MH",
      niches: "Skincare, Grooming, D2C Tech",
      demographics: "Gen Z & Millennial urban audience",
      phone: "+91 98765 43210",
      email: "aarav.ugc@example.com",
      rates: 250,
      bankDetails: "aarav@upi / HDFC0001234",
      portfolioLinks: "https://instagram.com/aarav_creates",
      availabilityStatus: "AVAILABLE",
    },
  });

  const creatorPriya = await prisma.creator.create({
    data: {
      name: "Priya Sharma",
      gender: "Female",
      ageGroup: "25-32",
      languages: "English, Hindi, Marathi",
      location: "Delhi NCR",
      niches: "Fitness, Wellness, Skincare",
      demographics: "Tier 1 Working Professionals",
      phone: "+91 98111 22334",
      email: "priya.ugc@example.com",
      rates: 300,
      bankDetails: "priya@upi / ICIC0005678",
      portfolioLinks: "https://tiktok.com/@priya_wellness",
      availabilityStatus: "AVAILABLE",
    },
  });

  // 5. Create Orders
  const luminaOrder = await prisma.order.create({
    data: {
      clientId: luminaClient.id,
      packageName: "Scale UGC 10-Pack",
      contractedVideoCount: 10,
      pricing: 2500,
      taxAmount: 450,
      totalAmount: 2950,
      amountReceived: 2950,
      outstandingBalance: 0,
      startDate: new Date("2025-01-10"),
      dueDate: new Date("2025-02-28"),
      assignedTeamId: writerUser.id,
      status: "IN_PRODUCTION",
    },
  });

  const novaOrder = await prisma.order.create({
    data: {
      clientId: novaClient.id,
      packageName: "Starter UGC 4-Pack",
      contractedVideoCount: 4,
      pricing: 1200,
      taxAmount: 216,
      totalAmount: 1416,
      amountReceived: 700,
      outstandingBalance: 716,
      startDate: new Date("2025-02-01"),
      dueDate: new Date("2025-03-15"),
      assignedTeamId: salesUser.id,
      status: "ONBOARDING",
    },
  });

  // 6. Create Scripts
  const script1 = await prisma.script.create({
    data: {
      clientId: luminaClient.id,
      orderId: luminaOrder.id,
      videoNumber: 1,
      writerId: writerUser.id,
      creatorId: creatorAarav.id,
      language: "English",
      scriptText: `[HOOK - 0:00 to 0:03]:
"Stop scrolling if you have dull winter skin!" (Creator touches face in mirror)

[PROBLEM - 0:03 to 0:10]:
"I tried 5 different serums and none worked, until my dermatologist told me about Lumina Glow Vitamin C."

[SOLUTION & DEMO - 0:10 to 0:25]:
(Applies 3 drops directly onto cheek. Smooth glass-skin transition shot)
"It absorbs in 5 seconds with zero sticky residue and 10% active ascorbyl glucoside."

[CTA - 0:25 to 0:30]:
"Tap the link below to get 20% off your first bottle before it sells out again."`,
      referenceLinks: "https://example.com/tiktok-ref-hook-1",
      deadline: new Date("2025-02-15"),
      revisionCount: 1,
      status: "APPROVED",
    },
  });

  const script2 = await prisma.script.create({
    data: {
      clientId: luminaClient.id,
      orderId: luminaOrder.id,
      videoNumber: 2,
      writerId: writerUser.id,
      creatorId: creatorAarav.id,
      language: "English",
      scriptText: `[HOOK]:
"Here is the exact nighttime routine that cleared my hyperpigmentation in 30 days."

[BODY]:
"Double cleanse, gentle toner, then lock in moisture with Lumina Barrier Ceramide Balm. Watch how glowing my skin looks waking up."

[CTA]:
"Available online today with 30-day money-back guarantee."`,
      deadline: new Date("2025-02-18"),
      revisionCount: 0,
      status: "READY_FOR_SHOOT",
    },
  });

  const script3 = await prisma.script.create({
    data: {
      clientId: luminaClient.id,
      orderId: luminaOrder.id,
      videoNumber: 3,
      writerId: writerUser.id,
      language: "English",
      scriptText: `[HOOK]: "Does this viral sunscreen stick leave a white cast on darker skin tones? Let's test it in direct sunlight!"`,
      deadline: new Date("2025-02-25"),
      revisionCount: 0,
      status: "SENT_TO_CLIENT",
    },
  });

  // 7. Create Script Comment
  await prisma.scriptComment.create({
    data: {
      scriptId: script1.id,
      authorId: clientUser.id,
      authorRole: "CLIENT",
      commentText: "Hook looks punchy! Approved for shoot.",
    },
  });

  // 8. Create Shoot
  const shootDate = new Date();
  shootDate.setDate(shootDate.getDate() + 3);

  const shoot1 = await prisma.shoot.create({
    data: {
      clientId: luminaClient.id,
      orderId: luminaOrder.id,
      creatorId: creatorAarav.id,
      shootManagerId: shootManagerUser.id,
      shootDate: shootDate,
      shootTime: "11:00 AM - 3:00 PM",
      location: "Studio 4A, Bandra West, Mumbai",
      approvedScriptIds: JSON.stringify([script1.id, script2.id]),
      specialNotes: "Lighting must emphasize glass-skin glow. Bring 2 unopened product units for unboxing b-roll.",
      status: "CONFIRMED",
      preShootChecklist: JSON.stringify({
        scriptApproval: true,
        creatorConfirmation: true,
        locationPermissions: true,
        clientProductReceipt: true,
        teamBriefing: true,
      }),
      postShootVerification: JSON.stringify({
        footageUploaded: true,
        rawFileIntegrity: true,
        reshootFlag: false,
      }),
    },
  });

  // 9. Create Videos
  const video1 = await prisma.video.create({
    data: {
      clientId: luminaClient.id,
      orderId: luminaOrder.id,
      scriptId: script1.id,
      creatorId: creatorAarav.id,
      shootId: shoot1.id,
      assignedEditorId: editorUser.id,
      deadline: new Date("2025-02-20"),
      rawFootageUrl: "https://drive.google.com/drive/folders/lumina-raw-v1",
      editDraftUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      thumbnail: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&auto=format&fit=crop&q=60",
      revisionCount: 1,
      status: "CLIENT_REVIEW",
    },
  });

  const video2 = await prisma.video.create({
    data: {
      clientId: luminaClient.id,
      orderId: luminaOrder.id,
      scriptId: script2.id,
      creatorId: creatorAarav.id,
      shootId: shoot1.id,
      assignedEditorId: editorUser.id,
      rawFootageUrl: "https://drive.google.com/drive/folders/lumina-raw-v2",
      editDraftUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      finalDeliveryUrl: "https://drive.google.com/drive/folders/lumina-final-v2",
      revisionCount: 0,
      status: "FINAL_APPROVED",
      finalApprovedAt: new Date("2025-02-14"),
    },
  });

  // 10. Create Timestamped Video Feedback
  await prisma.videoFeedback.create({
    data: {
      videoId: video1.id,
      authorId: clientUser.id,
      authorName: "Sophia Carter (Client)",
      timestampCode: "00:14",
      feedbackText: "Please make the serum dropper close-up 1 second longer and brighten the contrast.",
      revisionNumber: 1,
    },
  });

  // 11. Create Payments
  await prisma.payment.create({
    data: {
      orderId: luminaOrder.id,
      clientId: luminaClient.id,
      invoiceAmount: 2950,
      amountReceived: 2950,
      pendingBalance: 0,
      paymentMethod: "Bank Wire Transfer",
      transactionRef: "TXN-LUM-20250110",
      notes: "Full payment received upon onboarding confirmation.",
      status: "PAID",
    },
  });

  await prisma.payment.create({
    data: {
      orderId: novaOrder.id,
      clientId: novaClient.id,
      invoiceAmount: 1416,
      amountReceived: 700,
      pendingBalance: 716,
      paymentMethod: "Stripe",
      transactionRef: "ch_3Nva102938",
      notes: "50% upfront deposit received. Remaining balance due on final delivery.",
      status: "PARTIALLY_PAID",
    },
  });

  // 12. Create Expenses
  await prisma.expense.create({
    data: {
      category: "STUDIO",
      amount: 450,
      recordedById: admin.id,
      notes: "Studio 4A half-day rental booking with lighting kit",
      date: new Date(),
    },
  });

  await prisma.expense.create({
    data: {
      category: "EQUIPMENT",
      amount: 180,
      recordedById: shootManagerUser.id,
      notes: "Wireless lavalier microphone kit rental & props",
      date: new Date(),
    },
  });

  // 13. Create Creator Payout
  await prisma.creatorPayout.create({
    data: {
      creatorId: creatorAarav.id,
      orderId: luminaOrder.id,
      videoId: video2.id,
      videoCount: 1,
      contractedRate: 250,
      totalPayout: 250,
      paymentDate: new Date(),
      transactionRef: "UPI-PAY-987123",
      status: "APPROVED",
    },
  });

  // 14. Create Tasks
  await prisma.task.create({
    data: {
      title: "Review draft edit cut for Lumina Video #1",
      description: "Verify color grading matches brand palette and check client revision notes at 00:14.",
      assigneeId: editorUser.id,
      priority: "URGENT",
      deadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
      status: "IN_PROGRESS",
    },
  });

  await prisma.task.create({
    data: {
      title: "Schedule creator fitting and product dispatch for Nova Energy",
      description: "Send 3 cans of Nova Energy Citrus Blast to Priya Sharma for script testing.",
      assigneeId: shootManagerUser.id,
      priority: "HIGH",
      deadline: new Date(Date.now() + 48 * 60 * 60 * 1000),
      status: "TO_DO",
    },
  });

  // 15. Create Support Ticket
  const ticket = await prisma.supportTicket.create({
    data: {
      clientId: luminaClient.id,
      subject: "Requesting additional aspect ratio cuts (4:5 and 16:9)",
      message: "Hi team, we would love to run Video #2 on Facebook and YouTube Shorts as well. Can we get 4:5 and 16:9 crops?",
      priority: "MEDIUM",
      status: "IN_PROGRESS",
      assignedToId: admin.id,
    },
  });

  await prisma.ticketResponse.create({
    data: {
      ticketId: ticket.id,
      authorId: admin.id,
      authorName: "Elena Rostova (Admin)",
      authorRole: "ADMIN",
      message: "Hello Sophia! Absolutely, Alex (our lead editor) will render the 4:5 and 16:9 cuts alongside the final 9:16 master today.",
    },
  });

  // 16. Create Initial Notifications
  await prisma.notification.create({
    data: {
      recipientId: editorUser.id,
      type: "VIDEO_REVISION",
      title: "Client Feedback Received",
      message: "Lumina Glow has provided timestamped revision notes for Video #1.",
      entityType: "VIDEO",
      entityId: video1.id,
    },
  });

  await prisma.notification.create({
    data: {
      recipientId: owner.id,
      type: "PAYMENT_RECORDED",
      title: "Payment Received ($2,950)",
      message: "Full payment received for Lumina Glow Scale UGC 10-Pack.",
      entityType: "PAYMENT",
      entityId: luminaOrder.id,
    },
  });

  // 17. Create Initial Activity Logs
  await prisma.activityLog.create({
    data: {
      actorId: admin.id,
      actorName: "Elena Rostova",
      action: "CLIENT_ONBOARDED",
      entityType: "CLIENT",
      entityId: luminaClient.id,
      metadata: JSON.stringify({ companyName: luminaClient.companyName, status: "ACTIVE" }),
    },
  });

  await prisma.activityLog.create({
    data: {
      actorId: clientUser.id,
      actorName: "Sophia Carter",
      action: "FEEDBACK_SUBMITTED",
      entityType: "VIDEO",
      entityId: video1.id,
      metadata: JSON.stringify({ timestamp: "00:14", revision: 1 }),
    },
  });

  console.log("Database seeded successfully with all roles, orders, creators, videos, and finances!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
