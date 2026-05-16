import { expect, test } from '@playwright/test'

test('captures the main calculator flow in iOS mode', async ({ page }, testInfo) => {
  await page.goto('/')

  await expect(page.locator('.block-title').first()).toContainText('Rooms')
  await expect(page.getByText('Results', { exact: true })).toBeVisible()
  await expect(page.getByText('Details', { exact: true })).toBeVisible()

  await testInfo.attach('inputs-view', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  })

  await testInfo.attach('results-view', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  })
})
