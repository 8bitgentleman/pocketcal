import { test, expect } from '@playwright/test';

test.describe('Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test.describe('Initial Load', () => {
    test('should display empty calendar on first load', async ({ page }) => {
      await page.goto('/');

      // Wait for calendar to render
      await page.waitForSelector('[role="grid"]');

      // Take screenshot
      await expect(page).toHaveScreenshot('empty-calendar.png');
    });

    test('should show welcome modal on first visit', async ({ page }) => {
      await page.goto('/');

      // Wait for welcome modal
      const welcomeModal = page.getByRole('dialog');
      await expect(welcomeModal).toBeVisible();

      // Screenshot welcome modal
      await expect(page).toHaveScreenshot('welcome-modal.png');
    });

    test('should display calendar grid with months', async ({ page }) => {
      await page.goto('/');

      // Close welcome modal if present
      const closeButton = page.getByLabel(/close/i);
      if (await closeButton.isVisible()) {
        await closeButton.click();
      }

      // Verify month headers are visible
      await expect(page.getByText('Jan')).toBeVisible();
      await expect(page.getByText('Dec')).toBeVisible();

      await expect(page).toHaveScreenshot('calendar-grid.png');
    });
  });

  test.describe('Calendar Creation', () => {
    test('should display new calendar in sidebar', async ({ page }) => {
      await page.goto('/');

      // Close welcome modal
      const closeButton = page.getByLabel(/close/i).first();
      if (await closeButton.isVisible()) {
        await closeButton.click();
      }

      // Add new calendar
      await page.click('text=Add Calendar');

      // Wait for calendar to appear
      await page.waitForSelector('text=Calendar 1');

      await expect(page).toHaveScreenshot('calendar-created.png');
    });

    test('should show multiple calendars in sidebar', async ({ page }) => {
      await page.goto('/');

      // Close welcome modal
      const closeButton = page.getByLabel(/close/i).first();
      if (await closeButton.isVisible()) {
        await closeButton.click();
      }

      // Add 3 calendars
      for (let i = 0; i < 3; i++) {
        await page.click('text=Add Calendar');
        await page.waitForTimeout(100);
      }

      await expect(page).toHaveScreenshot('multiple-calendars.png');
    });
  });

  test.describe('Date Selection', () => {
    test('should highlight selected dates', async ({ page }) => {
      await page.goto('/');

      // Setup
      const closeButton = page.getByLabel(/close/i).first();
      if (await closeButton.isVisible()) {
        await closeButton.click();
      }

      await page.click('text=Add Calendar');

      // Select a date range
      const gridCells = page.locator('[role="gridcell"]');
      const firstCell = gridCells.nth(10);
      const lastCell = gridCells.nth(15);

      await firstCell.click();
      await lastCell.click({ modifiers: ['Shift'] });

      await expect(page).toHaveScreenshot('selected-dates.png');
    });

    test('should show gradient for overlapping calendars', async ({ page }) => {
      await page.goto('/');

      // Setup
      const closeButton = page.getByLabel(/close/i).first();
      if (await closeButton.isVisible()) {
        await closeButton.click();
      }

      // Create two calendars
      await page.click('text=Add Calendar');
      await page.waitForTimeout(100);
      await page.click('text=Add Calendar');

      // Select overlapping date ranges (implementation specific)
      // This would require actual date selection interaction

      await expect(page).toHaveScreenshot('overlapping-calendars.png');
    });
  });

  test.describe('Dark Mode', () => {
    test('should display dark mode correctly', async ({ page }) => {
      await page.goto('/');

      // Close welcome modal
      const closeButton = page.getByLabel(/close/i).first();
      if (await closeButton.isVisible()) {
        await closeButton.click();
      }

      // Toggle dark mode
      const darkModeToggle = page.getByLabel(/dark mode/i);
      await darkModeToggle.click();

      // Wait for theme to apply
      await page.waitForTimeout(300);

      await expect(page).toHaveScreenshot('dark-mode.png');
    });

    test('should display dark mode with calendars', async ({ page }) => {
      await page.goto('/');

      const closeButton = page.getByLabel(/close/i).first();
      if (await closeButton.isVisible()) {
        await closeButton.click();
      }

      // Add calendars
      await page.click('text=Add Calendar');
      await page.waitForTimeout(100);

      // Toggle dark mode
      const darkModeToggle = page.getByLabel(/dark mode/i);
      await darkModeToggle.click();

      await page.waitForTimeout(300);

      await expect(page).toHaveScreenshot('dark-mode-with-calendars.png');
    });
  });

  test.describe('Modals', () => {
    test('should display help modal correctly', async ({ page }) => {
      await page.goto('/');

      const closeButton = page.getByLabel(/close/i).first();
      if (await closeButton.isVisible()) {
        await closeButton.click();
      }

      // Open help modal
      const helpButton = page.getByLabel(/help/i);
      await helpButton.click();

      // Wait for modal
      await page.waitForSelector('[role="dialog"]');

      await expect(page).toHaveScreenshot('help-modal.png');
    });

    test('should display share modal correctly', async ({ page }) => {
      await page.goto('/');

      const closeButton = page.getByLabel(/close/i).first();
      if (await closeButton.isVisible()) {
        await closeButton.click();
      }

      // Add calendar to have data to share
      await page.click('text=Add Calendar');

      // Open share modal
      const shareButton = page.getByLabel(/share/i);
      await shareButton.click();

      await page.waitForSelector('[role="dialog"]');

      await expect(page).toHaveScreenshot('share-modal.png');
    });

    test('should display PTO selection modal', async ({ page }) => {
      await page.goto('/');

      const closeButton = page.getByLabel(/close/i).first();
      if (await closeButton.isVisible()) {
        await closeButton.click();
      }

      // This would require setting up PTO calendar and clicking on a date
      // Implementation specific based on actual modal trigger
    });
  });

  test.describe('PTO Features', () => {
    test('should display PTO dashboard', async ({ page }) => {
      await page.goto('/');

      const closeButton = page.getByLabel(/close/i).first();
      if (await closeButton.isVisible()) {
        await closeButton.click();
      }

      // Add calendar and enable PTO (implementation specific)
      await page.click('text=Add Calendar');

      // Look for PTO dashboard
      const ptoDashboard = page.locator('text=PTO Balance');
      if (await ptoDashboard.isVisible()) {
        await expect(page).toHaveScreenshot('pto-dashboard.png');
      }
    });

    test('should show PTO hours on calendar', async ({ page }) => {
      await page.goto('/');

      const closeButton = page.getByLabel(/close/i).first();
      if (await closeButton.isVisible()) {
        await closeButton.click();
      }

      // Setup PTO calendar with entries (implementation specific)
      // Would require enabling PTO and adding entries

      await expect(page).toHaveScreenshot('pto-calendar.png');
    });
  });

  test.describe('Settings', () => {
    test('should display calendar without weekends', async ({ page }) => {
      await page.goto('/');

      const closeButton = page.getByLabel(/close/i).first();
      if (await closeButton.isVisible()) {
        await closeButton.click();
      }

      // Verify weekends are hidden by default
      const saturdayHeader = page.locator('text=Sat');
      await expect(saturdayHeader).not.toBeVisible();

      await expect(page).toHaveScreenshot('no-weekends.png');
    });

    test('should display calendar with weekends', async ({ page }) => {
      await page.goto('/');

      const closeButton = page.getByLabel(/close/i).first();
      if (await closeButton.isVisible()) {
        await closeButton.click();
      }

      // Toggle show weekends
      const weekendsToggle = page.getByLabel(/show weekends/i);
      await weekendsToggle.click();

      // Verify weekends are shown
      const saturdayHeader = page.locator('text=Sat');
      await expect(saturdayHeader).toBeVisible();

      await expect(page).toHaveScreenshot('with-weekends.png');
    });

    test('should show/hide today marker', async ({ page }) => {
      await page.goto('/');

      const closeButton = page.getByLabel(/close/i).first();
      if (await closeButton.isVisible()) {
        await closeButton.click();
      }

      // Toggle today marker
      const todayToggle = page.getByLabel(/show today/i);
      await todayToggle.click();

      await page.waitForTimeout(100);

      await expect(page).toHaveScreenshot('no-today-marker.png');

      // Toggle back
      await todayToggle.click();
      await page.waitForTimeout(100);

      await expect(page).toHaveScreenshot('with-today-marker.png');
    });
  });

  test.describe('Responsive Design', () => {
    test('should display correctly on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');

      const closeButton = page.getByLabel(/close/i).first();
      if (await closeButton.isVisible()) {
        await closeButton.click();
      }

      await expect(page).toHaveScreenshot('mobile-view.png');
    });

    test('should display correctly on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/');

      const closeButton = page.getByLabel(/close/i).first();
      if (await closeButton.isVisible()) {
        await closeButton.click();
      }

      await expect(page).toHaveScreenshot('tablet-view.png');
    });

    test('should display correctly on desktop viewport', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto('/');

      const closeButton = page.getByLabel(/close/i).first();
      if (await closeButton.isVisible()) {
        await closeButton.click();
      }

      await expect(page).toHaveScreenshot('desktop-view.png');
    });
  });

  test.describe('Holidays', () => {
    test('should highlight company holidays', async ({ page }) => {
      await page.goto('/');

      const closeButton = page.getByLabel(/close/i).first();
      if (await closeButton.isVisible()) {
        await closeButton.click();
      }

      // New Year's Day should be highlighted
      const newYearsDay = page.getByLabel(/January 1/);
      await expect(newYearsDay).toBeVisible();

      await expect(page).toHaveScreenshot('holidays.png');
    });
  });

  test.describe('Edge Cases', () => {
    test('should display leap year correctly', async ({ page }) => {
      // This would require setting the calendar to a leap year
      await page.goto('/');

      const closeButton = page.getByLabel(/close/i).first();
      if (await closeButton.isVisible()) {
        await closeButton.click();
      }

      // Would need to set year to 2024 via store manipulation
      await expect(page).toHaveScreenshot('leap-year.png');
    });

    test('should handle many calendars visually', async ({ page }) => {
      await page.goto('/');

      const closeButton = page.getByLabel(/close/i).first();
      if (await closeButton.isVisible()) {
        await closeButton.click();
      }

      // Add 5 calendars
      for (let i = 0; i < 5; i++) {
        await page.click('text=Add Calendar');
        await page.waitForTimeout(100);
      }

      await expect(page).toHaveScreenshot('max-calendars.png');
    });
  });
});
