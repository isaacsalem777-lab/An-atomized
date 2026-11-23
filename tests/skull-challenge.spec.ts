import { expect, test } from '@playwright/test'

async function startChallenge(page: import('@playwright/test').Page) {
  await page.goto('/')
  await page.getByRole('button', { name: 'START' }).click()
  await page.getByRole('button', { name: /Skeleton/ }).click()
  await page.getByRole('button', { name: 'Challenge', exact: true }).click()
  await page.getByRole('button', { name: 'Start skull challenge' }).click()
  await expect(page.getByTestId('challenge-answer')).toBeEnabled()
  await expect(page.locator('.challenge-model-count')).toContainText('of 22 skull structures')
}

test('plays all three skull stages with source-backed paired targets and completion', async ({ page }) => {
  test.setTimeout(60000)
  const browserErrors: string[] = []
  page.on('console', message => {
    if (message.type() === 'error') browserErrors.push(message.text())
  })
  page.on('pageerror', error => browserErrors.push(error.message))
  await startChallenge(page)

  const input = page.getByTestId('challenge-answer')
  const targetLabel = page.locator('.challenge-answer-card .challenge-kicker')
  const stageHeading = page.locator('.challenge-progress-header h2')
  await expect(targetLabel).toHaveText('TARGET 01 / 14')
  await expect(stageHeading).toHaveText('Cranial bones')
  await expect(page.locator('.challenge-model-count')).toHaveAttribute('data-structure-count', '1')
  await expect(page.getByRole('region', { name: 'Next target preview' })).not.toContainText('Parietal')

  await input.fill('sternum')
  await input.press('Enter')
  await expect(page.getByText('Not quite. Try again.')).toBeVisible()
  await expect(targetLabel).toHaveText('TARGET 01 / 14')

  const answers = [
    'Frontal bone',
    'Parietal',
    'Temporal bone',
    'Occipital',
    'Ethmoid',
    'Sphenoid',
    'Zygomatic',
    'Maxilla bone',
    'Mandible',
    'Nasal bone',
    'Lacrimal',
    'Palatine bone',
    'Vomer',
    'Inferior nasal concha',
  ]

  for (let index = 0; index < answers.length; index += 1) {
    if (index === 6) await expect(stageHeading).toHaveText('Major facial bones')
    if (index === 9) await expect(stageHeading).toHaveText('Smaller facial bones')
    if (index === 1 || index === 2 || index === 6 || index === 7 || index === 9 || index === 10 || index === 11 || index === 13) {
      await expect(page.locator('.challenge-model-count')).toHaveAttribute('data-structure-count', '2')
      await expect(page.locator('.challenge-answer-instruction')).toContainText('Both left and right bones are highlighted')
    }

    await input.fill(answers[index])
    await input.press('Enter')
    if (index < answers.length - 1) {
      await expect(targetLabel).toHaveText(`TARGET ${String(index + 2).padStart(2, '0')} / 14`)
    }
  }

  await expect(page.getByText('All 22 cranial and facial structures revealed')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Skull Challenge Complete' })).toBeVisible()
  await expect(page.locator('.challenge-complete-summary')).toContainText('14 / 14')
  expect(browserErrors).toEqual([])
  await page.getByRole('button', { name: 'Play again' }).click()
  await expect(targetLabel).toHaveText('TARGET 01 / 14')
  await expect(input).toBeEnabled()
})

test('on-screen keys enter one character and physical keys show transient illumination', async ({ page }) => {
  await startChallenge(page)
  const input = page.getByTestId('challenge-answer')

  await page.getByRole('button', { name: 'Letter F' }).click()
  await expect(input).toHaveValue('f')
  await input.press('Backspace')
  await expect(input).toHaveValue('')

  await input.press('f')
  await expect(page.locator('[data-key="F"]')).toHaveAttribute('data-pressed', 'true')
  await expect(input).toHaveValue('f')
})

test('challenge stays within mobile width and retains usable answer controls', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await startChallenge(page)
  await expect(page.getByTestId('challenge-main-canvas')).toBeVisible()
  await expect(page.getByTestId('challenge-preview-canvas')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Letter A' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
})
