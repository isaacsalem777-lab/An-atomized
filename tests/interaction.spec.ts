import { expect, test } from '@playwright/test'
import { structures } from '../src/data/anatomy'

function structureFromSourceId(sourceId: string) {
  const structure = structures.find(({ meshAssociations }) => meshAssociations.some(({ sourceMeshId }) => sourceMeshId === sourceId))
  if (!structure) throw new Error(`The ${sourceId} test structure is missing`)
  return { id: structure.id, name: structure.name }
}

const anatomy = [
  structureFromSourceId('frontal-bone'),
  structureFromSourceId('mandible'),
  structureFromSourceId('left-femur'),
]

async function openAtlas(page: import('@playwright/test').Page) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Explore', exact: true }).click()
  await expect(page.locator('.model-stage')).toHaveAttribute('data-model-ready', 'true')
}

test('hides and restores individual structures and show-all restores the whole set', async ({ page }) => {
  await openAtlas(page)
  const stage = page.locator('.model-stage')

  for (const structure of anatomy) {
    await page.getByRole('button', { name: `Hide ${structure.name}` }).click()
    await expect(stage).toHaveAttribute('data-visible-count', '241')
    await page.getByRole('button', { name: `Show ${structure.name}` }).click()
    await expect(stage).toHaveAttribute('data-visible-count', '242')
  }

  for (const structure of anatomy) {
    await page.getByRole('button', { name: `Hide ${structure.name}` }).click()
  }
  await expect(stage).toHaveAttribute('data-visible-count', '239')
  await expect(stage).toContainText('3 structures hidden')
  await page.getByRole('button', { name: 'Show all structures' }).click()
  await expect(stage).toHaveAttribute('data-visible-count', '242')
})

test('isolates representative structures and restores the previous visibility configuration', async ({ page }) => {
  await openAtlas(page)
  const stage = page.locator('.model-stage')
  await page.getByRole('button', { name: 'Hide Frontal bone' }).click()
  await page.getByRole('button', { name: 'Hide Mandible' }).click()
  await expect(stage).toHaveAttribute('data-visible-count', '240')

  for (const structure of anatomy) {
    await page.getByRole('button', { name: `Select ${structure.name}` }).click()
    await page.getByRole('button', { name: `Isolate ${structure.name}` }).click()
    await expect(stage).toHaveAttribute('data-isolation-id', structure.id)
    await expect(stage).toHaveAttribute('data-visible-count', '1')
    await page.getByRole('button', { name: 'Exit isolation' }).click()
    await expect(stage).toHaveAttribute('data-isolation-id', '')
    await expect(stage).toHaveAttribute('data-visible-count', '240')
  }

  await expect(page.getByRole('button', { name: 'Select Frontal bone' }).locator('..')).toContainText('Hidden')
  await expect(page.getByRole('button', { name: 'Select Mandible' }).locator('..')).toContainText('Hidden')
  await page.getByRole('button', { name: 'Show all structures' }).click()
  await expect(stage).toHaveAttribute('data-visible-count', '242')
})

test('synchronizes panel selection and filters using the available anatomy catalog', async ({ page }) => {
  await openAtlas(page)
  const stage = page.locator('.model-stage')
  const canvas = page.locator('.viewport canvas')

  await page.getByRole('button', { name: 'Select Left maxilla' }).click()
  await expect(stage).toHaveAttribute('data-selected-id', 'anatomy:bone:maxilla:left')
  const bounds = await canvas.boundingBox()
  if (!bounds) throw new Error('The 3D canvas has no visible bounds')
  await canvas.click({ position: { x: bounds.width * 0.5, y: bounds.height * 0.3 } })
  await expect(page.locator('.right-panel h2')).toHaveText('Body of sternum')
  await expect(stage).toHaveAttribute('data-selected-id', 'anatomy:skeleton:fma7487')

  await page.getByLabel('System filter').selectOption('Skeletal')
  await expect(stage).toHaveAttribute('data-visible-count', '242')
  await expect(page.getByLabel('Region filter').locator('option')).toHaveText([
    'All regions', 'Skull', 'Spine', 'Thorax', 'Pelvis', 'Upper limbs', 'Lower limbs',
  ])
  await page.getByLabel('Region filter').selectOption('Skull')
  await expect(stage).toHaveAttribute('data-visible-count', '23')

  await page.getByRole('button', { name: 'Select Left zygomatic bone' }).click()
  await expect(stage).toHaveAttribute('data-selected-id', 'anatomy:bone:zygomatic:left')
  await page.locator('.structure-control-section').getByRole('button', { name: 'Hide Left zygomatic bone' }).click()
  await expect(stage).toHaveAttribute('data-visible-count', '22')
  await page.locator('.structure-control-section').getByRole('button', { name: 'Show Left zygomatic bone' }).click()
  await expect(stage).toHaveAttribute('data-visible-count', '23')
})

test('adjusts opacity while retaining selection on a translucent 3D structure', async ({ page }) => {
  await openAtlas(page)
  const stage = page.locator('.model-stage')

  await page.getByRole('button', { name: 'Select Mandible' }).click()
  const opacity = page.getByRole('slider', { name: 'Opacity for Mandible' })
  await opacity.focus()
  await opacity.press('Home')
  await expect(opacity).toHaveValue('15')
  await expect(page.locator('.right-panel')).toContainText('Opacity 15%')

  await page.getByRole('button', { name: 'Select Frontal bone' }).click()
  await page.getByRole('button', { name: 'Select Mandible' }).click()
  await expect(page.locator('.right-panel h2')).toHaveText('Mandible')
  await expect(stage).toHaveAttribute('data-selected-id', 'anatomy:bone:mandible')
  await expect(page.getByRole('slider', { name: 'Opacity for Mandible' })).toHaveValue('15')
})

test('keeps reference controls usable and the layout within mobile width', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await expect(page.getByRole('navigation', { name: 'Primary navigation' })).toBeVisible()
  await page.getByRole('button', { name: 'Explore', exact: true }).click()
  await expect(page.locator('.model-stage')).toHaveAttribute('data-model-ready', 'true')
  await page.getByRole('button', { name: 'Select Left zygomatic bone' }).click()
  await page.locator('.structure-index-section').getByRole('button', { name: 'Hide Left zygomatic bone' }).click()
  await expect(page.locator('.model-stage')).toHaveAttribute('data-visible-count', '241')
  await page.locator('.structure-index-section').getByRole('button', { name: 'Show Left zygomatic bone' }).click()
  await expect(page.locator('.model-stage')).toHaveAttribute('data-visible-count', '242')
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
})
