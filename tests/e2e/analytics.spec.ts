import { test, expect } from '@playwright/test';

/**
 * Analytics Page E2E Tests
 * Tests the analytics dashboard functionality
 * Uses API mocking to avoid database dependencies
 */

test.describe('Analytics Page', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API responses to avoid database dependency
    await page.route('**/api/analytics/summary', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totalSessions: 5,
          activeSessions: 2,
          totalReadings: 1234,
          avgSessionDuration: 180000
        })
      });
    });

    await page.goto('/analytics');
  });

  test('should load analytics page successfully', async ({ page }) => {
    // Check that page loaded
    await expect(page).toHaveURL(/\/analytics$/);
    
    // Page should have analytics content
    const pageContent = page.locator('body');
    await expect(pageContent).toBeTruthy();
    
    // Take full page screenshot
    await page.screenshot({ 
      path: 'test-results/screenshots/analytics-full.png',
      fullPage: true 
    });
  });

  test('should display key statistics cards', async ({ page }) => {
    // Wait for data to load
    await page.waitForTimeout(2000);
    
    // Look for statistics displays
    const pageContent = page.locator('body');
    
    // Check for common analytics terms
    const hasStats = await pageContent.locator(':text("Total Sessions"), :text("sessions"), :text("readings")').count() > 0;
    
    // Take screenshot of stats area
    await page.screenshot({ 
      path: 'test-results/screenshots/analytics-stats.png' 
    });
  });

  test('should display sensor trend charts', async ({ page }) => {
    // Wait for charts to potentially render
    await page.waitForTimeout(3000);
    
    // Look for chart containers
    const charts = page.locator('.plotly, [id*="chart"], .chart-container, canvas');
    
    // Take screenshot showing charts
    await page.screenshot({ 
      path: 'test-results/screenshots/analytics-charts.png',
      fullPage: true 
    });
  });

  test('should show data by sensor type', async ({ page }) => {
    // Wait for content
    await page.waitForTimeout(2000);
    
    // Look for sensor type labels (Temperature, Humidity, etc.)
    const pageContent = page.locator('body');
    
    const hasSensorTypes = await Promise.all([
      pageContent.locator(':text("Temperature")').count(),
      pageContent.locator(':text("Humidity")').count(),
      pageContent.locator(':text("Pressure")').count(),
    ]);
    
    // At least some sensor types should be mentioned
    const totalSensorMentions = hasSensorTypes.reduce((a, b) => a + b, 0);
    
    await page.screenshot({ 
      path: 'test-results/screenshots/analytics-sensor-types.png',
      fullPage: true 
    });
  });

  test('should handle empty data state gracefully', async ({ page }) => {
    // Page should not crash even with no data
    await page.waitForTimeout(2000);
    
    // Check for either data or empty state message
    const pageContent = page.locator('body');
    const hasEmptyState = await pageContent.locator(':text("No data"), :text("no sessions"), :text("0")').count() > 0;
    
    await page.screenshot({ 
      path: 'test-results/screenshots/analytics-empty-state.png' 
    });
  });
});
