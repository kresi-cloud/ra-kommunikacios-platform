import { expect, test } from '@playwright/test'

test('bejelentkezés nélkül a belépési képernyőre irányít, nyilvános regisztráció nélkül', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/belepes$/)
  await expect(page.getByRole('heading', { name: 'Kommunikációs platform' })).toBeVisible()
  await expect(page.getByText('Nyilvános regisztráció nincs.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Belépés', exact: true })).toBeEnabled()
})

test('a mobil belépési képernyő nem görget vízszintesen', async ({ page }) => {
  await page.goto('/belepes')
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
  expect(overflow).toBe(false)
})
