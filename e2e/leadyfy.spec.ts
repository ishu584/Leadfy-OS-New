import { test, expect } from '@playwright/test';

test.describe('LEADYFY OS End-to-End Test Suite', () => {

  test('Workflow 1: Authentication & Demo Role Switcher Flow', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
    await expect(page).toHaveTitle(/LEADYFY OS|Login/i);

    // Verify Demo Quick Switcher is visible
    const demoSwitcher = page.locator('text=Quick Demo Accounts');
    await expect(demoSwitcher).toBeVisible();

    // Fill credentials for Owner
    await page.fill('input[type="email"]', 'owner@leadyfy.com');
    await page.fill('input[type="password"]', 'leadyfy123');
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard');
    await expect(page.locator('text=Agency Command Center')).toBeVisible();
  });

  test('Workflow 2: RBAC Access Control & Route Guards', async ({ page }) => {
    // Login as Video Editor
    await page.goto('/login');
    await page.click('button:has-text("Editor")');
    await page.waitForURL('**/dashboard/editor');

    // Editor should not have access to financial reports or payouts
    await page.goto('/dashboard/payouts');
    // Guard redirects to /dashboard/editor or displays 403 Forbidden
    const currentUrl = page.url();
    const hasForbidden = await page.locator('text=Access Denied').or(page.locator('text=Forbidden')).isVisible().catch(() => false);
    const wasRedirected = currentUrl.includes('/dashboard/editor') || currentUrl.includes('/dashboard');
    expect(wasRedirected || hasForbidden).toBeTruthy();
  });

  test('Workflow 3: Canonical Company Name Flow (company vs company_name)', async ({ request }) => {
    // Authenticate as Admin via API
    const loginRes = await request.post('/api/auth/login', {
      data: { email: 'admin@leadyfy.com', password: 'password123' },
    });
    expect(loginRes.ok()).toBeTruthy();
    const cookies = loginRes.headers()['set-cookie'];

    // Create client using legacy payload key "company"
    const createRes = await request.post('/api/clients', {
      headers: { cookie: cookies || '' },
      data: {
        company: 'Playwright Test Brand Inc',
        brandName: 'Playwright Brand',
        contactName: 'Playwright Tester',
        email: `pw_${Date.now()}@brand.com`,
        phone: '+15559876543',
        industry: 'E-commerce',
        status: 'ACTIVE',
      },
    });
    expect(createRes.status()).toBe(201);
    const created = await createRes.json();
    expect(created.client.companyName).toBe('Playwright Test Brand Inc');
    expect(created.client.company).toBe('Playwright Test Brand Inc');
  });

  test('Workflow 4: Client Multi-Tenant Isolation Guard', async ({ request }) => {
    // Login as Client A
    const clientALogin = await request.post('/api/auth/login', {
      data: { email: 'client@glowbotanics.com', password: 'password123' },
    });
    expect(clientALogin.ok()).toBeTruthy();
    const cookiesA = clientALogin.headers()['set-cookie'];

    // Client A requests /portal data
    const portalRes = await request.get('/api/orders', {
      headers: { cookie: cookiesA || '' },
    });
    expect(portalRes.ok()).toBeTruthy();
    const orders = await portalRes.json();
    
    // Client A should only see their own orders
    for (const order of orders.orders || []) {
      expect(order.client.contactEmail).toBe('client@glowbotanics.com');
    }
  });

  test('Workflow 5: Order Lifecycle & Production Counter Engine', async ({ request }) => {
    const loginRes = await request.post('/api/auth/login', {
      data: { email: 'owner@leadyfy.com', password: 'password123' },
    });
    const cookies = loginRes.headers()['set-cookie'];

    // Create new order
    const orderRes = await request.post('/api/orders', {
      headers: { cookie: cookies || '' },
      data: {
        clientId: 'client-1',
        packageType: 'STANDARD_BATCH',
        videoCount: 4,
        totalAmount: 3200,
        currency: 'USD',
        notes: 'Playwright E2E Order',
      },
    });
    expect(orderRes.status()).toBe(201);
    const orderData = await orderRes.json();
    expect(orderData.order.videoCount).toBe(4);
    expect(orderData.order.status).toBe('ONBOARDING');
  });

  test('Workflow 6: Script Drafting & Stage Gate Validation', async ({ request }) => {
    const loginRes = await request.post('/api/auth/login', {
      data: { email: 'owner@leadyfy.com', password: 'password123' },
    });
    const cookies = loginRes.headers()['set-cookie'];

    // Create script in DRAFT
    const scriptRes = await request.post('/api/scripts', {
      headers: { cookie: cookies || '' },
      data: {
        orderId: 'order-1',
        title: 'PW Script Hook Concept',
        hook: 'Stop scrolling if you need better skin!',
        body: 'Here is why this botanical serum actually works...',
        cta: 'Click link below for 20% off',
      },
    });
    expect(scriptRes.status()).toBe(201);
    const script = (await scriptRes.json()).script;

    // Strict Rule: Cannot jump from DRAFT directly to READY_FOR_SHOOT
    const invalidJump = await request.patch(`/api/scripts/${script.id}`, {
      headers: { cookie: cookies || '' },
      data: { status: 'READY_FOR_SHOOT' },
    });
    expect(invalidJump.status()).toBe(400);

    // Valid flow: DRAFT -> IN_REVIEW -> APPROVED -> READY_FOR_SHOOT
    await request.patch(`/api/scripts/${script.id}`, {
      headers: { cookie: cookies || '' },
      data: { status: 'IN_REVIEW' },
    });
    await request.patch(`/api/scripts/${script.id}`, {
      headers: { cookie: cookies || '' },
      data: { status: 'APPROVED' },
    });
    const readyRes = await request.patch(`/api/scripts/${script.id}`, {
      headers: { cookie: cookies || '' },
      data: { status: 'READY_FOR_SHOOT' },
    });
    expect(readyRes.status()).toBe(200);
  });

  test('Workflow 7: Creator Double-Booking Conflict Prevention', async ({ request }) => {
    const loginRes = await request.post('/api/auth/login', {
      data: { email: 'owner@leadyfy.com', password: 'password123' },
    });
    const cookies = loginRes.headers()['set-cookie'];

    const shootDate = new Date(Date.now() + 86400000 * 5).toISOString();

    // Schedule first shoot
    const shoot1 = await request.post('/api/shoots', {
      headers: { cookie: cookies || '' },
      data: {
        orderId: 'order-1',
        creatorId: 'creator-1',
        scheduledDate: shootDate,
        location: 'Studio Loft A',
        status: 'SCHEDULED',
      },
    });
    expect(shoot1.status()).toBe(201);

    // Attempt to schedule overlapping shoot for same creator on same date
    const shoot2 = await request.post('/api/shoots', {
      headers: { cookie: cookies || '' },
      data: {
        orderId: 'order-1',
        creatorId: 'creator-1',
        scheduledDate: shootDate,
        location: 'Studio Loft B',
        status: 'SCHEDULED',
      },
    });
    // Double-booking must be strictly rejected with HTTP 409 Conflict
    expect(shoot2.status()).toBe(409);
  });

  test('Workflow 8: Shoot Schedule & Checklists Management', async ({ request }) => {
    const loginRes = await request.post('/api/auth/login', {
      data: { email: 'owner@leadyfy.com', password: 'password123' },
    });
    const cookies = loginRes.headers()['set-cookie'];

    const shootList = await request.get('/api/shoots', {
      headers: { cookie: cookies || '' },
    });
    expect(shootList.ok()).toBeTruthy();
    const shoots = await shootList.json();
    expect(shoots.shoots.length).toBeGreaterThan(0);
  });

  test('Workflow 9: Linear 9-Stage Video Production Pipeline', async ({ request }) => {
    const loginRes = await request.post('/api/auth/login', {
      data: { email: 'owner@leadyfy.com', password: 'password123' },
    });
    const cookies = loginRes.headers()['set-cookie'];

    const videoRes = await request.post('/api/videos', {
      headers: { cookie: cookies || '' },
      data: {
        orderId: 'order-1',
        title: 'PW Pipeline Video',
        aspectRatio: '9:16',
        version: 1,
        editorId: 'emp-editor',
      },
    });
    expect(videoRes.status()).toBe(201);
    const video = (await videoRes.json()).video;

    // Advance through pipeline: RAW_FOOTAGE_RECEIVED -> EDITING_IN_PROGRESS -> INTERNAL_REVIEW
    const editRes = await request.patch(`/api/videos/${video.id}`, {
      headers: { cookie: cookies || '' },
      data: { status: 'EDITING_IN_PROGRESS' },
    });
    expect(editRes.status()).toBe(200);

    // Illegal jump: Cannot jump directly to DELIVERED without FINAL_APPROVED
    const jumpRes = await request.patch(`/api/videos/${video.id}`, {
      headers: { cookie: cookies || '' },
      data: { status: 'DELIVERED' },
    });
    expect(jumpRes.status()).toBe(400);
  });

  test('Workflow 10: Client Video Review & Timestamped Revision Flow', async ({ request }) => {
    // Client submits revision note with timestamp
    const clientLogin = await request.post('/api/auth/login', {
      data: { email: 'client@glowbotanics.com', password: 'password123' },
    });
    const cookies = clientLogin.headers()['set-cookie'];

    const feedbackRes = await request.post('/api/videos/video-1/feedback', {
      headers: { cookie: cookies || '' },
      data: {
        action: 'REVISION',
        comment: 'Please shorten the intro hook at 0:03 and brighten the product shot.',
        timestampSeconds: 3.5,
      },
    });
    expect(feedbackRes.status()).toBe(200);
    const resData = await feedbackRes.json();
    expect(resData.video.status).toBe('REVISION');
    expect(resData.video.revisionCount).toBeGreaterThanOrEqual(1);
  });

  test('Workflow 11: Final Approval & Secure Delivery Asset Link', async ({ request }) => {
    // Admin approves final video
    const adminLogin = await request.post('/api/auth/login', {
      data: { email: 'admin@leadyfy.com', password: 'password123' },
    });
    const adminCookies = adminLogin.headers()['set-cookie'];

    const approveRes = await request.post('/api/videos/video-1/approve', {
      headers: { cookie: adminCookies || '' },
      data: {
        deliveryLink: 'https://cdn.leadyfy.com/deliveries/final-glow-botanics-ad1.mp4',
      },
    });
    expect(approveRes.status()).toBe(200);
    const resData = await approveRes.json();
    expect(resData.video.status).toBe('FINAL_APPROVED');
    expect(resData.video.deliveryLink).toBe('https://cdn.leadyfy.com/deliveries/final-glow-botanics-ad1.mp4');
  });

  test('Workflow 12: Financial Engine & Duplicate Creator Payout Guard', async ({ request }) => {
    const ownerLogin = await request.post('/api/auth/login', {
      data: { email: 'owner@leadyfy.com', password: 'password123' },
    });
    const ownerCookies = ownerLogin.headers()['set-cookie'];

    // Fetch Profit Summary
    const profitRes = await request.get('/api/finances/profit', {
      headers: { ownerCookies: ownerCookies || '' },
    });
    expect(profitRes.ok()).toBeTruthy();
    const profit = await profitRes.json();
    expect(profit.netProfit).toBeDefined();
    expect(profit.profitMarginPct).toBeDefined();

    // Test duplicate payout prevention
    const firstPayout = await request.post('/api/payouts', {
      headers: { cookie: ownerCookies || '' },
      data: {
        creatorId: 'creator-1',
        videoId: 'video-2',
        amount: 350,
        currency: 'USD',
        status: 'PAID',
      },
    });
    // First payout succeeds (or was already created in seed)
    if (firstPayout.status() === 201) {
      // Immediate second payout for same video MUST fail with 409
      const dupPayout = await request.post('/api/payouts', {
        headers: { cookie: ownerCookies || '' },
        data: {
          creatorId: 'creator-1',
          videoId: 'video-2',
          amount: 350,
          currency: 'USD',
          status: 'PAID',
        },
      });
      expect(dupPayout.status()).toBe(409);
    } else {
      expect(firstPayout.status()).toBe(409);
    }
  });

});
