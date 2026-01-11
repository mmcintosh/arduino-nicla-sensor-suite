import { test, expect } from '@playwright/test';

/**
 * Navigation E2E Tests
 * Tests navigation between pages
 */

test.describe('Navigation Flow', () => {
  test('should navigate from Dashboard to History page', async ({ page }) => {
    // Start at dashboard
    await page.goto('/');
    
    // Click History link
    await page.click('a[href="/history"]');
    
    // Wait for navigation
    await page.waitForURL('**/history');
    
    // Verify we're on History page
    await expect(page).toHaveURL(/\/history$/);
    
    // Check for History page elements
    const pageContent = page.locator('body');
    await expect(pageContent).toContainText(/history|sessions/i);
    
    // Take screenshot
    await page.screenshot({ 
      path: 'test-results/screenshots/history-page.png',
      fullPage: true 
    });
  });

  test('should navigate from Dashboard to Analytics page', async ({ page }) => {
    // Start at dashboard
    await page.goto('/');
    
    // Click Analytics link
    await page.click('a[href="/analytics"]');
    
    // Wait for navigation
    await page.waitForURL('**/analytics');
    
    // Verify we're on Analytics page
    await expect(page).toHaveURL(/\/analytics$/);
    
    // Check for Analytics page elements
    const pageContent = page.locator('body');
    await expect(pageContent).toContainText(/analytics|statistics/i);
    
    // Take screenshot
    await page.screenshot({ 
      path: 'test-results/screenshots/analytics-page.png',
      fullPage: true 
    });
  });

  test('should navigate between all pages in sequence', async ({ page }) => {
    // Start at dashboard
    await page.goto('/');
    await page.screenshot({ path: 'test-results/screenshots/nav-1-dashboard.png' });
    
    // Go to History
    await page.click('a[href="/history"]');
    await page.waitForURL('**/history');
    await page.screenshot({ path: 'test-results/screenshots/nav-2-history.png' });
    
    // Go back to Dashboard
    await page.goto('/');
    await page.screenshot({ path: 'test-results/screenshots/nav-3-back-dashboard.png' });
    
    // Go to Analytics
    await page.click('a[href="/analytics"]');
    await page.waitForURL('**/analytics');
    await page.screenshot({ path: 'test-results/screenshots/nav-4-analytics.png' });
    
    // Verify final location
    await expect(page).toHaveURL(/\/analytics$/);
  });

  test('should handle back button navigation', async ({ page }) => {
    // Navigate through pages
    await page.goto('/');
    await page.click('a[href="/history"]');
    await page.waitForURL('**/history');
    
    // Use browser back button
    await page.goBack();
    
    // Should be back at dashboard
    await expect(page).toHaveURL(/\/$/);
    
    await page.screenshot({ 
      path: 'test-results/screenshots/back-navigation.png' 
    });
  });
});
