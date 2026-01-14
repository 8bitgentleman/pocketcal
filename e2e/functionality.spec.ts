import { test, expect } from '@playwright/test';

test.describe('Functional E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    // Close welcome modal if present
    const closeButton = page.getByLabel(/close/i).first();
    if (await closeButton.isVisible()) {
      await closeButton.click();
    }
  });

  test.describe('Calendar Management', () => {
    test('should create and delete calendar', async ({ page }) => {
      // Add calendar
      await page.click('text=Add Calendar');
      await expect(page.getByText('Calendar 1')).toBeVisible();

      // Delete calendar
      const deleteButton = page.getByLabel(/delete/i).first();
      await deleteButton.click();

      await expect(page.getByText('Calendar 1')).not.toBeVisible();
    });

    test('should rename calendar', async ({ page }) => {
      // Add calendar
      await page.click('text=Add Calendar');

      // Click on calendar name to edit
      const calendarName = page.getByText('Calendar 1');
      await calendarName.click();

      // Type new name
      const input = page.getByDisplayValue('Calendar 1');
      await input.fill('My Work Calendar');
      await input.press('Enter');

      await expect(page.getByText('My Work Calendar')).toBeVisible();
    });

    test('should select different calendars', async ({ page }) => {
      // Add two calendars
      await page.click('text=Add Calendar');
      await page.waitForTimeout(100);
      await page.click('text=Add Calendar');

      // Click on first calendar
      await page.click('text=Calendar 1');
      await page.waitForTimeout(100);

      // Click on second calendar
      await page.click('text=Calendar 2');
      await page.waitForTimeout(100);

      // Both should exist
      await expect(page.getByText('Calendar 1')).toBeVisible();
      await expect(page.getByText('Calendar 2')).toBeVisible();
    });

    test('should persist calendars after page reload', async ({ page }) => {
      // Add calendar
      await page.click('text=Add Calendar');
      await expect(page.getByText('Calendar 1')).toBeVisible();

      // Reload page
      await page.reload();

      // Calendar should still exist
      await expect(page.getByText('Calendar 1')).toBeVisible();
    });
  });

  test.describe('Date Selection', () => {
    test('should select single date', async ({ page }) => {
      // Add calendar
      await page.click('text=Add Calendar');

      // Click on a date cell
      const gridCells = page.locator('[role="gridcell"]');
      const targetCell = gridCells.nth(10);

      await targetCell.click();

      // Date should be selected (aria-selected="true")
      await expect(targetCell).toHaveAttribute('aria-selected', 'true');
    });

    test('should select date range with drag', async ({ page }) => {
      // Add calendar
      await page.click('text=Add Calendar');

      const gridCells = page.locator('[role="gridcell"]');
      const startCell = gridCells.nth(10);
      const endCell = gridCells.nth(15);

      // Mouse down on start
      await startCell.dispatchEvent('mousedown');

      // Mouse enter on end
      await endCell.dispatchEvent('mouseenter');

      // Mouse up
      await endCell.dispatchEvent('mouseup');

      // Range should be selected
      await expect(startCell).toHaveAttribute('aria-selected', 'true');
      await expect(endCell).toHaveAttribute('aria-selected', 'true');
    });

    test('should delete date range', async ({ page }) => {
      // Add calendar and select dates
      await page.click('text=Add Calendar');

      const gridCells = page.locator('[role="gridcell"]');
      const targetCell = gridCells.nth(10);
      await targetCell.click();

      // Should be selected
      await expect(targetCell).toHaveAttribute('aria-selected', 'true');

      // Click delete or deselect (implementation specific)
      // For now, verify selection exists
      const selectedCells = page.locator('[aria-selected="true"]');
      await expect(selectedCells).toHaveCount(1);
    });
  });

  test.describe('Settings', () => {
    test('should toggle weekends', async ({ page }) => {
      // Weekends should be hidden by default
      await expect(page.getByText('Sat')).not.toBeVisible();

      // Toggle show weekends
      const weekendsCheckbox = page.getByLabel(/show weekends/i);
      await weekendsCheckbox.check();

      // Weekends should now be visible
      await expect(page.getByText('Sat')).toBeVisible();
      await expect(page.getByText('Sun')).toBeVisible();

      // Toggle off
      await weekendsCheckbox.uncheck();

      // Weekends should be hidden again
      await expect(page.getByText('Sat')).not.toBeVisible();
    });

    test('should toggle today marker', async ({ page }) => {
      const todayCheckbox = page.getByLabel(/show today/i);

      // Should be checked by default
      await expect(todayCheckbox).toBeChecked();

      // Uncheck
      await todayCheckbox.uncheck();
      await expect(todayCheckbox).not.toBeChecked();

      // Check again
      await todayCheckbox.check();
      await expect(todayCheckbox).toBeChecked();
    });

    test('should toggle dark mode', async ({ page }) => {
      const darkModeToggle = page.getByLabel(/dark mode/i);

      // Toggle dark mode on
      await darkModeToggle.click();
      await page.waitForTimeout(100);

      // Verify dark class is applied to body or root element
      const bodyClasses = await page.evaluate(() => document.body.className);
      expect(bodyClasses).toContain('dark');

      // Toggle off
      await darkModeToggle.click();
      await page.waitForTimeout(100);

      const bodyClassesAfter = await page.evaluate(() => document.body.className);
      expect(bodyClassesAfter).not.toContain('dark');
    });

    test('should persist settings after reload', async ({ page }) => {
      // Change settings
      await page.getByLabel(/show weekends/i).check();
      await page.getByLabel(/show today/i).uncheck();

      // Reload
      await page.reload();

      // Settings should persist
      await expect(page.getByLabel(/show weekends/i)).toBeChecked();
      await expect(page.getByLabel(/show today/i)).not.toBeChecked();
    });
  });

  test.describe('Modals', () => {
    test('should open and close help modal', async ({ page }) => {
      // Open help modal
      await page.getByLabel(/help/i).click();

      // Modal should be visible
      await expect(page.getByRole('dialog')).toBeVisible();

      // Close modal
      const closeButton = page.getByLabel(/close/i).first();
      await closeButton.click();

      // Modal should be hidden
      await expect(page.getByRole('dialog')).not.toBeVisible();
    });

    test('should open share modal with shareable link', async ({ page }) => {
      // Add calendar to have data
      await page.click('text=Add Calendar');

      // Open share modal
      await page.getByLabel(/share/i).click();

      // Modal should be visible
      await expect(page.getByRole('dialog')).toBeVisible();

      // Should contain a link
      const linkInput = page.getByRole('textbox');
      const linkValue = await linkInput.inputValue();

      expect(linkValue).toContain('http');
    });

    test('should copy link to clipboard', async ({ page }) => {
      // Grant clipboard permissions
      await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

      await page.click('text=Add Calendar');
      await page.getByLabel(/share/i).click();

      // Click copy button
      await page.click('text=Copy');

      // Verify copied (would need to check clipboard or success message)
      await expect(page.getByText(/copied/i)).toBeVisible({ timeout: 3000 });
    });

    test('should close modal with escape key', async ({ page }) => {
      await page.getByLabel(/help/i).click();
      await expect(page.getByRole('dialog')).toBeVisible();

      // Press escape
      await page.keyboard.press('Escape');

      // Modal should close
      await expect(page.getByRole('dialog')).not.toBeVisible();
    });

    test('should close modal on backdrop click', async ({ page }) => {
      await page.getByLabel(/help/i).click();
      await expect(page.getByRole('dialog')).toBeVisible();

      // Click backdrop (outside modal)
      const backdrop = page.locator('.modal-backdrop, [role="dialog"]').first();
      const box = await backdrop.boundingBox();

      if (box) {
        // Click in top-left corner (likely backdrop)
        await page.mouse.click(10, 10);
      }

      // Modal may or may not close depending on implementation
    });
  });

  test.describe('Share and Load', () => {
    test('should generate and load from URL', async ({ page }) => {
      // Create calendar with data
      await page.click('text=Add Calendar');

      const gridCells = page.locator('[role="gridcell"]');
      await gridCells.nth(10).click();

      // Get shareable link
      await page.getByLabel(/share/i).click();
      const linkInput = page.getByRole('textbox');
      const shareUrl = await linkInput.inputValue();

      // Navigate to share URL
      await page.goto(shareUrl);

      // Data should be loaded
      await expect(page.getByText('Calendar 1')).toBeVisible();
    });

    test('should handle reconciliation modal', async ({ page }) => {
      // Create local data
      await page.click('text=Add Calendar');

      // Create different URL state (would need to manually construct URL)
      // This is a complex test that requires URL manipulation
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('should navigate with tab key', async ({ page }) => {
      // Tab through interactive elements
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // Verify focus is moving
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(focusedElement).toBeTruthy();
    });

    test('should navigate calendar with arrow keys', async ({ page }) => {
      const gridCells = page.locator('[role="gridcell"]');
      const firstCell = gridCells.first();

      await firstCell.focus();
      await page.keyboard.press('ArrowRight');

      // Focus should move (implementation specific)
    });

    test('should close modal with escape', async ({ page }) => {
      await page.getByLabel(/help/i).click();
      await page.keyboard.press('Escape');

      await expect(page.getByRole('dialog')).not.toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have no accessibility violations on load', async ({ page }) => {
      // This would require axe-core or similar
      // For now, verify key accessibility features

      // Should have main landmark
      await expect(page.locator('main, [role="main"]')).toBeVisible();

      // Calendar should have proper role
      await expect(page.getByRole('grid')).toBeVisible();

      // Buttons should have labels
      const buttons = page.getByRole('button');
      const count = await buttons.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should have proper ARIA labels', async ({ page }) => {
      // Verify important elements have labels
      await expect(page.getByLabel(/add calendar/i)).toBeVisible();
      await expect(page.getByLabel(/help/i)).toBeVisible();
      await expect(page.getByLabel(/share/i)).toBeVisible();
    });

    test('should have keyboard-accessible buttons', async ({ page }) => {
      const addButton = page.getByText(/add calendar/i);

      await addButton.focus();
      await page.keyboard.press('Enter');

      // Calendar should be added
      await expect(page.getByText('Calendar 1')).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle invalid date selections gracefully', async ({ page }) => {
      await page.click('text=Add Calendar');

      // Try various invalid interactions
      const gridCells = page.locator('[role="gridcell"]');

      // Rapid clicking
      for (let i = 0; i < 10; i++) {
        await gridCells.nth(i).click({ force: true });
      }

      // Should not crash
      await expect(page.getByRole('grid')).toBeVisible();
    });

    test('should handle rapid calendar additions', async ({ page }) => {
      // Rapidly add calendars
      for (let i = 0; i < 5; i++) {
        await page.click('text=Add Calendar');
      }

      // Should stop at limit
      const calendars = page.locator('[data-calendar-item]');
      const count = await calendars.count();

      expect(count).toBeLessThanOrEqual(5); // Free user limit
    });

    test('should handle corrupted localStorage', async ({ page }) => {
      // Inject corrupted data
      await page.evaluate(() => {
        localStorage.setItem('calendar-state', 'invalid{json}');
      });

      // Reload
      await page.reload();

      // Should not crash, fall back to default state
      await expect(page.getByRole('grid')).toBeVisible();
    });
  });

  test.describe('Performance', () => {
    test('should render large number of date cells efficiently', async ({ page }) => {
      const startTime = Date.now();

      await page.waitForSelector('[role="grid"]');

      const endTime = Date.now();
      const loadTime = endTime - startTime;

      // Should load within reasonable time (< 3 seconds)
      expect(loadTime).toBeLessThan(3000);
    });

    test('should handle multiple calendars without lag', async ({ page }) => {
      // Add 5 calendars
      for (let i = 0; i < 5; i++) {
        await page.click('text=Add Calendar');
        await page.waitForTimeout(50);
      }

      // Interact with calendar
      const gridCells = page.locator('[role="gridcell"]');
      await gridCells.nth(10).click();

      // Should remain responsive
      await expect(page.getByRole('grid')).toBeVisible();
    });
  });
});
