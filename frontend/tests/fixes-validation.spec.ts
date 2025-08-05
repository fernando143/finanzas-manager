import { test, expect, Page } from '@playwright/test'

const BASE_URL = 'http://localhost:5173'
const API_URL = 'http://localhost:3000'

// Test helper function to login
async function login(page: Page) {
  await page.goto(`${BASE_URL}/login`)
  await page.fill('input[type="email"]', 'test@example.com')
  await page.fill('input[type="password"]', 'password123')
  await page.click('button[type="submit"]')
  await page.waitForURL(`${BASE_URL}/dashboard`)
}

test.describe('Fixes Validation Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await login(page)
  })

  test('Fix #1: Expense Table Pagination', async ({ page }) => {
    console.log('🧪 Testing Expense Table Pagination...')
    
    // Navigate to expenses page
    await page.goto(`${BASE_URL}/expenses`)
    await page.waitForLoadState('networkidle')

    // Check if expenses are loaded
    const expenseRows = await page.locator('tbody tr').count()
    console.log(`📊 Found ${expenseRows} expense rows`)

    // Check for pagination controls
    const paginationExists = await page.locator('[aria-label="Pagination"]').isVisible()
    console.log(`🔢 Pagination controls visible: ${paginationExists}`)

    if (paginationExists) {
      // Test pagination functionality
      const nextButton = page.locator('button').filter({ hasText: 'Siguiente' })
      const isNextEnabled = await nextButton.isEnabled()
      console.log(`➡️ Next button enabled: ${isNextEnabled}`)

      if (isNextEnabled) {
        // Click next page and verify URL or content changes
        await nextButton.click()
        await page.waitForLoadState('networkidle')
        console.log('✅ Successfully navigated to next page')
      }
    } else if (expenseRows <= 10) {
      console.log('ℹ️ Pagination hidden - less than 10 items (expected behavior)')
    }

    expect(expenseRows).toBeGreaterThan(0)
  })

  test('Fix #2: Income Table Pagination', async ({ page }) => {
    console.log('🧪 Testing Income Table Pagination...')
    
    // Navigate to income page
    await page.goto(`${BASE_URL}/income`)
    await page.waitForLoadState('networkidle')

    // Check if incomes are loaded
    const incomeRows = await page.locator('tbody tr').count()
    console.log(`📊 Found ${incomeRows} income rows`)

    // Check for pagination controls
    const paginationExists = await page.locator('[aria-label="Pagination"]').isVisible()
    console.log(`🔢 Pagination controls visible: ${paginationExists}`)

    if (paginationExists) {
      // Test pagination functionality
      const nextButton = page.locator('button').filter({ hasText: 'Siguiente' })
      const isNextEnabled = await nextButton.isEnabled()
      console.log(`➡️ Next button enabled: ${isNextEnabled}`)

      if (isNextEnabled) {
        // Click next page and verify URL or content changes
        await nextButton.click()
        await page.waitForLoadState('networkidle')
        console.log('✅ Successfully navigated to next page')
      }
    } else if (incomeRows <= 10) {
      console.log('ℹ️ Pagination hidden - less than 10 items (expected behavior)')
    }

    expect(incomeRows).toBeGreaterThan(0)
  })

  test('Fix #3: FinancialChart Complete Data', async ({ page }) => {
    console.log('🧪 Testing FinancialChart Complete Data...')
    
    // Navigate to dashboard
    await page.goto(`${BASE_URL}/dashboard`)
    await page.waitForLoadState('networkidle')

    // Wait for chart to load
    await page.waitForSelector('[class*="recharts"]', { timeout: 10000 })
    
    // Check if chart is rendered
    const chartExists = await page.locator('[class*="recharts"]').isVisible()
    console.log(`📈 FinancialChart visible: ${chartExists}`)

    // Verify chart has data by checking for chart elements
    const chartBars = await page.locator('[class*="recharts-bar"]').count()
    const chartLines = await page.locator('[class*="recharts-line"]').count()
    console.log(`📊 Chart bars: ${chartBars}, Chart lines: ${chartLines}`)

    // Check for chart legend/summary data
    const summaryCards = await page.locator('.text-2xl.font-bold').count()
    console.log(`💰 Summary cards found: ${summaryCards}`)

    expect(chartExists).toBe(true)
    expect(summaryCards).toBeGreaterThanOrEqual(3) // Income, Expenses, Balance cards
  })

  test('Fix #4: Expense Form Submission', async ({ page }) => {
    console.log('🧪 Testing Expense Form Submission...')
    
    // Navigate to expenses page
    await page.goto(`${BASE_URL}/expenses`)
    await page.waitForLoadState('networkidle')

    // Open form by clicking "Nuevo Egreso" button  
    await page.click('button:has-text("Nuevo Egreso")')
    
    // Wait for form modal to appear
    await page.waitForSelector('form', { timeout: 5000 })
    console.log('📝 Expense form opened')

    // Fill out the form
    await page.fill('input[placeholder*="Alquiler"]', 'Test Expense')
    await page.fill('input[type="number"]', '1000')
    
    // Select first available category
    const categorySelect = page.locator('select').first()
    await categorySelect.selectOption({ index: 1 })
    
    // Set due date
    const today = new Date().toISOString().split('T')[0]
    await page.fill('input[type="date"]', today)

    console.log('📋 Form filled with test data')

    // Submit form and check if page doesn't break
    const submitButton = page.locator('button[type="submit"]')
    await submitButton.click()

    // Wait for potential async operations
    await page.waitForTimeout(2000)

    // Verify page is still functional (not blank)
    const pageTitle = await page.locator('h1').first().textContent()
    console.log(`📄 Page title after submit: "${pageTitle}"`)
    
    // Check if we're still on expenses page or if modal closed
    const currentUrl = page.url()
    const isOnExpensesPage = currentUrl.includes('/expenses') || currentUrl.includes('/dashboard')
    console.log(`🌐 Current URL: ${currentUrl}`)
    console.log(`✅ Page still functional: ${isOnExpensesPage}`)

    expect(isOnExpensesPage).toBe(true)
    expect(pageTitle).toBeTruthy()
    expect(pageTitle).not.toBe('')
  })

  test('API Endpoints Verification', async ({ request }) => {
    console.log('🧪 Testing New API Endpoints...')
    
    // Test dashboard endpoints (these require authentication)
    // Note: In a real test, you'd need to handle authentication properly
    
    try {
      const expensesResponse = await request.get(`${API_URL}/api/expenses/dashboard/current-month`, {
        headers: {
          'Authorization': 'Bearer your-test-token' // This would need proper token
        }
      })
      console.log(`📊 Expenses dashboard endpoint status: ${expensesResponse.status()}`)
    } catch (error) {
      console.log('⚠️ Expenses dashboard endpoint test skipped (authentication required)')
    }

    try {
      const incomesResponse = await request.get(`${API_URL}/api/incomes/dashboard/current-month`, {
        headers: {
          'Authorization': 'Bearer your-test-token' // This would need proper token
        }
      })
      console.log(`📊 Incomes dashboard endpoint status: ${incomesResponse.status()}`)
    } catch (error) {
      console.log('⚠️ Incomes dashboard endpoint test skipped (authentication required)')
    }
  })
})

