import { expect, openDemo, tab, test } from './fixtures'

test('la app carga en la pantalla de entrada', async ({ page }) => {
  await page.goto('./')
  await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Ver demo' })).toBeVisible()
})

test('Ver demo abre el proyecto de ejemplo', async ({ page }) => {
  await openDemo(page)
  await expect(page.getByText('No Hay Break').first()).toBeVisible()
  await expect(page.getByText('Siguiente paso recomendado')).toBeVisible()
})

test('Módulos muestra la lista de módulos', async ({ page }) => {
  await openDemo(page)
  await tab(page, 'Módulos').click()
  await expect(page.getByRole('heading', { level: 1, name: 'Módulos' })).toBeVisible()
})

test('Salir de la demo vuelve a la entrada', async ({ page }) => {
  await openDemo(page)
  await page.getByRole('button', { name: 'Salir de la demo' }).click()
  await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible()
})
