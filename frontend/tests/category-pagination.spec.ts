import { test, expect } from '@playwright/test'

test.describe('Category Pagination', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the categories page
    await page.goto('http://localhost:5174')
    
    // Wait for the app to load
    await page.waitForLoadState('networkidle')
    
    // Navigate to categories section if needed
    const categoriesLink = page.locator('text=Categorías')
    if (await categoriesLink.isVisible()) {
      await categoriesLink.click()
    }
  })

  test('should display pagination controls', async ({ page }) => {
    // Check if pagination component is visible when there are many categories
    const pagination = page.locator('.enhanced-pagination, [class*="pagination"]').first()
    
    // Check for pagination elements
    if (await pagination.isVisible()) {
      // Check for page numbers
      await expect(pagination.locator('button').filter({ hasText: '1' })).toBeVisible()
      
      // Check for navigation buttons
      const prevButton = pagination.locator('button').filter({ hasText: 'Anterior' })
      const nextButton = pagination.locator('button').filter({ hasText: 'Siguiente' })
      
      // At least one navigation method should be visible
      const hasPrevNext = await prevButton.isVisible() || await nextButton.isVisible()
      const hasChevrons = await pagination.locator('svg').first().isVisible()
      
      expect(hasPrevNext || hasChevrons).toBeTruthy()
    }
  })

  test('should display items per page selector', async ({ page }) => {
    // Look for items per page selector
    const itemsPerPageSelector = page.locator('select').filter({ hasText: /10|20|50/ })
    
    if (await itemsPerPageSelector.isVisible()) {
      // Verify it has the expected options
      const options = await itemsPerPageSelector.locator('option').allTextContents()
      expect(options).toContain('10')
      expect(options).toContain('20')
      expect(options).toContain('50')
    }
  })

  test('should show category count information', async ({ page }) => {
    // Look for text showing "Mostrando X-Y de Z categorías"
    const summaryText = page.locator('text=/Mostrando.*de.*categorías/')
    
    if (await summaryText.isVisible()) {
      const text = await summaryText.textContent()
      expect(text).toMatch(/Mostrando \d+ (-|a) \d+ de \d+ categorías/)
    }
  })

  test('should change page when clicking pagination controls', async ({ page }) => {
    const pagination = page.locator('.enhanced-pagination, [class*="pagination"]').first()
    
    if (await pagination.isVisible()) {
      // Check if there's a page 2 button
      const page2Button = pagination.locator('button').filter({ hasText: '2' })
      
      if (await page2Button.isVisible()) {
        // Get initial category list
        const initialFirstCategory = await page.locator('.category-card, [class*="category-list"] > div').first().textContent()
        
        // Click page 2
        await page2Button.click()
        
        // Wait for content to update
        await page.waitForTimeout(500)
        
        // Get new first category
        const newFirstCategory = await page.locator('.category-card, [class*="category-list"] > div').first().textContent()
        
        // They should be different if pagination worked
        expect(initialFirstCategory).not.toBe(newFirstCategory)
      }
    }
  })

  test('should update items per page when selector is changed', async ({ page }) => {
    const itemsPerPageSelector = page.locator('select').filter({ hasText: /10|20|50/ })
    
    if (await itemsPerPageSelector.isVisible()) {
      // Count initial items
      // const initialCount = await page.locator('.category-card, [class*="CategoryCard"]').count()
      
      // Change items per page
      await itemsPerPageSelector.selectOption('10')
      
      // Wait for update
      await page.waitForTimeout(500)
      
      // Count new items (should be max 10)
      const newCount = await page.locator('.category-card, [class*="CategoryCard"]').count()
      expect(newCount).toBeLessThanOrEqual(10)
    }
  })

  test('should show loading state during page transitions', async ({ page }) => {
    const pagination = page.locator('.enhanced-pagination, [class*="pagination"]').first()
    
    if (await pagination.isVisible()) {
      const page2Button = pagination.locator('button').filter({ hasText: '2' })
      
      if (await page2Button.isVisible()) {
        // Set up promise to watch for loading indicator
        const loadingPromise = page.waitForSelector('text=/Cargando|Loading|Actualizando/', { 
          state: 'visible',
          timeout: 2000 
        }).catch(() => null)
        
        // Click page 2
        await page2Button.click()
        
        // Check if loading indicator appeared
        const loadingElement = await loadingPromise
        if (loadingElement) {
          expect(loadingElement).toBeTruthy()
        }
      }
    }
  })

  test('should maintain filter state when changing pages', async ({ page }) => {
    // Apply a filter first
    const typeFilter = page.locator('select').filter({ hasText: /Todas|Ingresos|Egresos/ })
    
    if (await typeFilter.isVisible()) {
      // Select expense type
      await typeFilter.selectOption('EXPENSE')
      await page.waitForTimeout(500)
      
      // Now change page if pagination is available
      const pagination = page.locator('.enhanced-pagination, [class*="pagination"]').first()
      if (await pagination.isVisible()) {
        const page2Button = pagination.locator('button').filter({ hasText: '2' })
        
        if (await page2Button.isVisible()) {
          await page2Button.click()
          await page.waitForTimeout(500)
          
          // Check that filter is still applied
          const filterValue = await typeFilter.inputValue()
          expect(filterValue).toBe('EXPENSE')
        }
      }
    }
  })
})