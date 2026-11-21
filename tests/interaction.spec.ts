import { expect, test } from '@playwright/test'
import { structures } from '../src/data/anatomy'

const anatomy = structures.map(({ id, name }) => ({ id, name }))

async function openAtlas(page: import('@playwright/test').Page) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Explore', exact: true }).click()
  await expect(page.locator('.model-stage')).toHaveAttribute('data-model-ready', 'true')
}

test('hides and restores every structure and show-all restores the whole set', async ({ page }) => {
  await openAtlas(page)
  const stage = page.locator('.model-stage')

  for (const structure of anatomy) {
    await page.getByRole('button', { name: `Hide ${structure.name}` }).click()
    await expect(stage).toHaveAttribute('data-visible-count', '5')
    await page.getByRole('button', { name: `Show ${structure.name}` }).click()
    await expect(stage).toHaveAttribute('data-visible-count', '6')
  }

  for (const structure of anatomy) {
    await page.getByRole('button', { name: `Hide ${structure.name}` }).click()
  }
  await expect(stage).toHaveAttribute('data-visible-count', '0')
  await expect(stage).toContainText('All matching structures are hidden.')
  await page.getByRole('button', { name: 'Show all structures' }).click()
  await expect(stage).toHaveAttribute('data-visible-count', '6')
})

test('isolates every structure and restores the previous visibility configuration', async ({ page }) => {
  await openAtlas(page)
  const stage = page.locator('.model-stage')
  await page.getByRole('button', { name: 'Hide Frontal bone' }).click()
  await page.getByRole('button', { name: 'Hide Mandible' }).click()
  await expect(stage).toHaveAttribute('data-visible-count', '4')

  for (const structure of anatomy) {
    await page.getByRole('button', { name: `Select ${structure.name}` }).click()
    await page.getByRole('button', { name: `Isolate ${structure.name}` }).click()
    await expect(stage).toHaveAttribute('data-isolation-id', structure.id)
    await expect(stage).toHaveAttribute('data-visible-count', '1')
    await page.getByRole('button', { name: 'Exit isolation' }).click()
    await expect(stage).toHaveAttribute('data-isolation-id', '')
    await expect(stage).toHaveAttribute('data-visible-count', '4')
  }

  await expect(page.getByRole('button', { name: 'Select Frontal bone' }).locator('..')).toContainText('Hidden')
  await expect(page.getByRole('button', { name: 'Select Mandible' }).locator('..')).toContainText('Hidden')
  await page.getByRole('button', { name: 'Show all structures' }).click()
  await expect(stage).toHaveAttribute('data-visible-count', '6')
})

test('synchronizes panel selection and filters using the available anatomy catalog', async ({ page }) => {
  await openAtlas(page)
  const stage = page.locator('.model-stage')
  const canvas = page.locator('.viewport canvas')

  await page.getByRole('button', { name: 'Select Left maxilla' }).click()
  await expect(stage).toHaveAttribute('data-selected-id', 'anatomy:bone:maxilla:left')
  const bounds = await canvas.boundingBox()
  if (!bounds) throw new Error('The 3D canvas has no visible bounds')
  await canvas.click({ position: { x: bounds.width * 0.5, y: bounds.height * 0.8 } })
  await expect(page.locator('.right-panel h2')).toHaveText('Mandible')
  await expect(stage).toHaveAttribute('data-selected-id', 'anatomy:bone:mandible')

  await page.getByLabel('System filter').selectOption('Skeletal')
  await expect(stage).toHaveAttribute('data-visible-count', '6')
  await expect(page.getByLabel('Region filter').locator('option')).toHaveText(['All regions', 'Cranium'])
  await expect(stage).toHaveAttribute('data-visible-count', '6')
  await page.getByLabel('Region filter').selectOption('Cranium')
  await expect(stage).toHaveAttribute('data-visible-count', '6')

  await page.getByRole('button', { name: 'Select Left zygomatic bone' }).click()
  await expect(stage).toHaveAttribute('data-selected-id', 'anatomy:bone:zygomatic:left')
  await page.locator('.structure-control-section').getByRole('button', { name: 'Hide Left zygomatic bone' }).click()
  await expect(stage).toHaveAttribute('data-visible-count', '5')
  await page.locator('.structure-control-section').getByRole('button', { name: 'Show Left zygomatic bone' }).click()
  await expect(stage).toHaveAttribute('data-visible-count', '6')
})

test('adjusts transparency while retaining selection on a transparent 3D structure', async ({ page }) => {
  await openAtlas(page)
  const stage = page.locator('.model-stage')
  const canvas = page.locator('.viewport canvas')

  await page.getByRole('button', { name: 'Select Mandible' }).click()
  const transparency = page.getByRole('slider', { name: 'Transparency for Mandible' })
  await transparency.focus()
  await transparency.press('Home')
  await expect(transparency).toHaveValue('15')
  await expect(page.locator('.right-panel')).toContainText('Transparency 15%')

  await page.getByRole('button', { name: 'Select Frontal bone' }).click()
  const bounds = await canvas.boundingBox()
  if (!bounds) throw new Error('The 3D canvas has no visible bounds')
  await canvas.click({ position: { x: bounds.width * 0.5, y: bounds.height * 0.8 } })
  await expect(page.locator('.right-panel h2')).toHaveText('Mandible')
  await expect(stage).toHaveAttribute('data-selected-id', 'anatomy:bone:mandible')
  await expect(page.getByRole('slider', { name: 'Transparency for Mandible' })).toHaveValue('15')
})

test('keeps reference controls usable and the layout within mobile width', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await expect(page.getByRole('navigation', { name: 'Primary navigation' })).toBeVisible()
  await page.getByRole('button', { name: 'Explore', exact: true }).click()
  await expect(page.locator('.model-stage')).toHaveAttribute('data-model-ready', 'true')
  await page.getByRole('button', { name: 'Select Left zygomatic bone' }).click()
  await page.locator('.structure-index-section').getByRole('button', { name: 'Hide Left zygomatic bone' }).click()
  await expect(page.locator('.model-stage')).toHaveAttribute('data-visible-count', '5')
  await page.locator('.structure-index-section').getByRole('button', { name: 'Show Left zygomatic bone' }).click()
  await expect(page.locator('.model-stage')).toHaveAttribute('data-visible-count', '6')
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
})
