import { expect, test } from '@playwright/test'

const representativeStructures = [
  { name: 'Frontal bone', anatomyId: 'anatomy:bone:frontal', sourceId: 'frontal-bone', externalLabel: 'FMA: FMA52734' },
  { name: 'Left zygomatic bone', anatomyId: 'anatomy:bone:zygomatic:left', sourceId: 'left-zygomatic-bone', externalLabel: 'FMA: FMA52893' },
  { name: 'Sixth cervical vertebra (C6)', anatomyId: 'anatomy:skeleton:fma12524', sourceId: 'sixth-cervical-vertebra-c6', externalLabel: 'FMA: FMA12524' },
  { name: 'Body of sternum', anatomyId: 'anatomy:skeleton:fma7487', sourceId: 'body-of-sternum', externalLabel: 'FMA: FMA7487' },
  { name: 'Right hip bone', anatomyId: 'anatomy:skeleton:fma16586', sourceId: 'right-hip-bone', externalLabel: 'FMA: FMA16586' },
  { name: 'Left humerus', anatomyId: 'anatomy:skeleton:fma23131', sourceId: 'left-humerus', externalLabel: 'FMA: FMA23131' },
  { name: 'Left femur', anatomyId: 'anatomy:skeleton:fma24475', sourceId: 'left-femur', externalLabel: 'FMA: FMA24475' },
  { name: 'Right lower costal cartilages', anatomyId: 'anatomy:skeleton:bodyparts3d-bp28', sourceId: 'right-lower-costal-cartilages', externalLabel: 'BodyParts3D: BP28' },
]

test('loads and selects source structures across the full skeleton', async ({ page }) => {
  await page.route('**/skeleton.glb', async route => {
    await new Promise(resolve => setTimeout(resolve, 400))
    await route.continue()
  })
  await page.goto('/')
  await expect(page).toHaveTitle('ANATOMY — Anatomy Explorer')
  await expect(page.getByRole('heading', { name: 'Explore anatomy' })).toBeVisible()
  await expect(page.locator('.viewport-footer [role="status"]')).toContainText('Loading the skeleton model')

  const stage = page.locator('.model-stage')
  await expect(stage).toHaveAttribute('data-structure-count', '242')
  await expect(stage).toHaveAttribute('data-model-ready', 'true')
  await expect(stage).toHaveAttribute('data-ready-count', '242')

  const panel = page.locator('.right-panel')
  for (const structure of representativeStructures) {
    await page.getByRole('button', { name: `Select ${structure.name}` }).click()
    await expect(panel.locator('h2')).toHaveText(structure.name)
    await expect(panel).toContainText(`Anatomy ID: ${structure.anatomyId}`)
    await expect(panel).toContainText(structure.externalLabel)
    await expect(panel).toContainText(`BodyParts3D 3.0 mesh: ${structure.sourceId}`)
  }

  const canvas = page.locator('.viewport canvas')
  const bounds = await canvas.boundingBox()
  if (!bounds) throw new Error('The 3D canvas has no visible bounds')
  await canvas.click({ position: { x: bounds.width * 0.5, y: bounds.height * 0.26 } })
  await expect(panel.locator('h2')).toHaveText('Seventh cervical vertebra (C7)')
  await expect(stage).toHaveAttribute('data-selected-id', 'anatomy:skeleton:fma12525')
  await expect(panel).toContainText('FMA: FMA12525')

  await canvas.click({ position: { x: bounds.width * 0.5, y: bounds.height * 0.3 } })
  await expect(panel.locator('h2')).toHaveText('Body of sternum')
  await expect(stage).toHaveAttribute('data-selected-id', 'anatomy:skeleton:fma7487')
})

test('selection, highlighting, camera controls, and viewport toggles respond to input', async ({ page }) => {
  test.setTimeout(90000)
  await page.goto('/')

  const canvas = page.locator('.viewport canvas')
  const stage = page.locator('.model-stage')
  await expect(stage).toHaveAttribute('data-model-ready', 'true')
  await canvas.scrollIntoViewIfNeeded()
  const bounds = await canvas.boundingBox()
  if (!bounds) throw new Error('The 3D canvas has no visible bounds')
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height * 0.26)
  await expect.poll(() => page.evaluate(() => document.body.style.cursor)).toBe('pointer')
  await canvas.click({ position: { x: bounds.width / 2, y: bounds.height * 0.26 } })
  await expect(stage).toHaveAttribute('data-selected-id', 'anatomy:skeleton:fma12525')
  await expect(page.locator('.right-panel h2')).toHaveText('Seventh cervical vertebra (C7)')

  const beforeOrbit = await canvas.screenshot()
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2)
  await page.mouse.down()
  await page.mouse.move(bounds.x + bounds.width * 0.65, bounds.y + bounds.height * 0.46, { steps: 8 })
  await page.mouse.up()
  await page.waitForTimeout(300)
  const afterOrbit = await canvas.screenshot()
  expect(afterOrbit.equals(beforeOrbit)).toBe(false)

  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height * 0.48)
  await page.mouse.down({ button: 'right' })
  await page.mouse.move(bounds.x + bounds.width * 0.58, bounds.y + bounds.height * 0.42, { steps: 8 })
  await page.mouse.up({ button: 'right' })
  await page.waitForTimeout(300)
  const afterPan = await canvas.screenshot()
  expect(afterPan.equals(afterOrbit)).toBe(false)

  const wireframe = page.getByRole('button', { name: 'Toggle wireframe' })
  await wireframe.click()
  await expect(wireframe).toHaveClass(/active/)

  const labels = page.getByRole('button', { name: 'Toggle labels' })
  await labels.click()
  await expect(labels).not.toHaveClass(/active/)

  await page.getByRole('button', { name: 'Zoom in' }).click()
  await expect(stage).toHaveAttribute('data-camera-zoom', '0.92')
  await page.getByRole('button', { name: 'Zoom out' }).focus()
  await page.keyboard.press('Enter')
  await expect(stage).toHaveAttribute('data-camera-zoom', '1')
  await page.getByRole('button', { name: 'Zoom in' }).click()
  await page.getByRole('button', { name: 'Reset camera' }).click()
  await expect(stage).toHaveAttribute('data-camera-zoom', '1')
})

