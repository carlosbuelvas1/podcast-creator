import { expect, openDemo, tab, test } from './fixtures'

test('la app carga en la pantalla de entrada', async ({ page }) => {
  await page.goto('app/')
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
  await page.goto('app/')
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
    await page.goto('app/')
    await page.getByRole('button', { name: lang }).click()
    await page.locator('.login .btn.ghost').click()
    for (const i of [1, 2, 3, 4, 0]) {
      await page.locator('.tabbar button, .tabs-top button').filter({ visible: true }).nth(i).click()
      await expect(page.locator('main.page h1').first()).toBeVisible()
    }
  })
}

test('los pasos del curso salen en inglés', async ({ page }) => {
  await page.goto('app/')
  await page.getByRole('button', { name: 'English' }).click()
  await page.getByRole('button', { name: 'View demo' }).click()
  await tab(page, 'Phases').click()
  await page.getByRole('button', { name: /Concept and identity/ }).click()
  await expect(page.getByText('Define who you are as a creator')).toBeVisible()
  await page.getByText('Choose the show format').click()
  await expect(page.getByText('Audio only or audio + video')).toBeVisible()
})

test('las fases finales también salen en inglés', async ({ page }) => {
  await page.goto('app/')
  await page.getByRole('button', { name: 'English' }).click()
  await page.getByRole('button', { name: 'View demo' }).click()
  await tab(page, 'Phases').click()
  await page.getByRole('button', { name: /Launch, growth and monetization/ }).click()
  await expect(page.getByText('Prepare your media kit')).toBeVisible()
})

test('los módulos salen en inglés', async ({ page }) => {
  await page.goto('app/')
  await page.getByRole('button', { name: 'English' }).click()
  await page.getByRole('button', { name: 'View demo' }).click()
  await tab(page, 'Modules').click()
  await page.getByRole('button', { name: /Legal/ }).first().click()
  await page.getByRole('button', { name: /Create the LLC on Sunbiz/ }).click()
  await expect(page.getByText('Choose a registered agent')).toBeVisible()
})

test('los módulos finales también salen en inglés', async ({ page }) => {
  await page.goto('app/')
  await page.getByRole('button', { name: 'English' }).click()
  await page.getByRole('button', { name: 'View demo' }).click()
  await tab(page, 'Modules').click()
  await expect(page.getByText('Distribution and growth')).toBeVisible()
  await page.getByRole('button', { name: /Content lab/ }).click()
  await expect(page.getByText('Thumbnails with AI', { exact: false })).toBeVisible()
})

test('la demo y su IA salen en inglés', async ({ page }) => {
  await page.goto('app/')
  await page.getByRole('button', { name: 'English' }).click()
  await page.getByRole('button', { name: 'View demo' }).click()
  await tab(page, 'AI').click()
  await page.getByRole('button', { name: 'Give me 10 episode ideas' }).click()
  await expect(page.getByText(/Here are two ideas/)).toBeVisible()
  await tab(page, 'Modules').click()
  await page.getByRole('button', { name: /Guests/ }).first().click()
  await page.getByRole('button', { name: 'Open guest list' }).click()
  await expect(page.getByText(/Mental health for creators/)).toBeVisible()
})

test('la portada carga y Probar la demo abre la demo', async ({ page }) => {
  await page.goto('./')
  await expect(page.getByRole('heading', { level: 1, name: 'Podcast Creator' })).toBeVisible()
  await page.getByRole('link', { name: 'Probar la demo' }).click()
  await expect(page).toHaveURL(/\/app\//)
  await expect(page.getByText('Demo de solo lectura')).toBeVisible()
})

test('los enlaces antiguos con # abren la app', async ({ page }) => {
  await page.goto('./#modulos')
  await expect(page).toHaveURL(/\/app\/#modulos/)
  await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible()
})

test('la portada cambia a inglés', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('button', { name: 'English' }).click()
  await expect(page.getByRole('link', { name: 'Try the demo' })).toBeVisible()
})

test('el laboratorio arma la estructura y el guion en la demo', async ({ page }) => {
  await openDemo(page)
  await tab(page, 'Módulos').click()
  await page.getByRole('button', { name: /Laboratorio de contenido/ }).click()
  await page.getByRole('button', { name: 'Abrir laboratorio' }).click()
  await page.getByRole('button', { name: 'Guion' }).click()
  await expect(page.getByText('Estructura y guion')).toBeVisible()
  await expect(page.getByText('Lo que haríamos distinto').first()).toBeVisible()
})

test('el laboratorio arma la hoja del día de grabación en la demo', async ({ page }) => {
  await openDemo(page)
  await tab(page, 'Módulos').click()
  await page.getByRole('button', { name: /Laboratorio de contenido/ }).click()
  await page.getByRole('button', { name: 'Abrir laboratorio' }).click()
  await page.getByRole('button', { name: 'Día de grabación' }).click()
  await expect(page.getByText('Hoja del día de grabación')).toBeVisible()
  await expect(page.getByText('Prueba de sonido de 5 minutos')).toBeVisible()
})

test('la ficha de una página para un invitado en la demo', async ({ page }) => {
  await openDemo(page)
  await tab(page, 'Módulos').click()
  await page.getByRole('button', { name: /Invitados/ }).first().click()
  await page.getByRole('button', { name: 'Abrir lista de invitados' }).click()
  await page.getByRole('button', { name: /Laura Gómez/ }).click()
  await page.getByRole('button', { name: 'Ficha de una página' }).click()
  await page.getByRole('button', { name: 'Enviar' }).click()
  await expect(page.getByText(/Ficha para Laura Gómez/)).toBeVisible()
})

test('los borradores para invitar a un invitado en la demo', async ({ page }) => {
  await openDemo(page)
  await tab(page, 'Módulos').click()
  await page.getByRole('button', { name: /Invitados/ }).first().click()
  await page.getByRole('button', { name: 'Abrir lista de invitados' }).click()
  await page.getByRole('button', { name: /Laura Gómez/ }).click()
  await page.getByRole('button', { name: 'Mensajes para invitar' }).click()
  await page.getByRole('button', { name: 'Enviar' }).click()
  await expect(page.getByText(/Formal: «Hola Laura/)).toBeVisible()
})
