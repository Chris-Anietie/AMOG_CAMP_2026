import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // Open application in E2E seed mode
  await page.goto('/?e2e=true');
});

test('Received Today opens Daily Audit modal', async ({ page }) => {
  await page.getByText('Received Today').click();
  await expect(page.getByText('Daily Reconciliation')).toBeVisible();
});

test('Pay button opens Record Payment modal', async ({ page }) => {
  // Pay User should be present from seeded data
  await page.locator('text=Pay').first().click();
  await expect(page.getByText('Record Payment')).toBeVisible();
});

test('Admit button opens Check-In modal for paid user', async ({ page }) => {
  // Find the card that contains "Paid User" and click its Admit button
  const paidCard = page.locator('div', { hasText: 'Paid User' }).first();
  await expect(paidCard).toBeVisible();
  await paidCard.getByRole('button', { name: /Admit/i }).click();
  await expect(page.getByText('Check-In')).toBeVisible();
});

test('Trash opens delete confirmation modal', async ({ page }) => {
  // Click the first trash button (it should open the Delete modal)
  await page.locator('button:has(svg)').filter({ hasText: '' }).first().click();
  await expect(page.getByText('Delete User?')).toBeVisible();
});