test('releases the viewport on navigation and reloads selectable anatomy on return', async ({ page }) => {
  const browserErrors: string[] = []
  page.on('console', message => {
    if (message.type() === 'error' || message.type() === 'warning') browserErrors.push(`${message.type()}: ${message.text()}`)
  })
  page.on('pageerror', error => browserErrors.push(error.message))

  await page.goto('/')
  const stage = page.locator('.model-stage')
  await expect(stage).toHaveAttribute('data-model-ready', 'true')
  await page.getByRole('button', { name: 'Progress', exact: true }).click()
  await expect(page.locator('.model-stage')).toHaveCount(0)
  await page.getByRole('button', { name: 'Explore', exact: true }).click()
  await expect(stage).toHaveAttribute('data-model-ready', 'true')

  await page.getByRole('button', { name: 'Select Sixth cervical vertebra (C6)' }).click()
  await expect(stage).toHaveAttribute('data-selected-id', 'anatomy:skeleton:fma12524')
  expect(browserErrors).toEqual([])
})

test('navigation adapts between desktop and mobile layouts', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('/')
  await expect(page.locator('.sidebar')).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Primary navigation' })).toBeVisible()
  const desktopCenter = await page.locator('.center-column').boundingBox()
  const desktopPanel = await page.locator('.right-panel').boundingBox()
  if (!desktopCenter || !desktopPanel) throw new Error('Desktop workspace columns have no visible bounds')
  expect(desktopPanel.x).toBeGreaterThan(desktopCenter.x)

  await page.setViewportSize({ width: 390, height: 844 })
  await expect(page.locator('.sidebar')).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Primary navigation' }).getByRole('button')).toHaveCount(3)
  await expect(page.getByRole('heading', { name: 'Explore anatomy' })).toBeVisible()
  const mobileCenter = await page.locator('.center-column').boundingBox()
  const mobilePanel = await page.locator('.right-panel').boundingBox()
  if (!mobileCenter || !mobilePanel) throw new Error('Mobile workspace sections have no visible bounds')
  expect(mobilePanel.y).toBeGreaterThan(mobileCenter.y)
  await expect(page.locator('.viewport canvas')).toBeVisible()
  await expect(page.locator('.model-stage')).toHaveAttribute('data-model-ready', 'true')
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
})

test('reports a missing GLB and retries the complete model load', async ({ page }) => {
  let shouldFail = true
  let retryRequests = 0
  await page.route('**/skeleton.glb', async route => {
    if (shouldFail) {
      await route.fulfill({ status: 404, contentType: 'text/plain', body: 'Not found' })
      return
    }
    retryRequests += 1
    await route.continue()
  })

  await page.goto('/')
  const stage = page.locator('.model-stage')
  await expect(stage).toHaveAttribute('data-ready-count', '0')
  const alert = page.getByRole('alert')
  await expect(alert).toContainText('Missing model asset')
  await expect(alert).toContainText('HTTP 404')

  shouldFail = false
  await page.getByRole('button', { name: 'Retry loading model' }).click()
  await expect(stage).toHaveAttribute('data-model-ready', 'true')
  await expect(stage).toHaveAttribute('data-ready-count', '242')
  expect(retryRequests).toBeGreaterThan(0)
})

test('reports invalid GLB data without treating it as a valid empty model', async ({ page }) => {
  await page.route('**/skeleton.glb', route => route.fulfill({
    status: 200,
    contentType: 'application/octet-stream',
    body: 'this is not valid GLB data',
  }))

  await page.goto('/')
  const stage = page.locator('.model-stage')
  await expect(stage).toHaveAttribute('data-ready-count', '0')
  const alert = page.getByRole('alert')
  await expect(alert).toContainText('Invalid model data')
  await expect(alert).toContainText('not a valid binary glTF')
  await expect(stage).toHaveAttribute('data-model-ready', 'false')
})

test('reports a GLB server failure distinctly from missing or invalid data', async ({ page }) => {
  await page.route('**/skeleton.glb', route => route.fulfill({
    status: 503,
    contentType: 'text/plain',
    body: 'Temporarily unavailable',
  }))

  await page.goto('/')
  const alert = page.getByRole('alert')
  await expect(alert).toContainText('Network error')
  await expect(alert).toContainText('HTTP 503')
})

test('explains unavailable WebGL 2 and keeps non-3D navigation available', async ({ page }) => {
  await page.addInitScript(`
    const getContext = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function(type, ...args) {
      if (type === 'webgl2') return null
      return getContext.call(this, type, ...args)
    }
  `)
  await page.goto('/')

  await expect(page.locator('.model-stage')).toHaveAttribute('data-webgl-state', 'unavailable')
  await expect(page.getByRole('alert')).toContainText('3D rendering is unavailable')
  await expect(page.getByRole('alert')).toContainText('did not provide a WebGL 2 context')
  await expect(page.getByRole('button', { name: 'Reload page' })).toBeVisible()
  await expect(page.locator('.viewport canvas')).toHaveCount(0)

  await page.getByRole('button', { name: 'Explore', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Explore anatomy' })).toBeVisible()
})
