# Comprehensive Testing Strategy

## Current State Analysis

### What We Have Now
1. **Vitest Tests** (Backend/API)
   - ✅ 60 passing tests
   - ⚠️ 4 skipped tests (fixable)
   - Tests: API endpoints, database logic, utilities
   - **Coverage**: Backend only (~40% of app)

### What We're Missing
1. **Playwright Tests** (Frontend/E2E)
   - ❌ No browser testing
   - ❌ No visual regression
   - ❌ No Web Bluetooth testing
   - ❌ No dashboard UI testing
   - **Coverage**: 0% of frontend

## 🎯 Complete Testing Plan (SonicJS Pattern)

### Phase 1: Fix Current Unit Tests (30-45 min)
Fix the 4 skipped Vitest tests properly:

1. **Add proper mock database seeding**
   ```typescript
   // tests/fixtures/mock-data.ts
   export async function seedMockDatabase(db: D1Database) {
     // Insert test session
     await db.prepare(`
       INSERT INTO sessions (id, name, started_at, status)
       VALUES (?, ?, ?, ?)
     `).bind('test-session-123', 'Test Session', Date.now(), 'active').run();
     
     // Insert sensor readings
     for (let i = 0; i < 10; i++) {
       await db.prepare(`
         INSERT INTO sensor_readings (
           id, session_id, timestamp, temperature, humidity, pressure
         ) VALUES (?, ?, ?, ?, ?, ?)
       `).bind(
         `reading-${i}`,
         'test-session-123',
         Date.now() + i * 1000,
         20 + Math.random() * 5,
         40 + Math.random() * 20,
         100 + Math.random() * 2
       ).run();
     }
   }
   ```

2. **Fix 404 checks in analytics.ts**
   ```typescript
   if (!session || (session && Object.keys(session).length === 0)) {
     return c.json({ error: 'Session not found' }, 404);
   }
   ```

3. **Update test beforeEach hooks**
   ```typescript
   beforeEach(async () => {
     mockEnv = createMockEnv();
     await seedMockDatabase(mockEnv.DB);
   });
   ```

**Result**: All 64 unit tests passing ✅

---

### Phase 2: Add Playwright E2E Tests (Following SonicJS)

#### Setup Playwright

```bash
npm install -D @playwright/test
npx playwright install chromium
```

#### Directory Structure
```
tests/
├── unit/              # Vitest tests (existing)
│   ├── api/
│   ├── utils/
│   └── fixtures/
├── e2e/               # NEW: Playwright tests
│   ├── dashboard.spec.ts
│   ├── history.spec.ts
│   ├── analytics.spec.ts
│   ├── web-bluetooth.spec.ts
│   └── fixtures/
│       └── test-data.ts
└── playwright.config.ts  # NEW
```

#### Playwright Config (SonicJS Pattern)

```typescript
// tests/playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  
  // Screenshots & Videos (like SonicJS)
  use: {
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
  },
  
  // Test artifacts
  outputDir: 'test-results/',
  
  // Projects (browsers)
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Add more browsers as needed
  ],
  
  // Dev server
  webServer: {
    command: 'npm run dev',
    port: 8787,
    reuseExistingServer: !process.env.CI,
  },
  
  // Retries for flaky tests
  retries: process.env.CI ? 2 : 0,
  
  // Report
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
  ],
});
```

#### Example E2E Tests

