import { createContext, useContext, useMemo } from 'react'
import { t, useLang } from './i18n'

export const DataContext = createContext(null)

export const useStore = () => useContext(DataContext)

export const NavContext = createContext({ go: () => {}, ask: () => {} })

export const useNav = () => useContext(NavContext)

const scope = (rows, id) => (id ? rows.filter((row) => row.project_id === id) : [])

const localize = (rows, fields, lang) => (lang === 'es' ? rows : rows.map((row) => ({ ...row, ...Object.fromEntries(fields.filter((f) => row[f]).map((f) => [f, t(row[f])])) })))

export function useProject() {
  const { project, phases, tasks, items, briefs, modules, guests, ideas, calendar, messages, favorites, references } = useStore()
  const id = project?.id
  const lang = useLang()
  return useMemo(
    () => {
      const mine = scope(briefs, id)
      return {
        project,
        phases: localize(scope(phases, id), ['title', 'summary'], lang),
        tasks: localize(scope(tasks, id), ['title', 'explanation'], lang),
        items: localize(scope(items, id), ['text'], lang),
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
    [project, id, lang, phases, tasks, items, briefs, modules, guests, ideas, calendar, messages, favorites, references],
  )
}
