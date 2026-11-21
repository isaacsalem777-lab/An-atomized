import { expect, test } from '@playwright/test'

const structures = [
  { name: 'Frontal bone', fmaId: 'FMA52734', meshId: 'FJ3200', x: 0.5, y: 0.34 },
  { name: 'Left zygomatic bone', fmaId: 'FMA52893', meshId: 'FJ3287', x: 0.64, y: 0.53 },
  { name: 'Right zygomatic bone', fmaId: 'FMA52892', meshId: 'FJ3392', x: 0.36, y: 0.53 },
  { name: 'Left maxilla', fmaId: 'FMA53650', meshId: 'FJ3269', x: 0.55, y: 0.65 },
  { name: 'Right maxilla', fmaId: 'FMA53649', meshId: 'FJ3375', x: 0.45, y: 0.65 },
  { name: 'Mandible', fmaId: 'FMA52748', meshId: 'FJ3289', x: 0.5, y: 0.8 },
]

test('loads and independently selects all six source bones', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle('ANATOMY — Training Workstation')
  await expect(page.getByRole('heading', { name: 'Identification challenge' })).toBeVisible()

  const canvas = page.locator('.viewport canvas')
  await expect(canvas).toBeVisible()
  await expect(page.locator('.model-stage')).toHaveAttribute('data-model-ready', 'true')
  await page.getByRole('button', { name: 'Explore', exact: true }).click()

  const bounds = await canvas.boundingBox()
  if (!bounds) {
    throw new Error('The 3D canvas has no visible bounds')
  }

  for (const structure of structures) {
    await canvas.click({
      position: { x: bounds.width * structure.x, y: bounds.height * structure.y },
    })
    const panel = page.locator('.right-panel')
    await expect(panel.locator('h2')).toHaveText(structure.name)
    await expect(panel).toContainText(`FMA: ${structure.fmaId}`)
    await expect(panel).toContainText(`BodyParts3D mesh: ${structure.meshId}`)
  }

  const last = structures[structures.length - 1]
  await canvas.click({ position: { x: bounds.width * last.x, y: bounds.height * last.y } })
  await expect(page.locator('.right-panel h2')).toHaveText('Select a bone')
  await expect(page.locator('.right-panel')).toContainText('NO STRUCTURE SELECTED')
})

test('selection, camera controls, and viewport toggles respond to input', async ({ page }) => {
  await page.goto('/')

  const canvas = page.locator('.viewport canvas')
  await expect(page.locator('.model-stage')).toHaveAttribute('data-model-ready', 'true')
  const canvasBounds = await canvas.boundingBox()
  if (!canvasBounds) {
    throw new Error('The 3D canvas has no visible bounds')
  }
  await canvas.click({ position: { x: canvasBounds.width / 2, y: canvasBounds.height * 0.8 } })
  await expect(page.locator('.challenge-overlay')).toContainText('Selected: Mandible')
  await canvas.click({ position: { x: canvasBounds.width / 2, y: canvasBounds.height * 0.8 } })
  await expect(page.locator('.challenge-overlay')).toContainText('Selected: None')

  const beforeOrbit = await canvas.screenshot()
  await page.mouse.move(canvasBounds.x + canvasBounds.width / 2, canvasBounds.y + canvasBounds.height / 2)
  await page.mouse.down()
  await page.mouse.move(canvasBounds.x + canvasBounds.width * 0.65, canvasBounds.y + canvasBounds.height * 0.46, { steps: 8 })
  await page.mouse.up()
  await expect.poll(async () => (await canvas.screenshot()).equals(beforeOrbit)).toBe(false)

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
  await expect(page.locator('.viewport canvas')).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
})