**1. Dashboard Loading Test**
```typescript
// tests/e2e/dashboard.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test('should load dashboard with all widgets', async ({ page }) => {
    await page.goto('http://localhost:8787');
    
    // Take screenshot on load
    await page.screenshot({ path: 'test-results/dashboard-loaded.png' });
    
    // Verify all widgets present
    await expect(page.getByText('Quaternion Rotation')).toBeVisible();
    await expect(page.getByText('Accelerometer')).toBeVisible();
    await expect(page.getByText('Temperature')).toBeVisible();
    await expect(page.getByText('Humidity')).toBeVisible();
    
    // Verify navigation links
    await expect(page.getByRole('link', { name: 'History' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Analytics' })).toBeVisible();
    
    // Verify CONNECT button
    await expect(page.getByRole('button', { name: /CONNECT/i })).toBeVisible();
    
    // Take screenshot of complete page
    await page.screenshot({ 
      path: 'test-results/dashboard-complete.png',
      fullPage: true 
    });
  });

  test('should show recording button after page load', async ({ page }) => {
    await page.goto('http://localhost:8787');
    
    // Wait for recording script to initialize
    await page.waitForTimeout(2500);
    
    // Verify recording button added
    const recordBtn = page.getByRole('button', { name: /START RECORDING/i });
    await expect(recordBtn).toBeVisible();
    
    // Screenshot
    await page.screenshot({ path: 'test-results/recording-button.png' });
  });

  test('should render 3D model container', async ({ page }) => {
    await page.goto('http://localhost:8787');
    
    // Check 3D container exists
    const model3D = page.locator('#3d');
    await expect(model3D).toBeVisible();
    
    // Wait for Three.js to load
    await page.waitForTimeout(1000);
    
    // Screenshot of 3D widget
    await model3D.screenshot({ path: 'test-results/3d-model.png' });
  });
});
```

**2. Navigation Test**
```typescript
// tests/e2e/navigation.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should navigate to history page', async ({ page }) => {
    await page.goto('http://localhost:8787');
    
    // Click history link
    await page.click('a[href="/history"]');
    
    // Verify history page loaded
    await expect(page).toHaveURL(/.*\/history/);
    await expect(page.getByText('Session History')).toBeVisible();
    
    // Screenshot
    await page.screenshot({ path: 'test-results/history-page.png' });
  });

  test('should navigate to analytics page', async ({ page }) => {
    await page.goto('http://localhost:8787');
    
    await page.click('a[href="/analytics"]');
    
    await expect(page).toHaveURL(/.*\/analytics/);
    await expect(page.getByText('Analytics Dashboard')).toBeVisible();
    
    await page.screenshot({ path: 'test-results/analytics-page.png' });
  });

  test('should navigate back to dashboard', async ({ page }) => {
    await page.goto('http://localhost:8787/history');
    
    await page.click('a[href="/"]');
    
    await expect(page).toHaveURL('http://localhost:8787/');
    await expect(page.getByText('Quaternion Rotation')).toBeVisible();
  });
});
```

**3. Web Bluetooth Mock Test** (Important!)
```typescript
// tests/e2e/web-bluetooth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Web Bluetooth', () => {
  test('should check for Web Bluetooth support', async ({ page }) => {
    await page.goto('http://localhost:8787');
    
    // Check if browser supports Web Bluetooth
    const hasWebBluetooth = await page.evaluate(() => {
      return 'bluetooth' in navigator;
    });
    
    expect(hasWebBluetooth).toBe(true);
    
    // CONNECT button should be enabled in Chrome
    const connectBtn = page.getByRole('button', { name: /CONNECT/i });
    await expect(connectBtn).toBeEnabled();
  });

  test('should show error in non-supporting browser', async ({ page, browserName }) => {
    // Skip in Chromium (has Web Bluetooth)
    test.skip(browserName === 'chromium', 'Web Bluetooth supported in Chromium');
    
    await page.goto('http://localhost:8787');
    
    // Should show browser not supported message
    // (Your dashboard checks this and shows a message)
    await page.screenshot({ path: `test-results/no-bluetooth-${browserName}.png` });
  });

  // Note: Can't actually test pairing without real device,
  // but can test the UI flow up to the pairing dialog
  test('should trigger pairing dialog on connect click', async ({ page, context }) => {
    await page.goto('http://localhost:8787');
    
    // Grant permission programmatically (for testing)
    await context.grantPermissions(['bluetooth']);
    
    const connectBtn = page.getByRole('button', { name: /CONNECT/i });
    
    // Click will trigger browser's Bluetooth pairing dialog
    // (Can't proceed without real device, but can verify click works)
    await connectBtn.click();
    
    await page.screenshot({ path: 'test-results/bluetooth-clicked.png' });
  });
});
```

