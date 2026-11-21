import { expect, test } from '@playwright/test'

const structures = [
  { name: 'Frontal bone', anatomyId: 'anatomy:bone:frontal', fmaId: 'FMA52734', meshId: 'FJ3200', x: 0.5, y: 0.34 },
  { name: 'Left zygomatic bone', anatomyId: 'anatomy:bone:zygomatic:left', fmaId: 'FMA52893', meshId: 'FJ3287', x: 0.58, y: 0.54 },
  { name: 'Right zygomatic bone', anatomyId: 'anatomy:bone:zygomatic:right', fmaId: 'FMA52892', meshId: 'FJ3392', x: 0.42, y: 0.54 },
  { name: 'Left maxilla', anatomyId: 'anatomy:bone:maxilla:left', fmaId: 'FMA53650', meshId: 'FJ3269', x: 0.55, y: 0.65 },
  { name: 'Right maxilla', anatomyId: 'anatomy:bone:maxilla:right', fmaId: 'FMA53649', meshId: 'FJ3375', x: 0.45, y: 0.65 },
  { name: 'Mandible', anatomyId: 'anatomy:bone:mandible', fmaId: 'FMA52748', meshId: 'FJ3289', x: 0.5, y: 0.8 },
]

test('loads and independently selects all six source bones', async ({ page }) => {
  await page.addInitScript(`
    const nativeFetch = window.fetch.bind(window)
    window.fetch = async (input, init) => {
      const url = typeof input === 'string' ? input : input instanceof Request ? input.url : input.href
      if (url.endsWith('/FJ3200.obj')) await new Promise(resolve => setTimeout(resolve, 500))
      return nativeFetch(input, init)
    }
  `)
  await page.goto('/')
  await expect(page).toHaveTitle('ANATOMY — Anatomy Explorer')
  await expect(page.getByRole('heading', { name: 'Explore anatomy' })).toBeVisible()
  await expect(page.locator('.viewport-footer [role="status"]')).toContainText('Loading anatomical meshes')

  const canvas = page.locator('.viewport canvas')
  await expect(canvas).toBeVisible()
  await expect(page.locator('.model-stage')).toHaveAttribute('data-model-ready', 'true')
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
    await expect(panel).toContainText(`Anatomy ID: ${structure.anatomyId}`)
    await expect(panel).toContainText(`FMA: ${structure.fmaId}`)
    await expect(panel).toContainText(`BodyParts3D mesh: ${structure.meshId}`)
  }

  const last = structures[structures.length - 1]
  await canvas.click({ position: { x: bounds.width * last.x, y: bounds.height * last.y } })
  await expect(page.locator('.right-panel h2')).toHaveText('Select a structure')
  await expect(page.locator('.right-panel')).toContainText('Select a bone in the model or choose one from the structure index.')
})

test('selection, camera controls, and viewport toggles respond to input', async ({ page }) => {
  await page.goto('/')

  const canvas = page.locator('.viewport canvas')
  await expect(page.locator('.model-stage')).toHaveAttribute('data-model-ready', 'true')
  await canvas.scrollIntoViewIfNeeded()
  const canvasBounds = await canvas.boundingBox()
  if (!canvasBounds) {
    throw new Error('The 3D canvas has no visible bounds')
  }
  await page.mouse.move(canvasBounds.x + canvasBounds.width / 2, canvasBounds.y + canvasBounds.height * 0.8)
  await expect.poll(() => page.evaluate(() => document.body.style.cursor)).toBe('pointer')
  await canvas.click({ position: { x: canvasBounds.width / 2, y: canvasBounds.height * 0.8 } })
  await expect(page.locator('.model-stage')).toHaveAttribute('data-selected-id', 'anatomy:bone:mandible')
  await expect(page.locator('.right-panel h2')).toHaveText('Mandible')
  await canvas.click({ position: { x: canvasBounds.width / 2, y: canvasBounds.height * 0.8 } })
  await expect(page.locator('.model-stage')).toHaveAttribute('data-selected-id', '')
  await expect(page.locator('.right-panel h2')).toHaveText('Select a structure')

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
  await expect(page.locator('.model-stage')).toHaveAttribute('data-camera-distance', '4.35')
  await page.locator('.view-controls button[title="Zoom out"]').click()
  await expect(page.locator('.model-stage')).toHaveAttribute('data-camera-distance', '4.7')
  await page.locator('.view-controls button[title="Zoom in"]').click()
  await page.locator('.view-controls button[title="Reset camera"]').click()
  await expect(page.locator('.model-stage')).toHaveAttribute('data-camera-distance', '4.7')
  await page.locator('.view-controls button[title="Zoom in"]').click()
  await expect(page.locator('.model-stage')).toHaveAttribute('data-camera-distance', '4.35')
  await page.getByRole('button', { name: 'Reset camera' }).click()
  await expect(page.locator('.model-stage')).toHaveAttribute('data-camera-distance', '4.7')
})

