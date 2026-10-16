import { getLang, t } from './i18n'
export function parseDate(value) {
  if (!value) return null
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function today() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

export function daysUntil(value) {
  const date = parseDate(value)
  if (!date) return null
  return Math.round((date - today()) / 86400000)
}

export function shortDate(value) {
  const date = parseDate(value)
  if (!date) return ''
  return date.toLocaleDateString(getLang(), { day: 'numeric', month: 'short' }).replace('.', '')
}

export function longDate(value) {
  const date = parseDate(value)
  if (!date) return ''
  return date.toLocaleDateString(getLang(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

export function dueLabel(value) {
  const days = daysUntil(value)
  if (days === null) return ''
  if (days === 0) return t('Hoy')
  if (days === 1) return t('Mañana')
  if (days === -1) return t('Ayer')
  return shortDate(value)
}

export function byDueDate(a, b) {
  if (a.due_date && b.due_date && a.due_date !== b.due_date) return a.due_date < b.due_date ? -1 : 1
  if (a.due_date && !b.due_date) return -1
  if (!a.due_date && b.due_date) return 1
  return a.created_at < b.created_at ? -1 : 1
}
