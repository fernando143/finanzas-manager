import { test, expect } from '@playwright/test'

test.describe('Category Search Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the categories page
    await page.goto('http://localhost:5173/categories')
    
    // Wait for categories to load
    await page.waitForSelector('.category-list', { timeout: 10000 })
  })

  test('should make API call with search parameter when typing in search input', async ({ page }) => {
    // Intercept API calls to check parameters
    const apiCalls: string[] = []
    
    page.on('request', request => {
      if (request.url().includes('/api/categories')) {
        apiCalls.push(request.url())
      }
    })

    // Type in search input
    const searchInput = page.locator('input[placeholder="Buscar categorías..."]')
    await searchInput.fill('test')
    
    // Wait for debounce (400ms) + some buffer
    await page.waitForTimeout(600)
    
    // Check if API was called with search parameter
    const searchCall = apiCalls.find(url => url.includes('search=test'))
    expect(searchCall).toBeTruthy()
  })

  test('should show loading spinner while searching', async ({ page }) => {
    // Type in search input
    const searchInput = page.locator('input[placeholder="Buscar categorías..."]')
    await searchInput.fill('category')
    
    // Check for loading spinner (should appear immediately)
    const spinner = page.locator('.animate-spin')
    await expect(spinner).toBeVisible()
    
    // Wait for search to complete
    await page.waitForTimeout(600)
    
    // Spinner should disappear after search completes
    await expect(spinner).not.toBeVisible()
  })

  test('should show clear button when search has text', async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Buscar categorías..."]')
    
    // Initially, clear button should not be visible
    let clearButton = page.locator('button[title="Limpiar búsqueda"]')
    await expect(clearButton).not.toBeVisible()
    
    // Type in search input
    await searchInput.fill('test search')
    
    // Clear button should appear
    clearButton = page.locator('button[title="Limpiar búsqueda"]')
    await expect(clearButton).toBeVisible()
    
    // Click clear button
    await clearButton.click()
    
    // Search input should be empty
    await expect(searchInput).toHaveValue('')
    
    // Clear button should disappear
    await expect(clearButton).not.toBeVisible()
  })

  test('should show search results message', async ({ page }) => {
    // Type in search input
    const searchInput = page.locator('input[placeholder="Buscar categorías..."]')
    await searchInput.fill('income')
    
    // Wait for debounce
    await page.waitForTimeout(600)
    
    // Check for search results message
    const resultsMessage = page.locator('text=Mostrando resultados para: "income"')
    await expect(resultsMessage).toBeVisible()
  })

  test('should show no results message when search returns empty', async ({ page }) => {
    // Type a search that likely returns no results
    const searchInput = page.locator('input[placeholder="Buscar categorías..."]')
    await searchInput.fill('xyznonexistentcategory123')
    
    // Wait for debounce
    await page.waitForTimeout(600)
    
    // Check for no results message
    const noResultsMessage = page.locator('text=/No se encontraron categorías que coincidan con/')
    await expect(noResultsMessage).toBeVisible()
  })

  test('should reset to page 1 when searching', async ({ page }) => {
    // First navigate to page 2 if pagination exists
    const paginationButtons = page.locator('.pagination-button')
    const pageCount = await paginationButtons.count()
    
    if (pageCount > 1) {
      // Click on page 2
      await paginationButtons.nth(1).click()
      await page.waitForTimeout(300)
      
      // Now search
      const searchInput = page.locator('input[placeholder="Buscar categorías..."]')
      await searchInput.fill('test')
      
      // Wait for debounce
      await page.waitForTimeout(600)
      
      // Check that we're back on page 1
      const currentPageIndicator = page.locator('text=/Mostrando 1/')
      await expect(currentPageIndicator).toBeVisible()
    }
  })

  test('should debounce search requests', async ({ page }) => {
    const apiCalls: string[] = []
    
    page.on('request', request => {
      if (request.url().includes('/api/categories') && request.url().includes('search=')) {
        apiCalls.push(request.url())
      }
    })

    const searchInput = page.locator('input[placeholder="Buscar categorías..."]')
    
    // Type quickly to test debouncing
    await searchInput.type('t')
    await searchInput.type('e')
    await searchInput.type('s')
    await searchInput.type('t')
    
    // Wait for debounce period
    await page.waitForTimeout(600)
    
    // Should only have made one API call (after debounce)
    expect(apiCalls.length).toBeLessThanOrEqual(1)
    
    // The API call should have the complete search term
    if (apiCalls.length > 0) {
      expect(apiCalls[0]).toContain('search=test')
    }
  })
})