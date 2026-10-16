import { test as base, expect } from '@playwright/test'

export const test = base.extend({
  page: async ({ page }, provide) => {
    const errors = []
    const external = []
    page.on('console', (msg) => msg.type() === 'error' && errors.push(msg.text()))
    page.on('pageerror', (err) => errors.push(err.message))
    await page.route(/supabase\.co|api\.x\.ai|www\.googleapis\.com|itunes\.apple\.com/, (route) => {
      external.push(route.request().url())
      return route.abort()
    })
    await provide(page)
    expect(external, 'llamadas externas').toEqual([])
    expect(errors, 'errores en consola').toEqual([])
  },
})

export { expect }

export async function openDemo(page) {
  await page.goto('app/')
  await page.getByRole('button', { name: 'Ver demo' }).click()
  await expect(page.getByText('Demo de solo lectura')).toBeVisible()
}

export const tab = (page, name) => page.getByRole('navigation').getByRole('button', { name, exact: true }).first()
