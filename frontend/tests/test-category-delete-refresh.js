#!/usr/bin/env node

/**
 * Test script to verify category deletion refreshes the list
 * This tests that after deleting a category, the list updates automatically
 */

const puppeteer = require('puppeteer');

const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWR3N2Y4ODcwMDAwcnFnc2pmeGZuMDQ0IiwiZW1haWwiOiJ0ZXN0QGZpYW56YXMuY29tIiwiaWF0IjoxNzU0MzQ4NDgzLCJleHAiOjE3NTQ5NTMyODN9._GW65DsXoHDAy3tLUf5swJL-iD9Mhey9JgN8GfioG_0';

async function testCategoryDeleteRefresh() {
  console.log('🚀 Starting category delete refresh test...');
  
  const browser = await puppeteer.launch({
    headless: false,
    devtools: false
  });
  
  try {
    const page = await browser.newPage();
    
    // Set auth token
    await page.evaluateOnNewDocument((token) => {
      localStorage.setItem('authToken', token);
    }, AUTH_TOKEN);
    
    // Navigate to categories page
    console.log('📍 Navigating to categories page...');
    await page.goto('http://localhost:5173/categories', { waitUntil: 'networkidle0' });
    
    // Wait for categories to load
    await page.waitForSelector('.category-card, .category-list-item', { timeout: 5000 });
    
    // Count initial categories
    const initialCount = await page.evaluate(() => {
      const cards = document.querySelectorAll('.category-card, .category-list-item');
      return cards.length;
    });
    console.log(`📊 Initial category count: ${initialCount}`);
    
    // Find a user category (not global) to delete
    const deletableCategory = await page.evaluate(() => {
      const cards = document.querySelectorAll('.category-card');
      for (const card of cards) {
        const deleteBtn = card.querySelector('[data-testid="delete-category"]');
        // Check if delete button is enabled (not disabled)
        if (deleteBtn && !deleteBtn.disabled && !deleteBtn.classList.contains('opacity-50')) {
          const categoryName = card.querySelector('h3')?.textContent || 'Unknown';
          deleteBtn.click();
          return categoryName;
        }
      }
      return null;
    });
    
    if (!deletableCategory) {
      console.log('⚠️ No deletable categories found. Creating one to test...');
      
      // Create a test category
      const createBtn = await page.$('button:has-text("Nueva Categoría")');
      if (createBtn) {
        await createBtn.click();
        await page.waitForSelector('input[name="name"]', { timeout: 3000 });
        
        // Fill the form
        await page.type('input[name="name"]', 'Test Category for Deletion');
        await page.select('select[name="type"]', 'EXPENSE');
        
        // Submit
        await page.click('button[type="submit"]');
        await page.waitForTimeout(2000);
        
        // Try delete again
        const newDeleteBtn = await page.evaluate(() => {
          const cards = document.querySelectorAll('.category-card');
          for (const card of cards) {
            if (card.textContent?.includes('Test Category for Deletion')) {
              const deleteBtn = card.querySelector('[data-testid="delete-category"]');
              if (deleteBtn) {
                deleteBtn.click();
                return true;
              }
            }
          }
          return false;
        });
        
        if (!newDeleteBtn) {
          throw new Error('Could not find delete button for test category');
        }
      }
    } else {
      console.log(`🗑️ Attempting to delete category: "${deletableCategory}"`);
    }
    
    // Wait for delete dialog
    await page.waitForSelector('.fixed.inset-0', { timeout: 5000 });
    console.log('📋 Delete confirmation dialog opened');
    
    // Confirm deletion
    await page.click('button:has-text("Eliminar")');
    console.log('✅ Clicked delete confirm button');
    
    // Wait for dialog to close and list to refresh
    await page.waitForFunction(
      () => !document.querySelector('.fixed.inset-0'),
      { timeout: 5000 }
    );
    
    // Wait a bit for the list to refresh
    await page.waitForTimeout(1000);
    
    // Count categories after deletion
    const finalCount = await page.evaluate(() => {
      const cards = document.querySelectorAll('.category-card, .category-list-item');
      return cards.length;
    });
    console.log(`📊 Final category count: ${finalCount}`);
    
    // Check if count decreased
    if (finalCount < initialCount) {
      console.log('✅ SUCCESS: Category list refreshed after deletion!');
      console.log(`   Categories reduced from ${initialCount} to ${finalCount}`);
    } else {
      console.log('❌ FAIL: Category list did not refresh properly');
      console.log(`   Expected count to decrease from ${initialCount}, but got ${finalCount}`);
    }
    
    // Check for success message
    const successMessage = await page.evaluate(() => {
      const alerts = document.querySelectorAll('.bg-green-50');
      return alerts.length > 0 ? alerts[0].textContent : null;
    });
    
    if (successMessage) {
      console.log(`✅ Success message displayed: ${successMessage}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
    console.log('🏁 Test completed');
  }
}

// Run the test
testCategoryDeleteRefresh();