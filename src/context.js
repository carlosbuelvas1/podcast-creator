import { createContext, useContext, useMemo } from 'react'

export const DataContext = createContext(null)

export const useStore = () => useContext(DataContext)

const scope = (rows, id) => (id ? rows.filter((row) => row.project_id === id) : [])

export function useProject() {
  const { project, phases, tasks, items, briefs, modules, guests, ideas, calendar, messages, favorites, references } = useStore()
  const id = project?.id
  return useMemo(
    () => {
      const mine = scope(briefs, id)
      return {
        project,
        phases: scope(phases, id),
        tasks: scope(tasks, id),
        items: scope(items, id),
        briefs: mine,
        brief: mine[0]?.data ?? {},
        modules: scope(modules, id),
        guests: scope(guests, id),
        ideas: scope(ideas, id),
        calendar: scope(calendar, id),
        messages: scope(messages, id),
        favorites: scope(favorites, id),
        references: scope(references, id),
      }
    },
    [project, id, phases, tasks, items, briefs, modules, guests, ideas, calendar, messages, favorites, references],
  )
}
