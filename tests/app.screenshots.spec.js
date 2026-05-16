import { expect, test } from '@playwright/test'

test('captures the main calculator flow in iOS mode', async ({ page }, testInfo) => {
  await page.goto('/')

  await expect(page.getByText('Calc', { exact: true }).first()).toBeVisible()
  await expect(page.getByText('Result', { exact: true }).first()).toBeVisible()
  await expect(page.getByText(/^Rooms/).first()).toBeVisible()

  // 1. Calc tab — initial (collapsed)
  await testInfo.attach('01-calc-tab-collapsed', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  })

  // 2. Rooms accordion expanded
  await page.locator('.accordion-item').filter({ hasText: 'Rooms' }).first().click()
  await page.waitForTimeout(400)
  await testInfo.attach('02-rooms-accordion-open', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  })

  // 3. Costs and taxes expanded
  await page.locator('.accordion-item').filter({ hasText: 'Costs and taxes' }).click()
  await page.waitForTimeout(400)
  await testInfo.attach('03-costs-taxes-open', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  })

  // 4. Profit targets expanded
  await page.locator('.accordion-item').filter({ hasText: 'Profit targets' }).click()
  await page.waitForTimeout(400)
  await testInfo.attach('04-profit-targets-open', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  })

  // 5. Results tab
  await page.getByText('Result', { exact: true }).click()
  await expect(page.locator('#tab-result.tab-active')).toBeVisible()
  await expect(page.getByText('Summary')).toBeVisible()
  await testInfo.attach('05-results-tab', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  })

  // 6. Summary accordion expanded
  await page.locator('.accordion-item').filter({ hasText: 'Summary' }).first().click()
  await page.waitForTimeout(400)
  await testInfo.attach('06-summary-expanded', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  })

  // 7. Room 1 card expanded — use JS to scroll and click in the scroll container
  await page.evaluate(() => {
    const container = document.querySelector('#tab-result.tab-active .page-content')
    if (container) container.scrollTop = 0
    const toggle = document.querySelector('.accordion-item .accordion-item-toggle')
    if (toggle) toggle.click()
  })
  await page.waitForTimeout(600)
  await testInfo.attach('07-room1-card-expanded', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  })
})
