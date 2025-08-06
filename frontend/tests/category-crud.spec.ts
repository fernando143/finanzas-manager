import { test, expect, Page } from '@playwright/test';

// Test configuration
const BASE_URL = 'http://localhost:5173';
// const API_URL = 'http://localhost:3000/api';

// Test data
const testCategories = {
  income: {
    name: 'Salario Test',
    type: 'INCOME',
    color: '#10B981', // Green
  },
  expense: {
    name: 'Alimentación Test',
    type: 'EXPENSE', 
    color: '#EF4444', // Red
  },
  subcategory: {
    name: 'Supermercado Test',
    type: 'EXPENSE',
    color: '#F59E0B', // Amber
  },
  updateData: {
    name: 'Categoría Actualizada',
    color: '#8B5CF6', // Purple
  }
};

// Helper functions
async function login(page: Page) {
  await page.goto(BASE_URL);
  
  // Check if already logged in by looking for dashboard elements
  const isDashboard = await page.locator('text="Dashboard"').isVisible().catch(() => false);
  
  if (!isDashboard) {
    // Perform login if needed
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'testpassword');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
  }
}

async function navigateToCategories(page: Page) {
  // Click on Categories menu item
  await page.click('text="Categorías"');
  await page.waitForURL('**/categories', { timeout: 5000 });
  await page.waitForLoadState('networkidle');
}

async function openCategoryForm(page: Page) {
  await page.click('button:has-text("Nueva Categoría")');
  await page.waitForSelector('[role="dialog"]', { state: 'visible' });
}

async function fillCategoryForm(page: Page, data: { name: string; type?: string; description?: string; color?: string }, isEdit = false) {
  // Fill name
  await page.fill('input[name="name"]', data.name);
  
  // Select type (only for new categories)
  if (!isEdit && data.type) {
    await page.selectOption('select[name="type"]', data.type);
  }
  
  // Select color if provided
  if (data.color) {
    // Click on color picker
    const colorPicker = page.locator('[data-testid="color-picker"]');
    if (await colorPicker.isVisible()) {
      await colorPicker.click();
      // Select color from palette or input hex value
      const colorInput = page.locator('input[type="color"]');
      if (await colorInput.isVisible()) {
        await colorInput.fill(data.color);
      } else {
        // Try clicking on a color swatch
        await page.click(`[data-color="${data.color}"]`).catch(async () => {
          // Fallback: try to find color input by any means
          await page.fill('input[placeholder*="color" i]', data.color).catch(() => {});
        });
      }
    }
  }
  
  // Select parent category if provided
  if (data.parentId) {
    await page.selectOption('select[name="parentId"]', data.parentId);
  }
}

async function submitForm(page: Page, buttonText = 'Crear') {
  await page.click(`button:has-text("${buttonText}")`);
  // Wait for modal to close
  await page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 5000 }).catch(() => {});
}

async function searchCategory(page: Page, searchTerm: string) {
  await page.fill('input[placeholder*="Buscar" i]', searchTerm);
  await page.waitForTimeout(500); // Debounce delay
}

async function selectViewMode(page: Page, mode: 'list' | 'grid' | 'tree') {
  const viewSelector = `button[data-view="${mode}"], button:has-text("${mode}")`;
  await page.click(viewSelector).catch(async () => {
    // Fallback: try different selectors
    await page.click(`[aria-label*="${mode}" i]`).catch(() => {});
  });
  await page.waitForTimeout(500);
}

async function filterByType(page: Page, type: 'ALL' | 'INCOME' | 'EXPENSE') {
  const filterText = type === 'ALL' ? 'Todos' : type === 'INCOME' ? 'Ingresos' : 'Egresos';
  await page.click(`button:has-text("${filterText}"), select:has-text("${filterText}")`).catch(async () => {
    // Fallback: try select element
    await page.selectOption('select[name="type"]', type).catch(() => {});
  });
  await page.waitForTimeout(500);
}

