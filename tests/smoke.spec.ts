import { expect, test } from '@playwright/test'

const structures = [
  { name: 'Frontal bone', x: 0.5, y: 0.33 },
  { name: 'Zygomatic bone', x: 0.3, y: 0.63 },
  { name: 'Maxilla', x: 0.5, y: 0.7 },
  { name: 'Mandible', x: 0.3, y: 0.72 },
]

test('loads the skull and selects each represented structure', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle('ANATOMY — Training Workstation')
  await expect(page.getByRole('heading', { name: 'Identification challenge' })).toBeVisible()

  const canvas = page.locator('.viewport canvas')
  await expect(canvas).toBeVisible()
  await page.getByRole('button', { name: 'Explore', exact: true }).click()

  const bounds = await canvas.boundingBox()
  if (!bounds) {
    throw new Error('The 3D canvas has no visible bounds')
  }

  for (const structure of structures) {
    await canvas.click({
      position: { x: bounds.width * structure.x, y: bounds.height * structure.y },
    })
    await expect(page.locator('.right-panel h2')).toHaveText(structure.name)
  }
})

test('viewport controls respond to clicks', async ({ page }) => {
  await page.goto('/')

  const wireframe = page.getByRole('button', { name: 'Toggle wireframe' })
  await wireframe.click()
  await expect(wireframe).toHaveClass(/active/)

  const labels = page.getByRole('button', { name: 'Toggle labels' })
  await labels.click()
  await expect(labels).not.toHaveClass(/active/)

  await page.locator('.view-controls button[title="Zoom in"]').click()
  await page.locator('.view-controls button[title="Reset camera"]').click()
})

test('navigation adapts between desktop and mobile layouts', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('/')
  await expect(page.locator('.sidebar')).toBeVisible()
  await expect(page.locator('.mobile-menu')).toBeHidden()
  const desktopCenter = await page.locator('.center-column').boundingBox()
  const desktopPanel = await page.locator('.right-panel').boundingBox()
  if (!desktopCenter || !desktopPanel) {
    throw new Error('Desktop workspace columns have no visible bounds')
  }
  expect(desktopPanel.x).toBeGreaterThan(desktopCenter.x)

  await page.setViewportSize({ width: 390, height: 844 })
  await expect(page.locator('.mobile-menu')).toBeVisible()
  await page.locator('.mobile-menu').click()
  await expect(page.locator('.sidebar')).toHaveClass(/mobile-open/)

  await page.getByRole('button', { name: 'Explore', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Anatomical atlas' })).toBeVisible()
  await expect(page.locator('.sidebar')).not.toHaveClass(/mobile-open/)
  const mobileCenter = await page.locator('.center-column').boundingBox()
  const mobilePanel = await page.locator('.right-panel').boundingBox()
  if (!mobileCenter || !mobilePanel) {
    throw new Error('Mobile workspace sections have no visible bounds')
  }
  expect(mobilePanel.y).toBeGreaterThan(mobileCenter.y)
})
