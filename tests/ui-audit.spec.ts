import { expect, test } from '@playwright/test'

test('navigation, library links, and help produce visible results without console errors', async ({ page }) => {
  const browserErrors: string[] = []
  page.on('console', message => {
    if (message.type() === 'error' || message.type() === 'warning') browserErrors.push(`${message.type()}: ${message.text()}`)
  })
  page.on('pageerror', error => browserErrors.push(error.message))

  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('/')
  await expect(page.locator('.model-stage')).toHaveAttribute('data-model-ready', 'true')

  const headings: Record<string, string> = {
    Dashboard: 'Your workspace',
    Explore: 'Anatomical atlas',
    Challenge: 'Identification challenge',
    Progress: 'Performance overview',
  }
  for (const [tab, heading] of Object.entries(headings)) {
    await page.getByRole('button', { name: tab, exact: true }).click()
    await expect(page.locator('h1')).toHaveText(heading)
    await expect(page.locator('.main-nav .nav-item.selected')).toHaveText(tab)
  }

  await page.getByRole('button', { name: 'Atlas reference' }).click()
  await expect(page.locator('h1')).toHaveText('Anatomical atlas')
  await page.getByRole('button', { name: 'Systems & regions' }).click()
  await expect(page.locator('h1')).toHaveText('Anatomical atlas')

  await page.getByRole('button', { name: 'Help' }).click()
  const help = page.getByRole('dialog', { name: 'Quick guide' })
  await expect(help).toBeVisible()
  await expect(help).toContainText('Drag to orbit')
  await page.keyboard.press('Escape')
  await expect(help).toHaveCount(0)
  await page.getByRole('button', { name: 'Help' }).click()
  await page.getByRole('dialog', { name: 'Quick guide' }).getByRole('button', { name: 'Close help', exact: true }).click()
  expect(browserErrors).toEqual([])
})

test('challenge controls update selection, settings, and the start response', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.model-stage')).toHaveAttribute('data-model-ready', 'true')

  for (const difficulty of ['Beginner', 'Intermediate', 'Advanced', 'Expert']) {
    const option = page.getByRole('button', { name: difficulty, exact: true })
    await option.click()
    await expect(option).toHaveAttribute('aria-pressed', 'true')
    await expect(option).toHaveClass(/chosen/)
  }

  const identification = page.getByRole('button', { name: /Structure identification/ })
  const reverse = page.getByRole('button', { name: /Reverse identification/ })
  await reverse.click()
  await expect(reverse).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('.mode-card.active-mode')).toContainText('Reverse identification')
  await expect(page.locator('.challenge-overlay')).toContainText('REVERSE IDENTIFICATION')
  await identification.click()
  await expect(identification).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('.challenge-overlay')).toContainText('STRUCTURE IDENTIFICATION')

  const settings = page.getByRole('button', { name: 'Toggle challenge settings' })
  await settings.click()
  await expect(settings).toHaveAttribute('aria-expanded', 'true')
  await page.getByLabel('Question count').selectOption('5')
  await page.getByLabel('Time limit').selectOption('5 minutes')
  await expect(page.locator('.right-panel')).toContainText('5 structures')
  await expect(page.locator('.right-panel')).toContainText('5 minutes')
  await settings.click()
  await expect(settings).toHaveAttribute('aria-expanded', 'false')

  await page.getByRole('button', { name: 'START CHALLENGE' }).click()
  await expect(page.locator('.challenge-start-status')).toContainText('Challenge rounds are not available in this preview yet.')
  await expect(page.locator('.challenge-overlay')).toContainText('Challenge rounds are not available in this preview yet.')
})

test('details and structure search buttons work at desktop and constrained desktop widths', async ({ page }) => {
  await page.setViewportSize({ width: 896, height: 900 })
  await page.goto('/')
  await expect(page.locator('.model-stage')).toHaveAttribute('data-model-ready', 'true')

  await page.getByRole('button', { name: 'HIDE DETAILS' }).click()
  await expect(page.locator('.right-panel')).toHaveCount(0)
  await page.getByRole('button', { name: 'SHOW DETAILS' }).click()
  await expect(page.locator('.right-panel')).toBeVisible()

  await page.getByRole('button', { name: 'Explore', exact: true }).click()
  const searchButton = page.getByRole('button', { name: 'Search structures' })
  await searchButton.click()
  const search = page.getByRole('textbox', { name: 'Search structures' })
  await expect(search).toBeVisible()
  await search.fill('mandible')
  await expect(page.locator('.structure-select')).toHaveCount(1)
  await expect(page.getByRole('button', { name: 'Select Mandible' })).toBeVisible()
  await page.getByRole('button', { name: 'Select Mandible' }).click()
  await expect(page.locator('.right-panel h2')).toHaveText('Mandible')
  await page.getByRole('button', { name: 'Close structure search' }).click()
  await expect(page.getByRole('textbox', { name: 'Search structures' })).toHaveCount(0)
  await expect(page.locator('.structure-select')).toHaveCount(6)
})

test('mobile menu opens and navigation closes it', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Open menu' }).click()
  await expect(page.locator('.sidebar')).toHaveClass(/mobile-open/)
  await page.getByRole('button', { name: 'Systems & regions' }).click()
  await expect(page.locator('h1')).toHaveText('Anatomical atlas')
  await expect(page.locator('.sidebar')).not.toHaveClass(/mobile-open/)

  await page.getByRole('button', { name: 'Open menu' }).click()
  await page.getByRole('button', { name: 'Close menu' }).click()
  await expect(page.locator('.sidebar')).not.toHaveClass(/mobile-open/)
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
})
