import { useStore, useProject } from './context'

export const PROVISIONAL_NAME = 'Mi podcast (nombre por definir)'
export const NAME_STEP = '0.1'
export const NAME_FOCUS = 'nombre'

export const isProvisional = (project) => !project?.name?.trim() || project.name.trim() === PROVISIONAL_NAME

export const shortName = (project) => (isProvisional(project) ? 'Mi podcast' : project.name)

export function useChooseName() {
  const { actions } = useStore()
  const { project, brief } = useProject()
  return (name, extra = {}) => {
    const clean = name.trim()
    if (!clean || clean === PROVISIONAL_NAME) return false
    actions.updateProject(project.id, { name: clean })
    actions.upsert('briefs', { project_id: project.id, data: { ...brief, ...extra, availability: { ...(brief.availability ?? {}), ...(extra.availability ?? {}) }, name: clean }, updated_at: new Date().toISOString() })
    return true
  }
}
