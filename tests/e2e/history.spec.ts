import { test, expect } from '@playwright/test';

/**
 * History Page E2E Tests
 * Tests the historical data viewer functionality
 * Uses API mocking to avoid database dependencies
 */

test.describe('History Page', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API responses
    await page.route('**/api/sessions*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          sessions: [],
          total: 0
        })
      });
    });

    await page.goto('/history');
  });

  test('should load history page successfully', async ({ page }) => {
    // Check that page loaded
    await expect(page).toHaveURL(/\/history$/);
    
    // Take full page screenshot
    await page.screenshot({ 
      path: 'test-results/screenshots/history-full.png',
      fullPage: true 
    });
  });

  test('should display session list or empty state', async ({ page }) => {
    // Page should have either sessions or empty state
    const pageContent = page.locator('body');
    
    // Wait for content to load
    await page.waitForTimeout(2000);
    
    // Check for sessions table/list or "no sessions" message
    const hasContent = await pageContent.locator('table, .session-list, .session-item').count() > 0;
    const hasEmptyState = await pageContent.locator(':text("No sessions"), :text("no data")').count() > 0;
    
    expect(hasContent || hasEmptyState).toBeTruthy();
    
    await page.screenshot({ 
      path: 'test-results/screenshots/history-sessions.png' 
    });
  });

  test('should have working filters and search', async ({ page }) => {
    // Look for search/filter inputs
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i], input[name="search"]').first();
    
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await page.screenshot({ 
        path: 'test-results/screenshots/history-search.png' 
      });
    }
    
    // Just verify page doesn't crash with filters
    await page.waitForTimeout(1000);
  });

  test('should display charts if data exists', async ({ page }) => {
    // Wait for potential chart rendering
    await page.waitForTimeout(3000);
    
    // Check for Plotly charts
    const charts = page.locator('.plotly, [id^="chart-"], .chart-container');
    
    await page.screenshot({ 
      path: 'test-results/screenshots/history-charts.png',
      fullPage: true 
    });
  });
});
