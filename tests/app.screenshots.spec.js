import { expect, test } from '@playwright/test'

test('captures the main calculator flow in iOS mode', async ({ page }, testInfo) => {
  await page.goto('/')

  await expect(page.getByText('Calc', { exact: true })).toBeVisible()
  await expect(page.getByText('Result', { exact: true })).toBeVisible()
  await expect(page.getByText('Rooms', { exact: true }).first()).toBeVisible()

  await testInfo.attach('inputs-view', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  })

  await page.getByText('Result', { exact: true }).click()
  await expect(page.getByText('Summary')).toBeVisible()

  await testInfo.attach('results-view', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  })
})