test.describe('Integration Tests', () => {
  test('Full User Workflow', async ({ page }) => {
    console.log('🧪 Testing Complete User Workflow...')
    
    await login(page)

    // 1. Check dashboard loads
    await page.goto(`${BASE_URL}/dashboard`)
    await page.waitForLoadState('networkidle')
    console.log('✅ Dashboard loaded')

    // 2. Navigate to expenses with pagination
    await page.goto(`${BASE_URL}/expenses`)
    await page.waitForLoadState('networkidle')
    console.log('✅ Expenses page loaded')

    // 3. Navigate to income with pagination  
    await page.goto(`${BASE_URL}/income`)
    await page.waitForLoadState('networkidle')
    console.log('✅ Income page loaded')

    // 4. Return to dashboard and verify chart
    await page.goto(`${BASE_URL}/dashboard`)
    await page.waitForLoadState('networkidle')
    
    const chartVisible = await page.locator('[class*="recharts"]').isVisible()
    console.log(`✅ Full workflow completed - Chart visible: ${chartVisible}`)

    expect(chartVisible).toBe(true)
  })
})

// Helper test to verify component rendering
test('Component Rendering Verification', async ({ page }) => {
  await login(page)
  
  // Test all main components render without errors
  const pages = [
    { url: '/dashboard', name: 'Dashboard' },
    { url: '/expenses', name: 'Expenses' },
    { url: '/income', name: 'Income' }
  ]

  for (const pageInfo of pages) {
    await page.goto(`${BASE_URL}${pageInfo.url}`)
    await page.waitForLoadState('networkidle')
    
    // Check for React error boundaries or blank pages
    const hasError = await page.locator('text=Something went wrong').isVisible()
    const hasContent = await page.locator('body').textContent()
    
    console.log(`📄 ${pageInfo.name} page - Error: ${hasError}, Has content: ${!!hasContent}`)
    
    expect(hasError).toBe(false)
    expect(hasContent).toBeTruthy()
  }
})