test('navigation adapts between desktop and mobile layouts', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('/')
  await expect(page.locator('.sidebar')).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Primary navigation' })).toBeVisible()
  const desktopCenter = await page.locator('.center-column').boundingBox()
  const desktopPanel = await page.locator('.right-panel').boundingBox()
  if (!desktopCenter || !desktopPanel) {
    throw new Error('Desktop workspace columns have no visible bounds')
  }
  expect(desktopPanel.x).toBeGreaterThan(desktopCenter.x)

  await page.setViewportSize({ width: 390, height: 844 })
  await expect(page.locator('.sidebar')).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Primary navigation' }).getByRole('button')).toHaveCount(3)
  await page.getByRole('button', { name: 'Explore', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Explore anatomy' })).toBeVisible()
  const mobileCenter = await page.locator('.center-column').boundingBox()
  const mobilePanel = await page.locator('.right-panel').boundingBox()
  if (!mobileCenter || !mobilePanel) {
    throw new Error('Mobile workspace sections have no visible bounds')
  }
  expect(mobilePanel.y).toBeGreaterThan(mobileCenter.y)
  await expect(page.locator('.viewport canvas')).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
})

test('reports a missing OBJ, keeps other bones interactive, and retries the failed mesh', async ({ page }) => {
  let shouldFail = true
  let retryRequests = 0
  await page.route('**/FJ3287.obj', async route => {
    if (shouldFail) {
      await route.fulfill({ status: 404, contentType: 'text/plain', body: 'Not found' })
      return
    }
    retryRequests += 1
    await route.continue()
  })

  await page.goto('/')
  const stage = page.locator('.model-stage')
  await expect(stage).toHaveAttribute('data-ready-count', '5')
  const alert = page.getByRole('alert')
  await expect(alert).toContainText('Left zygomatic bone')
  await expect(alert).toContainText('Missing asset')
  await expect(alert).toContainText('Loaded bones remain interactive')

  const canvas = page.locator('.viewport canvas')
  const bounds = await canvas.boundingBox()
  if (!bounds) throw new Error('The 3D canvas has no visible bounds')
  await canvas.click({ position: { x: bounds.width / 2, y: bounds.height * 0.8 } })
  await expect(page.locator('.model-stage')).toHaveAttribute('data-selected-id', 'anatomy:bone:mandible')

  shouldFail = false
  await page.getByRole('button', { name: 'Retry failed meshes' }).click()
  await expect(stage).toHaveAttribute('data-ready-count', '6')
  await expect(page.getByRole('alert')).toHaveCount(0)
  expect(retryRequests).toBeGreaterThan(0)
})

test('reports invalid OBJ data without losing the remaining bones', async ({ page }) => {
  await page.route('**/FJ3392.obj', route => route.fulfill({
    status: 200,
    contentType: 'text/plain',
    body: 'this is not valid OBJ data',
  }))

  await page.goto('/')
  const stage = page.locator('.model-stage')
  await expect(stage).toHaveAttribute('data-ready-count', '5')
  const alert = page.getByRole('alert')
  await expect(alert).toContainText('Right zygomatic bone')
  await expect(alert).toContainText('Invalid model data')
  await expect(alert).toContainText('No triangle meshes were found')

  const canvas = page.locator('.viewport canvas')
  const bounds = await canvas.boundingBox()
  if (!bounds) throw new Error('The 3D canvas has no visible bounds')
  await canvas.click({ position: { x: bounds.width / 2, y: bounds.height * 0.8 } })
  await expect(page.locator('.model-stage')).toHaveAttribute('data-selected-id', 'anatomy:bone:mandible')
})

test('reports an OBJ server failure distinctly from missing or invalid data', async ({ page }) => {
  await page.route('**/FJ3375.obj', route => route.fulfill({
    status: 503,
    contentType: 'text/plain',
    body: 'Temporarily unavailable',
  }))

  await page.goto('/')
  await expect(page.locator('.model-stage')).toHaveAttribute('data-ready-count', '5')
  const alert = page.getByRole('alert')
  await expect(alert).toContainText('Right maxilla')
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
