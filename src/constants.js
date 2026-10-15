export const PEOPLE = ['Carlos', 'Michelle']

export const COLUMNS = [
  { id: 'todo', label: 'Por hacer' },
  { id: 'doing', label: 'En progreso' },
  { id: 'done', label: 'Hecho' },
]

export const personClass = (name) => (name === 'Michelle' ? 'michelle' : 'carlos')
