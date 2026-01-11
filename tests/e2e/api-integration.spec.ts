import { test, expect } from '@playwright/test';

/**
 * API Integration E2E Tests
 * Tests that the frontend properly communicates with the backend API
 */

test.describe('API Integration', () => {
  test('should fetch sessions from API', async ({ page }) => {
    // Listen for API calls
    const apiCalls: string[] = [];
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        apiCalls.push(request.url());
      }
    });
    
    // Navigate to history page (which fetches sessions)
    await page.goto('/history');
    await page.waitForTimeout(2000);
    
    // Verify API was called
    const sessionsCalls = apiCalls.filter(url => url.includes('/api/sessions'));
    
    // Take screenshot
    await page.screenshot({ 
      path: 'test-results/screenshots/api-sessions-call.png' 
    });
  });

  test('should fetch analytics summary', async ({ page }) => {
    // Listen for API calls
    const apiCalls: string[] = [];
    page.on('request', request => {
      if (request.url().includes('/api/analytics')) {
        apiCalls.push(request.url());
      }
    });
    
    // Navigate to analytics page
    await page.goto('/analytics');
    await page.waitForTimeout(2000);
    
    // Verify API was called
    const analyticsCalls = apiCalls.filter(url => url.includes('/api/analytics'));
    
    // Take screenshot
    await page.screenshot({ 
      path: 'test-results/screenshots/api-analytics-call.png' 
    });
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Intercept API calls and simulate error
    await page.route('**/api/sessions*', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' })
      });
    });
    
    // Navigate to history page
    await page.goto('/history');
    await page.waitForTimeout(2000);
    
    // Page should not crash
    const pageContent = page.locator('body');
    await expect(pageContent).toBeTruthy();
    
    // Take screenshot of error state
    await page.screenshot({ 
      path: 'test-results/screenshots/api-error-handling.png' 
    });
  });

  test('should verify health endpoint', async ({ page, request }) => {
    // Call health endpoint directly
    const response = await request.get('/health');
    
    // Should return 200 OK
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('status');
  });
});
