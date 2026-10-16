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

test('la pestaña Módulos siempre vuelve a la lista', async ({ page }) => {
  await openDemo(page)
  await tab(page, 'Módulos').click()
  await page.getByRole('button', { name: /Legal/ }).first().click()
  await expect(page.getByText('Módulo 1', { exact: true })).toBeVisible()
  await tab(page, 'Módulos').click()
  await expect(page.getByRole('heading', { level: 1, name: 'Módulos' })).toBeVisible()
})

test('la IA de la demo responde con un ejemplo', async ({ page }) => {
  await openDemo(page)
  await tab(page, 'IA').click()
  await expect(page.getByText('IA activada en la demo')).toBeVisible()
  await page.getByRole('button', { name: 'Dame 10 ideas de episodios' }).click()
  await expect(page.getByText(/Aquí van dos ideas/)).toBeVisible()
})

test('cambiar a inglés muestra la app en inglés', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('button', { name: 'English' }).click()
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible()
  await page.getByRole('button', { name: 'View demo' }).click()
  await expect(page.getByText('Read-only demo')).toBeVisible()
  await expect(page.getByText('Recommended next step')).toBeVisible()
  await expect(tab(page, 'Modules')).toBeVisible()
})

test('Salir de la demo vuelve a la entrada', async ({ page }) => {
  await openDemo(page)
  await page.getByRole('button', { name: 'Salir de la demo' }).click()
  await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible()
})

for (const lang of ['Español', 'English']) {
  test(`todas las pestañas de la demo abren sin errores (${lang})`, async ({ page }) => {
    await page.goto('./')
    await page.getByRole('button', { name: lang }).click()
    await page.locator('.login .btn.ghost').click()
    for (const i of [1, 2, 3, 4, 0]) {
      await page.locator('.tabbar button, .tabs-top button').filter({ visible: true }).nth(i).click()
      await expect(page.locator('main.page h1').first()).toBeVisible()
    }
  })
}

test('los pasos del curso salen en inglés', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('button', { name: 'English' }).click()
  await page.getByRole('button', { name: 'View demo' }).click()
  await tab(page, 'Phases').click()
  await page.getByRole('button', { name: /Concept and identity/ }).click()
  await expect(page.getByText('Define who you are as a creator')).toBeVisible()
  await page.getByText('Choose the show format').click()
  await expect(page.getByText('Audio only or audio + video')).toBeVisible()
})

test('las fases finales también salen en inglés', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('button', { name: 'English' }).click()
  await page.getByRole('button', { name: 'View demo' }).click()
  await tab(page, 'Phases').click()
  await page.getByRole('button', { name: /Launch, growth and monetization/ }).click()
  await expect(page.getByText('Prepare your media kit')).toBeVisible()
})
