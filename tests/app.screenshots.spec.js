import { expect, test } from '@playwright/test'

test('captures the main calculator flow in iOS mode', async ({ page }, testInfo) => {
  await page.goto('/')

  await expect(page.getByText('Rooms')).toBeVisible()

  await testInfo.attach('inputs-view', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  })

  await page.getByRole('button', { name: 'Results' }).click()

  await expect(page.getByText('Monthly summary')).toBeVisible()

  await testInfo.attach('results-view', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  })
})
