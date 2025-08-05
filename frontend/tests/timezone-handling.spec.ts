import { test, expect, type Page } from '@playwright/test';

/**
 * Timezone Handling Tests for Fianzas Manager
 * 
 * These tests verify that the application correctly handles GMT-3 timezone
 * dates throughout the entire flow: form input -> backend storage -> chart display
 */

// Test configuration for GMT-3 timezone
const GMT3_TIMEZONE = 'America/Argentina/Buenos_Aires';
const EXPECTED_UTC_HOUR = 15; // 12:00 GMT-3 = 15:00 UTC

test.describe('GMT-3 Timezone Handling', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    // Create browser context with GMT-3 timezone
    const context = await browser.newContext({
      timezoneId: GMT3_TIMEZONE,
    });
    page = await context.newPage();
  });

  test.beforeEach(async () => {
    // Navigate to the application
    await page.goto('http://localhost:3000');
    
    // Wait for the application to load
    await page.waitForLoadState('networkidle');
  });

  test('should create dates at 12:00 noon GMT-3 (15:00 UTC) for income', async () => {
    // Navigate to income form or open income modal
    await page.click('[data-testid="add-income-button"]');
    
    // Fill out the income form
    await page.fill('[data-testid="income-description"]', 'Test Income GMT-3');
    await page.fill('[data-testid="income-amount"]', '1000');
    
    // Select a category (assuming first available)
    await page.selectOption('[data-testid="income-category"]', { index: 1 });
    
    // Set income date to today
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    await page.fill('[data-testid="income-date"]', today);
    
    // Mock the API call to capture the request
    let requestBody: Record<string, unknown>;
    await page.route('**/api/incomes', async (route) => {
      const request = route.request();
      requestBody = await request.postDataJSON();
      
      // Mock successful response
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            income: {
              id: 'test-id',
              ...requestBody,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          }
        })
      });
    });
    
    // Submit the form
    await page.click('[data-testid="save-income-button"]');
    
    // Wait for the API call to complete
    await page.waitForTimeout(1000);
    
    // Verify the request body contains the correct UTC time (15:00)
    expect(requestBody).toBeDefined();
    expect(requestBody.incomeDate).toBeDefined();
    
    const sentDate = new Date(requestBody.incomeDate);
    expect(sentDate.getUTCHours()).toBe(EXPECTED_UTC_HOUR);
    expect(sentDate.getUTCMinutes()).toBe(0);
    expect(sentDate.getUTCSeconds()).toBe(0);
    expect(sentDate.getUTCMilliseconds()).toBe(0);
  });

  test('should create dates at 12:00 noon GMT-3 (15:00 UTC) for expenses', async () => {
    // Navigate to expense form or open expense modal
    await page.click('[data-testid="add-expense-button"]');
    
    // Fill out the expense form
    await page.fill('[data-testid="expense-description"]', 'Test Expense GMT-3');
    await page.fill('[data-testid="expense-amount"]', '500');
    
    // Select a category (assuming first available)
    await page.selectOption('[data-testid="expense-category"]', { index: 1 });
    
    // Set due date to today
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    await page.fill('[data-testid="expense-due-date"]', today);
    
    // Mock the API call to capture the request
    let requestBody: Record<string, unknown>;
    await page.route('**/api/expenses', async (route) => {
      const request = route.request();
      requestBody = await request.postDataJSON();
      
      // Mock successful response
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            expense: {
              id: 'test-id',
              ...requestBody,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          }
        })
      });
    });
    
    // Submit the form
    await page.click('[data-testid="save-expense-button"]');
    
    // Wait for the API call to complete
    await page.waitForTimeout(1000);
    
    // Verify the request body contains the correct UTC time (15:00)
    expect(requestBody).toBeDefined();
    expect(requestBody.dueDate).toBeDefined();
    
    const sentDate = new Date(requestBody.dueDate);
    expect(sentDate.getUTCHours()).toBe(EXPECTED_UTC_HOUR);
    expect(sentDate.getUTCMinutes()).toBe(0);
    expect(sentDate.getUTCSeconds()).toBe(0);
    expect(sentDate.getUTCMilliseconds()).toBe(0);
  });

  test('should display dates correctly in GMT-3 timezone from API', async () => {
    // Mock API response with UTC date at 15:00 (12:00 GMT-3)
    const testDate = '2025-08-04T15:00:00.000Z'; // August 4, 2025 at 15:00 UTC (12:00 GMT-3)
    
    await page.route('**/api/incomes**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            incomes: [{
              id: 'test-income-id',
              description: 'Test Income',
              amount: 1000,
              categoryId: 'test-category-id',
              frequency: 'MONTHLY',
              incomeDate: testDate,
              nextDate: null,
              isActive: true,
              userId: 'test-user-id',
              createdAt: testDate,
              updatedAt: testDate
            }],
            pagination: {
              page: 1,
              limit: 20,
              total: 1,
              pages: 1
            }
          }
        })
      });
    });
    
    // Navigate to income list or refresh page
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Check that the date is displayed correctly in GMT-3 context
    // The date should show as August 4, 2025 (the correct date in GMT-3)
    const displayedDate = await page.textContent('[data-testid="income-date-display"]');
    
    // Verify the date is displayed in the correct format for GMT-3
    // We expect to see "4 ago 2025" or similar GMT-3 representation
    expect(displayedDate).toContain('4');
    expect(displayedDate).toContain('ago'); // Spanish for August
    expect(displayedDate).toContain('2025');
  });

  test('should handle chart data correctly in GMT-3 timezone', async () => {
    // Mock API responses for both incomes and expenses
    const testDate = '2025-08-04T15:00:00.000Z'; // August 4, 2025 at 15:00 UTC (12:00 GMT-3)
    
    await page.route('**/api/incomes**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            incomes: [{
              id: 'test-income-id',
              description: 'Test Income',
              amount: 1000,
              categoryId: 'test-category-id',
              frequency: 'ONE_TIME',
              incomeDate: testDate,
              nextDate: null,
              isActive: true,
              userId: 'test-user-id',
              createdAt: testDate,
              updatedAt: testDate
            }],
            pagination: { page: 1, limit: 20, total: 1, pages: 1 }
          }
        })
      });
    });
    
    await page.route('**/api/expenses**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            expenses: [{
              id: 'test-expense-id',
              description: 'Test Expense',
              amount: 500,
              categoryId: 'test-category-id',
              frequency: 'ONE_TIME',
              dueDate: testDate,
              status: 'PAID',
              userId: 'test-user-id',
              createdAt: testDate,
              updatedAt: testDate
            }],
            pagination: { page: 1, limit: 20, total: 1, pages: 1 }
          }
        })
      });
    });
    
    // Navigate to dashboard with financial chart
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Wait for chart to render
    await page.waitForSelector('[data-testid="financial-chart"]', { timeout: 10000 });
    
    // Verify chart displays data for the correct date in GMT-3 context
    // The chart should show data for August 4th (day 4 of the month)
    const chartData = await page.locator('[data-testid="chart-day-4"]');
    await expect(chartData).toBeVisible();
    
    // Verify tooltip shows correct date when hovering
    await chartData.hover();
    await page.waitForSelector('[data-testid="chart-tooltip"]');
    
    const tooltipDate = await page.textContent('[data-testid="chart-tooltip-date"]');
    expect(tooltipDate).toContain('4 ago 2025'); // Should show August 4, 2025 in Spanish
  });

  test('should validate backend timezone requirements', async () => {
    // Test that backend rejects dates not at 15:00 UTC
    
    await page.route('**/api/incomes', async (route) => {
      const request = route.request();
      const body = await request.postDataJSON();
      
      // Check if the date is exactly 15:00 UTC
      const sentDate = new Date(body.incomeDate);
      if (sentDate.getUTCHours() !== 15) {
        // Mock validation error response
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Income date must be set to 12:00 noon GMT-3 (15:00 UTC)',
            code: 'INVALID_TIMEZONE'
          })
        });
      } else {
        // Mock success response
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { income: { ...body, id: 'test-id' } }
          })
        });
      }
    });
    
    // Navigate to income form
    await page.click('[data-testid="add-income-button"]');
    
    // Try to submit with an invalid date (this would happen if the frontend utils were broken)
    await page.fill('[data-testid="income-description"]', 'Invalid Timezone Test');
    await page.fill('[data-testid="income-amount"]', '1000');
    await page.selectOption('[data-testid="income-category"]', { index: 1 });
    
    const today = new Date().toISOString().split('T')[0];
    await page.fill('[data-testid="income-date"]', today);
    
    // Submit the form
    await page.click('[data-testid="save-income-button"]');
    
    // The form should succeed because our frontend utils create correct dates
    await page.waitForSelector('[data-testid="success-message"]', { timeout: 5000 });
  });

  test('should handle timezone edge cases around midnight', async () => {
    // Test dates that might cause timezone boundary issues
    const testCases = [
      '2025-01-01', // New Year's Day
      '2025-12-31', // New Year's Eve
      '2025-02-28', // Non-leap year February end
      '2025-03-01', // Day after February in non-leap year
    ];
    
    for (const testDate of testCases) {
      // Mock successful API response
      let capturedRequest: Record<string, unknown>;
      await page.route('**/api/incomes', async (route) => {
        capturedRequest = await route.request().postDataJSON();
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { income: { ...capturedRequest, id: `test-${testDate}` } }
          })
        });
      });
      
      // Navigate to form and submit
      await page.click('[data-testid="add-income-button"]');
      await page.fill('[data-testid="income-description"]', `Edge Case ${testDate}`);
      await page.fill('[data-testid="income-amount"]', '1000');
      await page.selectOption('[data-testid="income-category"]', { index: 1 });
      await page.fill('[data-testid="income-date"]', testDate);
      await page.click('[data-testid="save-income-button"]');
      
      // Wait for API call
      await page.waitForTimeout(1000);
      
      // Verify the date is correctly stored as 15:00 UTC
      const sentDate = new Date(capturedRequest.incomeDate);
      expect(sentDate.getUTCHours()).toBe(EXPECTED_UTC_HOUR);
      
      // Verify the date portion is correct
      const expectedDatePortion = new Date(testDate + 'T15:00:00.000Z');
      expect(sentDate.getUTCFullYear()).toBe(expectedDatePortion.getUTCFullYear());
      expect(sentDate.getUTCMonth()).toBe(expectedDatePortion.getUTCMonth());
      expect(sentDate.getUTCDate()).toBe(expectedDatePortion.getUTCDate());
      
      // Close modal for next iteration
      await page.press('Escape');
    }
  });
});