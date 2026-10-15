import { createContext, useContext, useMemo } from 'react'

export const DataContext = createContext(null)

export const useStore = () => useContext(DataContext)

export function useProject() {
  const { project, phases, tasks, items } = useStore()
  return useMemo(() => {
    if (!project) return { project: null, phases: [], tasks: [], items: [] }
    const mine = (row) => row.project_id === project.id
    return { project, phases: phases.filter(mine), tasks: tasks.filter(mine), items: items.filter(mine) }
  }, [project, phases, tasks, items])
}