**4. Visual Regression Test**
```typescript
// tests/e2e/visual-regression.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Visual Regression', () => {
  test('dashboard visual comparison', async ({ page }) => {
    await page.goto('http://localhost:8787');
    await page.waitForLoadState('networkidle');
    
    // Take baseline screenshot
    await expect(page).toHaveScreenshot('dashboard-baseline.png', {
      fullPage: true,
      maxDiffPixels: 100, // Allow small differences
    });
  });

  test('history page visual comparison', async ({ page }) => {
    await page.goto('http://localhost:8787/history');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('history-baseline.png', {
      fullPage: true,
    });
  });

  test('analytics page visual comparison', async ({ page }) => {
    await page.goto('http://localhost:8787/analytics');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('analytics-baseline.png', {
      fullPage: true,
    });
  });
});
```

**5. Performance Test**
```typescript
// tests/e2e/performance.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Performance', () => {
  test('dashboard loads in under 3 seconds', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('http://localhost:8787');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(3000);
    console.log(`Dashboard loaded in ${loadTime}ms`);
  });

  test('check for console errors', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('http://localhost:8787');
    await page.waitForLoadState('networkidle');
    
    // Allow known errors (like missing Arduino logo)
    const criticalErrors = errors.filter(e => 
      !e.includes('Logo-Arduino-Pro-inline.svg')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });
});
```

#### Updated package.json Scripts

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:unit": "vitest run",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    "test:all": "npm run test:unit && npm run test:e2e",
    "test:headed": "playwright test --headed",
    "playwright:report": "playwright show-report"
  }
}
```

#### CI Configuration Update

```yaml
# .github/workflows/test.yml
jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20.x'
      - run: npm ci
      - run: npm run test:unit

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20.x'
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run test:e2e
      
      # Upload screenshots/videos on failure
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-results
          path: |
            test-results/
            playwright-report/
          retention-days: 30
```

---

## 📊 Complete Testing Coverage

### After Implementation

**Backend (Vitest)**:
- ✅ API endpoint logic
- ✅ Database operations
- ✅ Utility functions
- ✅ Error handling
- **Coverage**: ~90% of backend code

**Frontend (Playwright)**:
- ✅ Dashboard UI rendering
- ✅ Navigation flows
- ✅ Web Bluetooth interface
- ✅ Charts/graphs display
- ✅ Recording functionality UI
- ✅ Visual regression
- ✅ Performance metrics
- **Coverage**: ~80% of user flows

**Total Coverage**: ~85% of application

---

## 🎯 Implementation Plan

### Step 1: Fix Unit Tests (Now) ⏱️ 30-45 min
1. Create `seedMockDatabase()` function
2. Fix analytics 404 checks
3. Update test hooks
4. Verify all 64 tests pass

### Step 2: Add Playwright (Next) ⏱️ 1-2 hours
1. Install Playwright
2. Create playwright.config.ts
3. Create basic E2E tests (dashboard, navigation)
4. Add visual regression tests
5. Update CI configuration

### Step 3: Advanced E2E (Later) ⏱️ 2-3 hours
1. Mock Web Bluetooth for testing
2. Add recording flow tests
3. Add data export tests
4. Add performance tests
5. Cross-browser testing

---

## 📝 Why Playwright is Essential

1. **Web Bluetooth**: Can't unit test, needs real browser
2. **3D Rendering**: Three.js needs GPU, can't mock
3. **Charts**: Plotly rendering needs visual verification
4. **User Flow**: "Does recording actually work end-to-end?"
5. **Debugging**: Videos show exactly what failed
6. **Confidence**: See the app working in real browser

---

## ✅ Immediate Next Steps

**Would you like me to**:

1. **First**: Fix the 4 unit tests (30-45 min)
2. **Then**: Set up Playwright with basic tests (1 hour)
3. **Create**: Sample test files following SonicJS pattern

This gives us:
- ✅ All backend tests passing
- ✅ Frontend E2E tests with screenshots/videos
- ✅ Same quality as SonicJS
- ✅ CI that actually tests the UI

**Should I proceed with Step 1 (fix unit tests)?**
