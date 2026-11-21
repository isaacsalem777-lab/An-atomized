import { expect, test } from '@playwright/test'

test('Atlas is the honest default and fabricated dashboard content is absent', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('/')
  await expect(page).toHaveTitle('ANATOMY — Anatomy Atlas')
  await expect(page.locator('.model-stage')).toHaveAttribute('data-model-ready', 'true')
  await expect(page.getByRole('heading', { name: 'Anatomy Atlas' })).toBeVisible()
  await expect(page.locator('.main-nav .nav-item.selected')).toHaveText('Atlas')
  await expect(page.getByRole('navigation', { name: 'Primary navigation' }).getByRole('button')).toHaveCount(3)
  await expect(page.getByRole('button', { name: 'Dashboard', exact: true })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Atlas reference' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Systems & regions' })).toHaveCount(0)
  await expect(page.locator('.stat-tile')).toHaveCount(0)
  await expect(page.locator('.system-status, .profile-card, .session-chip')).toHaveCount(0)
  await expect(page.locator('.page-content')).toContainText('242 selectable structures')
  await expect(page.locator('.page-content')).toContainText('simplified adult-male reference model')
  await expect(page.locator('.viewport-caption')).toContainText('CC BY-SA 2.1 JP')
  await expect(page.locator('.atrium-environment')).toHaveAttribute('aria-hidden', 'true')
  expect(await page.locator('.atrium-environment').evaluate(element => getComputedStyle(element).pointerEvents)).toBe('none')
})

test('Challenge and Progress explain their real availability without fake metrics', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Challenge', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Challenge sessions are not available yet' })).toBeVisible()
  await expect(page.locator('.future-state')).toContainText('Timed rounds, answer validation, and scoring are not implemented.')
  await expect(page.getByRole('button', { name: 'START CHALLENGE' })).toHaveCount(0)
  await expect(page.locator('.stat-tile')).toHaveCount(0)

  await page.getByRole('button', { name: 'Progress', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Progress tracking is not available yet' })).toBeVisible()
  await expect(page.locator('.future-state')).toContainText('No progress has been tracked.')
  await expect(page.locator('.stat-tile')).toHaveCount(0)
  await page.getByRole('button', { name: 'Open Atlas' }).click()
  await expect(page.getByRole('heading', { name: 'Anatomy Atlas' })).toBeVisible()
})

test('reference search, details visibility, and Help respond at desktop widths', async ({ page }) => {
  await page.setViewportSize({ width: 896, height: 900 })
  await page.goto('/')
  await expect(page.locator('.model-stage')).toHaveAttribute('data-model-ready', 'true')

  const hidePanel = page.getByRole('button', { name: 'Hide panel' })
  await hidePanel.click()
  await expect(page.locator('.right-panel')).toHaveCount(0)
  await page.getByRole('button', { name: 'Show panel' }).click()
  await expect(page.locator('.right-panel')).toBeVisible()

  await page.getByRole('button', { name: 'Search structures' }).click()
  const search = page.getByRole('textbox', { name: 'Search structures' })
  await expect(search).toBeVisible()
  await search.fill('mandible')
  await expect(page.locator('.structure-select')).toHaveCount(1)
  await page.getByRole('button', { name: 'Select Mandible' }).click()
  await expect(page.locator('.right-panel h2')).toHaveText('Mandible')
  await search.fill('BP28')
  await expect(page.locator('.structure-select')).toHaveCount(1)
  await page.getByRole('button', { name: 'Select Right lower costal cartilages' }).click()
  await expect(page.locator('.right-panel h2')).toHaveText('Right lower costal cartilages')
  await expect(page.locator('.right-panel')).toContainText('BodyParts3D: BP28')
  await page.getByRole('button', { name: 'Close structure search' }).click()
  await expect(page.locator('.structure-select')).toHaveCount(242)

  await page.getByRole('button', { name: 'Help' }).click()
  const help = page.getByRole('dialog', { name: 'Using the anatomy viewer' })
  await expect(help).toBeVisible()
  await expect(help).toContainText('coccyx, teeth, and ear ossicles')
  await page.keyboard.press('Escape')
  await expect(help).toHaveCount(0)
})

test('filters reflect only catalog anatomy and mobile navigation remains usable without console errors', async ({ page }) => {
  const browserErrors: string[] = []
  page.on('console', message => {
    if (message.type() === 'error' || message.type() === 'warning') browserErrors.push(`${message.type()}: ${message.text()}`)
  })
  page.on('pageerror', error => browserErrors.push(error.message))

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await expect(page.locator('.model-stage')).toHaveAttribute('data-model-ready', 'true')
  await expect(page.getByLabel('System filter').locator('option')).toHaveText(['All systems', 'Bone and joints'])
  await expect(page.getByLabel('Region filter').locator('option')).toHaveText([
    'All regions', 'Skull', 'Neck', 'Spine', 'Thorax', 'Pelvis', 'Upper limbs', 'Lower limbs',
  ])

  await page.getByLabel('System filter').selectOption('Bone and joints')
  await page.getByLabel('Region filter').selectOption('Skull')
  await expect(page.locator('.model-stage')).toHaveAttribute('data-visible-count', '22')
  await page.getByLabel('Region filter').selectOption('Neck')
  await expect(page.locator('.model-stage')).toHaveAttribute('data-visible-count', '1')

  await expect(page.getByRole('navigation', { name: 'Primary navigation' }).getByRole('button')).toHaveCount(3)
  await page.getByRole('button', { name: 'Progress', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Progress tracking is not available yet' })).toBeVisible()

  await page.getByRole('button', { name: 'Challenge', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Challenge sessions are not available yet' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
  expect(browserErrors).toEqual([])
})

test('keeps keyboard focus visible and honors reduced-motion preferences', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')

  const atlas = page.getByRole('button', { name: 'Atlas', exact: true })
  await page.keyboard.press('Tab')
  await expect(atlas).toBeFocused()
  await expect(atlas).toHaveCSS('outline-style', 'solid')
  await expect(atlas).toHaveCSS('transition-duration', '0s')
})

test('announces the deferred viewport while its module is loading', async ({ page }) => {
  await page.route('**/Viewport.tsx*', async route => {
    await new Promise(resolve => setTimeout(resolve, 300))
    await route.continue()
  })

  await page.goto('/')
  await expect(page.locator('.viewport-loading')).toContainText('Preparing the anatomy viewer')
  await expect(page.locator('.model-stage')).toHaveAttribute('data-model-ready', 'true')
})