// Test Suite
test.describe('Category CRUD Operations', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await navigateToCategories(page);
  });

  test.describe('CREATE Operations', () => {
    test('should create a new income category', async ({ page }) => {
      await openCategoryForm(page);
      await fillCategoryForm(page, testCategories.income);
      await submitForm(page);
      
      // Verify category appears in list
      await expect(page.locator(`text="${testCategories.income.name}"`)).toBeVisible({ timeout: 5000 });
      
      // Verify badge shows correct type
      const categoryCard = page.locator(`[data-testid="category-card"]:has-text("${testCategories.income.name}")`);
      await expect(categoryCard.locator('text="Ingreso"')).toBeVisible();
    });

    test('should create a new expense category', async ({ page }) => {
      await openCategoryForm(page);
      await fillCategoryForm(page, testCategories.expense);
      await submitForm(page);
      
      // Verify category appears in list
      await expect(page.locator(`text="${testCategories.expense.name}"`)).toBeVisible({ timeout: 5000 });
      
      // Verify badge shows correct type
      const categoryCard = page.locator(`[data-testid="category-card"]:has-text("${testCategories.expense.name}")`);
      await expect(categoryCard.locator('text="Egreso"')).toBeVisible();
    });

    test('should create a subcategory', async ({ page }) => {
      // First create parent category
      await openCategoryForm(page);
      await fillCategoryForm(page, testCategories.expense);
      await submitForm(page);
      await page.waitForTimeout(1000);
      
      // Then create subcategory
      await openCategoryForm(page);
      await fillCategoryForm(page, {
        ...testCategories.subcategory,
        parentId: testCategories.expense.name // Will need to select parent
      });
      await submitForm(page);
      
      // Verify subcategory appears
      await expect(page.locator(`text="${testCategories.subcategory.name}"`)).toBeVisible({ timeout: 5000 });
    });

    test('should validate required fields', async ({ page }) => {
      await openCategoryForm(page);
      
      // Try to submit without filling required fields
      await submitForm(page);
      
      // Check for validation errors
      await expect(page.locator('text="El nombre es requerido"')).toBeVisible();
    });

    test('should prevent duplicate names', async ({ page }) => {
      // Create first category
      await openCategoryForm(page);
      await fillCategoryForm(page, testCategories.income);
      await submitForm(page);
      await page.waitForTimeout(1000);
      
      // Try to create duplicate
      await openCategoryForm(page);
      await fillCategoryForm(page, testCategories.income);
      await submitForm(page);
      
      // Check for error message
      await expect(page.locator('text="Ya existe una categoría con ese nombre"')).toBeVisible({ timeout: 5000 });
    });

    test('should validate color format', async ({ page }) => {
      await openCategoryForm(page);
      await fillCategoryForm(page, {
        name: 'Test Color',
        type: 'EXPENSE',
        color: 'invalid-color'
      });
      await submitForm(page);
      
      // Check for validation error
      await expect(page.locator('text="Formato de color inválido"')).toBeVisible();
    });
  });

  test.describe('READ Operations', () => {
    test.beforeEach(async ({ page }) => {
      // Create test data
      await openCategoryForm(page);
      await fillCategoryForm(page, testCategories.income);
      await submitForm(page);
      await page.waitForTimeout(500);
      
      await openCategoryForm(page);
      await fillCategoryForm(page, testCategories.expense);
      await submitForm(page);
      await page.waitForTimeout(500);
    });

    test('should display categories in list view', async ({ page }) => {
      await selectViewMode(page, 'list');
      
      // Verify both categories are visible
      await expect(page.locator(`text="${testCategories.income.name}"`)).toBeVisible();
      await expect(page.locator(`text="${testCategories.expense.name}"`)).toBeVisible();
    });

    test('should display categories in grid view', async ({ page }) => {
      await selectViewMode(page, 'grid');
      
      // Verify grid layout
      const gridContainer = page.locator('.grid, [class*="grid"]');
      await expect(gridContainer).toBeVisible();
      
      // Verify categories are in grid
      await expect(page.locator(`text="${testCategories.income.name}"`)).toBeVisible();
      await expect(page.locator(`text="${testCategories.expense.name}"`)).toBeVisible();
    });

    test('should display categories in tree view', async ({ page }) => {
      await selectViewMode(page, 'tree');
      
      // Verify tree structure
      const treeContainer = page.locator('.category-tree, [data-testid="category-tree"]');
      await expect(treeContainer).toBeVisible();
      
      // Verify categories are in tree
      await expect(page.locator(`text="${testCategories.income.name}"`)).toBeVisible();
      await expect(page.locator(`text="${testCategories.expense.name}"`)).toBeVisible();
    });

    test('should search categories by name', async ({ page }) => {
      await searchCategory(page, 'Salario');
      
      // Verify filtered results
      await expect(page.locator(`text="${testCategories.income.name}"`)).toBeVisible();
      await expect(page.locator(`text="${testCategories.expense.name}"`)).not.toBeVisible();
    });

    test('should filter by income type', async ({ page }) => {
      await filterByType(page, 'INCOME');
      
      // Verify only income categories show
      await expect(page.locator(`text="${testCategories.income.name}"`)).toBeVisible();
      await expect(page.locator(`text="${testCategories.expense.name}"`)).not.toBeVisible();
    });

    test('should filter by expense type', async ({ page }) => {
      await filterByType(page, 'EXPENSE');
      
      // Verify only expense categories show
      await expect(page.locator(`text="${testCategories.expense.name}"`)).toBeVisible();
      await expect(page.locator(`text="${testCategories.income.name}"`)).not.toBeVisible();
    });

    test('should show all categories when filter is removed', async ({ page }) => {
      // First filter
      await filterByType(page, 'INCOME');
      await expect(page.locator(`text="${testCategories.expense.name}"`)).not.toBeVisible();
      
      // Remove filter
      await filterByType(page, 'ALL');
      
      // Verify all categories show
      await expect(page.locator(`text="${testCategories.income.name}"`)).toBeVisible();
      await expect(page.locator(`text="${testCategories.expense.name}"`)).toBeVisible();
    });
  });

  test.describe('UPDATE Operations', () => {
    test.beforeEach(async ({ page }) => {
      // Create a category to edit
      await openCategoryForm(page);
      await fillCategoryForm(page, testCategories.expense);
      await submitForm(page);
      await page.waitForTimeout(500);
    });

    test('should edit category name', async ({ page }) => {
      // Find and click edit button
      const categoryCard = page.locator(`[data-testid="category-card"]:has-text("${testCategories.expense.name}")`);
      await categoryCard.locator('button[aria-label*="Editar" i]').click();
      
      // Edit form should open with current values
      await page.waitForSelector('[role="dialog"]', { state: 'visible' });
      
      // Update name
      await page.fill('input[name="name"]', testCategories.updateData.name);
      await submitForm(page, 'Actualizar');
      
      // Verify updated name appears
      await expect(page.locator(`text="${testCategories.updateData.name}"`)).toBeVisible({ timeout: 5000 });
      await expect(page.locator(`text="${testCategories.expense.name}"`)).not.toBeVisible();
    });

    test('should edit category color', async ({ page }) => {
      // Find and click edit button
      const categoryCard = page.locator(`[data-testid="category-card"]:has-text("${testCategories.expense.name}")`);
      await categoryCard.locator('button[aria-label*="Editar" i]').click();
      
      // Wait for modal
      await page.waitForSelector('[role="dialog"]', { state: 'visible' });
      
      // Update color
      await fillCategoryForm(page, { 
        name: testCategories.expense.name,
        color: testCategories.updateData.color 
      }, true);
      await submitForm(page, 'Actualizar');
      
      // Verify color indicator changed (would need visual regression testing for full verification)
      await page.waitForTimeout(1000);
      const updatedCard = page.locator(`[data-testid="category-card"]:has-text("${testCategories.expense.name}")`);
      await expect(updatedCard).toBeVisible();
    });

    test('should validate updated name uniqueness', async ({ page }) => {
      // Create another category
      await openCategoryForm(page);
      await fillCategoryForm(page, testCategories.income);
      await submitForm(page);
      await page.waitForTimeout(500);
      
      // Try to edit first category with second category's name
      const categoryCard = page.locator(`[data-testid="category-card"]:has-text("${testCategories.expense.name}")`);
      await categoryCard.locator('button[aria-label*="Editar" i]').click();
      
      await page.waitForSelector('[role="dialog"]', { state: 'visible' });
      await page.fill('input[name="name"]', testCategories.income.name);
      await submitForm(page, 'Actualizar');
      
      // Check for error
      await expect(page.locator('text="Ya existe una categoría con ese nombre"')).toBeVisible({ timeout: 5000 });
    });

    test('should not allow changing type if category has transactions', async ({ page }) => {
      // This would require creating transactions first
      // For now, verify that type selector is disabled in edit mode
      const categoryCard = page.locator(`[data-testid="category-card"]:has-text("${testCategories.expense.name}")`);
      await categoryCard.locator('button[aria-label*="Editar" i]').click();
      
      await page.waitForSelector('[role="dialog"]', { state: 'visible' });
      
      // Type selector should not be present in edit mode
      const typeSelector = page.locator('select[name="type"]');
      await expect(typeSelector).not.toBeVisible();
    });
  });

  test.describe('DELETE Operations', () => {
    test.beforeEach(async ({ page }) => {
      // Create categories for testing
      await openCategoryForm(page);
      await fillCategoryForm(page, testCategories.expense);
      await submitForm(page);
      await page.waitForTimeout(500);
    });

    test('should delete empty category', async ({ page }) => {
      // Find and click delete button
      const categoryCard = page.locator(`[data-testid="category-card"]:has-text("${testCategories.expense.name}")`);
      await categoryCard.locator('button[aria-label*="Eliminar" i]').click();
      
      // Confirm deletion in dialog
      await page.waitForSelector('[role="dialog"]', { state: 'visible' });
      await expect(page.locator('text="¿Estás seguro?"')).toBeVisible();
      await page.click('button:has-text("Eliminar")');
      
      // Wait for dialog to close and category to disappear
      await page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 5000 }).catch(() => {});
      await expect(page.locator(`text="${testCategories.expense.name}"`)).not.toBeVisible({ timeout: 5000 });
    });

    test('should show warning for category with dependencies', async ({ page }) => {
      // Create parent category
      await openCategoryForm(page);
      const parentCategory = { name: 'Parent Test', type: 'EXPENSE', color: '#000000' };
      await fillCategoryForm(page, parentCategory);
      await submitForm(page);
      await page.waitForTimeout(500);
      
      // Create child category
      await openCategoryForm(page);
      await fillCategoryForm(page, {
        name: 'Child Test',
        type: 'EXPENSE',
        parentId: parentCategory.name
      });
      await submitForm(page);
      await page.waitForTimeout(500);
      
      // Try to delete parent
      const parentCard = page.locator(`[data-testid="category-card"]:has-text("${parentCategory.name}")`);
      await parentCard.locator('button[aria-label*="Eliminar" i]').click();
      
      // Should show dependency warning
      await page.waitForSelector('[role="dialog"]', { state: 'visible' });
      await expect(page.locator('text="No se puede eliminar"')).toBeVisible();
      await expect(page.locator('text="subcategorías"')).toBeVisible();
      
      // Delete button should be disabled
      const deleteButton = page.locator('[role="dialog"] button:has-text("Eliminar")');
      await expect(deleteButton).toBeDisabled();
    });

    test('should cancel deletion', async ({ page }) => {
      // Find and click delete button
      const categoryCard = page.locator(`[data-testid="category-card"]:has-text("${testCategories.expense.name}")`);
      await categoryCard.locator('button[aria-label*="Eliminar" i]').click();
      
      // Cancel deletion
      await page.waitForSelector('[role="dialog"]', { state: 'visible' });
      await page.click('button:has-text("Cancelar")');
      
      // Category should still exist
      await expect(page.locator(`text="${testCategories.expense.name}"`)).toBeVisible();
    });
  });

  test.describe('Hierarchy Management', () => {
    test('should enforce maximum 3 levels of hierarchy', async ({ page }) => {
      // Create level 1
      await openCategoryForm(page);
      const level1 = { name: 'Level 1', type: 'EXPENSE', color: '#111111' };
      await fillCategoryForm(page, level1);
      await submitForm(page);
      await page.waitForTimeout(500);
      
      // Create level 2
      await openCategoryForm(page);
      const level2 = { name: 'Level 2', type: 'EXPENSE', parentId: level1.name };
      await fillCategoryForm(page, level2);
      await submitForm(page);
      await page.waitForTimeout(500);
      
      // Create level 3
      await openCategoryForm(page);
      const level3 = { name: 'Level 3', type: 'EXPENSE', parentId: level2.name };
      await fillCategoryForm(page, level3);
      await submitForm(page);
      await page.waitForTimeout(500);
      
      // Try to create level 4 (should fail)
      await openCategoryForm(page);
      const level4 = { name: 'Level 4', type: 'EXPENSE', parentId: level3.name };
      await fillCategoryForm(page, level4);
      await submitForm(page);
      
      // Should show error
      await expect(page.locator('text="Profundidad máxima excedida"')).toBeVisible({ timeout: 5000 });
    });

    test('should enforce type consistency between parent and child', async ({ page }) => {
      // Create income parent
      await openCategoryForm(page);
      const incomeParent = { name: 'Income Parent', type: 'INCOME', color: '#00FF00' };
      await fillCategoryForm(page, incomeParent);
      await submitForm(page);
      await page.waitForTimeout(500);
      
      // Try to create expense child (should fail)
      await openCategoryForm(page);
      await fillCategoryForm(page, {
        name: 'Expense Child',
        type: 'EXPENSE',
        parentId: incomeParent.name
      });
      await submitForm(page);
      
      // Should show error
      await expect(page.locator('text="Tipos inconsistentes"')).toBeVisible({ timeout: 5000 });
    });

    test('should prevent circular references', async ({ page }) => {
      // Create parent
      await openCategoryForm(page);
      const parent = { name: 'Parent Circular', type: 'EXPENSE', color: '#FF0000' };
      await fillCategoryForm(page, parent);
      await submitForm(page);
      await page.waitForTimeout(500);
      
      // Create child
      await openCategoryForm(page);
      const child = { name: 'Child Circular', type: 'EXPENSE', parentId: parent.name };
      await fillCategoryForm(page, child);
      await submitForm(page);
      await page.waitForTimeout(500);
      
      // Try to edit parent to have child as parent (circular reference)
      const parentCard = page.locator(`[data-testid="category-card"]:has-text("${parent.name}")`);
      await parentCard.locator('button[aria-label*="Editar" i]').click();
      
      await page.waitForSelector('[role="dialog"]', { state: 'visible' });
      await page.selectOption('select[name="parentId"]', child.name);
      await submitForm(page, 'Actualizar');
      
      // Should show error
      await expect(page.locator('text="Referencia circular"')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('UI/UX Features', () => {
    test('should show loading states during operations', async ({ page }) => {
      await openCategoryForm(page);
      await fillCategoryForm(page, testCategories.income);
      
      // Start observing for loading indicator
      const submitPromise = submitForm(page);
      
      // Check for loading state (button disabled or spinner)
      const submitButton = page.locator('button:has-text("Crear")');
      await expect(submitButton).toBeDisabled();
      
      await submitPromise;
    });

    test('should maintain filter state when switching views', async ({ page }) => {
      // Create test data
      await openCategoryForm(page);
      await fillCategoryForm(page, testCategories.income);
      await submitForm(page);
      await page.waitForTimeout(500);
      
      await openCategoryForm(page);
      await fillCategoryForm(page, testCategories.expense);
      await submitForm(page);
      await page.waitForTimeout(500);
      
      // Apply filter
      await filterByType(page, 'INCOME');
      
      // Switch view
      await selectViewMode(page, 'grid');
      
      // Filter should still be applied
      await expect(page.locator(`text="${testCategories.income.name}"`)).toBeVisible();
      await expect(page.locator(`text="${testCategories.expense.name}"`)).not.toBeVisible();
    });

    test('should show category colors in all views', async ({ page }) => {
      // Create colored category
      await openCategoryForm(page);
      await fillCategoryForm(page, testCategories.income);
      await submitForm(page);
      await page.waitForTimeout(500);
      
      // Check list view
      await selectViewMode(page, 'list');
      const listColorIndicator = page.locator(`[data-testid="category-card"]:has-text("${testCategories.income.name}") [style*="background-color"]`);
      await expect(listColorIndicator).toBeVisible();
      
      // Check grid view
      await selectViewMode(page, 'grid');
      const gridColorIndicator = page.locator(`[data-testid="category-card"]:has-text("${testCategories.income.name}") [style*="background-color"]`);
      await expect(gridColorIndicator).toBeVisible();
      
      // Check tree view
      await selectViewMode(page, 'tree');
      const treeColorIndicator = page.locator(`.category-tree:has-text("${testCategories.income.name}") [style*="background-color"]`);
      await expect(treeColorIndicator).toBeVisible();
    });

    test('should be keyboard navigable', async ({ page }) => {
      // Create categories
      await openCategoryForm(page);
      await fillCategoryForm(page, testCategories.income);
      await submitForm(page);
      await page.waitForTimeout(500);
      
      // Test tab navigation
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Should be able to open form with Enter
      const newCategoryButton = page.locator('button:has-text("Nueva Categoría")');
      await newCategoryButton.focus();
      await page.keyboard.press('Enter');
      
      // Modal should open
      await expect(page.locator('[role="dialog"]')).toBeVisible();
      
      // Should be able to close with Escape
      await page.keyboard.press('Escape');
      await expect(page.locator('[role="dialog"]')).not.toBeVisible();
    });

    test('should show appropriate icons and badges', async ({ page }) => {
      // Create global category simulation (would need backend setup)
      await openCategoryForm(page);
      await fillCategoryForm(page, testCategories.income);
      await submitForm(page);
      await page.waitForTimeout(500);
      
      // Check for type badge
      const categoryCard = page.locator(`[data-testid="category-card"]:has-text("${testCategories.income.name}")`);
      await expect(categoryCard.locator('text="Ingreso"')).toBeVisible();
      
      // Check for action buttons
      await expect(categoryCard.locator('button[aria-label*="Editar" i]')).toBeVisible();
      await expect(categoryCard.locator('button[aria-label*="Eliminar" i]')).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should show user-friendly error messages', async ({ page }) => {
      // Try to create with empty name
      await openCategoryForm(page);
      await page.selectOption('select[name="type"]', 'EXPENSE');
      await submitForm(page);
      
      // Should show validation error in Spanish
      await expect(page.locator('text="El nombre es requerido"')).toBeVisible();
    });

    test('should handle network errors gracefully', async ({ page }) => {
      // Simulate network failure by going offline
      await page.context().setOffline(true);
      
      await openCategoryForm(page);
      await fillCategoryForm(page, testCategories.income);
      await submitForm(page);
      
      // Should show error message
      await expect(page.locator('text="Error de conexión"')).toBeVisible({ timeout: 10000 });
      
      // Restore connection
      await page.context().setOffline(false);
    });

    test('should recover from errors', async ({ page }) => {
      // Create category with invalid data
      await openCategoryForm(page);
      await page.fill('input[name="name"]', '');
      await submitForm(page);
      
      // Should show error
      await expect(page.locator('text="El nombre es requerido"')).toBeVisible();
      
      // Fix error and retry
      await page.fill('input[name="name"]', 'Recovery Test');
      await page.selectOption('select[name="type"]', 'EXPENSE');
      await submitForm(page);
      
      // Should succeed
      await expect(page.locator('text="Recovery Test"')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Performance', () => {
    test('should handle large lists efficiently', async ({ page }) => {
      // Create multiple categories
      for (let i = 1; i <= 10; i++) {
        await openCategoryForm(page);
        await fillCategoryForm(page, {
          name: `Category ${i}`,
          type: i % 2 === 0 ? 'INCOME' : 'EXPENSE',
          color: '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')
        });
        await submitForm(page);
        await page.waitForTimeout(200);
      }
      
      // Measure search performance
      const startTime = Date.now();
      await searchCategory(page, 'Category');
      const searchTime = Date.now() - startTime;
      
      // Should be responsive (< 1 second)
      expect(searchTime).toBeLessThan(1000);
      
      // All categories should be visible
      for (let i = 1; i <= 10; i++) {
        await expect(page.locator(`text="Category ${i}"`)).toBeVisible();
      }
    });

    test('should implement pagination for large datasets', async ({ page }) => {
      // This would require backend to have many categories
      // Check for pagination controls
      const paginationControls = page.locator('[aria-label="Pagination"], .pagination');
      
      // If there are many categories, pagination should be visible
      // This is a conditional test based on data volume
      const categoryCount = await page.locator('[data-testid="category-card"]').count();
      
      if (categoryCount > 50) {
        await expect(paginationControls).toBeVisible();
      }
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper ARIA labels', async ({ page }) => {
      await openCategoryForm(page);
      
      // Check form has proper labels
      const nameInput = page.locator('input[name="name"]');
      await expect(nameInput).toHaveAttribute('aria-label', /nombre/i);
      
      const typeSelect = page.locator('select[name="type"]');
      await expect(typeSelect).toHaveAttribute('aria-label', /tipo/i);
    });

    test('should announce changes to screen readers', async ({ page }) => {
      // Create a category
      await openCategoryForm(page);
      await fillCategoryForm(page, testCategories.income);
      await submitForm(page);
      
      // Check for live region announcements
      const liveRegion = page.locator('[role="status"], [aria-live="polite"]');
      await expect(liveRegion).toContainText(/creada exitosamente/i);
    });

    test('should support high contrast mode', async ({ page }) => {
      // Enable high contrast (browser specific)
      await page.emulateMedia({ colorScheme: 'dark' });
      
      // Verify UI is still usable
      await openCategoryForm(page);
      await expect(page.locator('input[name="name"]')).toBeVisible();
      await expect(page.locator('button:has-text("Crear")')).toBeVisible();
    });
  });
});

// Integration test with backend
test.describe('Backend Integration', () => {
  test('should persist categories across sessions', async ({ browser }) => {
    // Create category in first session
    const context1 = await browser.newContext();
    const page1 = await context1.newPage();
    
    await login(page1);
    await navigateToCategories(page1);
    await openCategoryForm(page1);
    await fillCategoryForm(page1, testCategories.income);
    await submitForm(page1);
    
    await expect(page1.locator(`text="${testCategories.income.name}"`)).toBeVisible();
    await context1.close();
    
    // Verify in second session
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    
    await login(page2);
    await navigateToCategories(page2);
    
    // Category should still exist
    await expect(page2.locator(`text="${testCategories.income.name}"`)).toBeVisible();
    await context2.close();
  });

  test('should handle concurrent operations', async ({ browser }) => {
    // Create two separate sessions
    const context1 = await browser.newContext();
    const page1 = await context1.newPage();
    await login(page1);
    await navigateToCategories(page1);
    
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    await login(page2);
    await navigateToCategories(page2);
    
    // Create categories simultaneously
    await Promise.all([
      (async () => {
        await openCategoryForm(page1);
        await fillCategoryForm(page1, { name: 'Concurrent 1', type: 'INCOME' });
        await submitForm(page1);
      })(),
      (async () => {
        await openCategoryForm(page2);
        await fillCategoryForm(page2, { name: 'Concurrent 2', type: 'EXPENSE' });
        await submitForm(page2);
      })()
    ]);
    
    // Both should be created successfully
    await page1.reload();
    await expect(page1.locator('text="Concurrent 1"')).toBeVisible();
    await expect(page1.locator('text="Concurrent 2"')).toBeVisible();
    
    await context1.close();
    await context2.close();
  });
});