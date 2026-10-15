export const PEOPLE = ['Carlos', 'Michelle']

export const COLUMNS = [
  { id: 'todo', label: 'Por hacer' },
  { id: 'doing', label: 'En progreso' },
  { id: 'done', label: 'Hecho' },
]

export const personClass = (name) => (name === 'Michelle' ? 'michelle' : name === 'Carlos' ? 'carlos' : 'nobody')

export const percent = (done, total) => (total ? Math.round((done / total) * 100) : 0)

export function progressOf(tasks) {
  const done = tasks.filter((t) => t.status === 'done').length
  return { done, total: tasks.length, pct: percent(done, tasks.length) }
}
