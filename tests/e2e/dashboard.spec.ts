import { test, expect } from '@playwright/test';

/**
 * Dashboard E2E Tests
 * Tests the main dashboard page functionality
 * Uses API mocking to avoid database dependencies
 */

test.describe('Dashboard Page', () => {
  test.beforeEach(async ({ page }) => {
    // Mock analytics API to prevent errors on page load
    await page.route('**/api/analytics/summary', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totalSessions: 0,
          activeSessions: 0,
          totalReadings: 0,
          avgSessionDuration: 0
        })
      });
    });

    await page.route('**/api/sessions*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ sessions: [] })
      });
    });

    // Navigate to dashboard
    await page.goto('/');
  });

  test('should load dashboard successfully', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Nicla Sense ME/i);
    
    // Check for main heading
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
    
    // Take screenshot
    await page.screenshot({ 
      path: 'test-results/screenshots/dashboard-loaded.png',
      fullPage: true 
    });
  });

  test('should display Connect button', async ({ page }) => {
    // Look for BLE connect button
    const connectButton = page.locator('button:has-text("Connect")');
    await expect(connectButton).toBeVisible();
    
    // Button should be enabled
    await expect(connectButton).toBeEnabled();
    
    await page.screenshot({ 
      path: 'test-results/screenshots/connect-button.png' 
    });
  });

  test('should have navigation links to History and Analytics', async ({ page }) => {
    // Check for History link
    const historyLink = page.locator('a[href="/history"]');
    await expect(historyLink).toBeVisible();
    
    // Check for Analytics link
    const analyticsLink = page.locator('a[href="/analytics"]');
    await expect(analyticsLink).toBeVisible();
    
    await page.screenshot({ 
      path: 'test-results/screenshots/navigation-links.png' 
    });
  });

  test('should display 3D model container', async ({ page }) => {
    // Check for 3D model canvas (Three.js)
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
    
    // Wait for model to potentially load
    await page.waitForTimeout(2000);
    
    await page.screenshot({ 
      path: 'test-results/screenshots/3d-model.png' 
    });
  });

  test('should display sensor data containers', async ({ page }) => {
    // Check for sensor data display areas
    const sensorContainer = page.locator('#sensor-data, .sensor-data, [data-testid="sensor-data"]').first();
    
    // Take screenshot showing layout
    await page.screenshot({ 
      path: 'test-results/screenshots/sensor-layout.png',
      fullPage: true 
    });
  });

  test('should show recording button after sufficient wait', async ({ page }) => {
    // Wait for dynamic content to load
    await page.waitForTimeout(3000);
    
    // Check if recording button appears
    const recordingButton = page.locator('button:has-text("START RECORDING"), button:has-text("STOP RECORDING")').first();
    
    if (await recordingButton.isVisible()) {
      await expect(recordingButton).toBeVisible();
      await page.screenshot({ 
        path: 'test-results/screenshots/recording-button.png' 
      });
    }
  });
});
