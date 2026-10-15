import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from './supabase'
import { DataContext } from './context'

const empty = { projects: [], phases: [], tasks: [], items: [], people: [] }

const STORAGE_KEY = 'podcast-creator-project'

const newRow = (fields) => ({ id: crypto.randomUUID(), ...fields })

export function DataProvider({ session, children }) {
  const [data, setData] = useState(empty)
  const [ready, setReady] = useState(false)
  const [projectId, setProjectId] = useState(() => localStorage.getItem(STORAGE_KEY))
  const [toast, setToast] = useState('')
  const toastTimer = useRef()

  const notify = useCallback((text) => {
    setToast(text)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(''), 3200)
  }, [])

  const selectProject = useCallback((id) => {
    localStorage.setItem(STORAGE_KEY, id)
    setProjectId(id)
  }, [])

  const load = useCallback(async () => {
    const results = await Promise.all([
      supabase.from('projects').select('*').order('created_at'),
      supabase.from('phases').select('*').order('position'),
      supabase.from('tasks').select('*').order('position'),
      supabase.from('checklist_items').select('*').order('position'),
      supabase.from('allowed_emails').select('*'),
    ])
    if (results.some((r) => r.error)) {
      notify('No pudimos cargar los datos. Revisa tu conexión.')
      setReady(true)
      return
    }
    const [projects, phases, tasks, items, people] = results.map((r) => r.data ?? [])
    setData({ projects, phases, tasks, items, people })
    setReady(true)
  }, [notify])

  useEffect(() => {
    load()
    let timer
    const channel = supabase
      .channel(`podcast-creator-${crypto.randomUUID()}`)
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        clearTimeout(timer)
        timer = setTimeout(load, 300)
      })
      .subscribe()
    const onVisible = () => {
      if (document.visibilityState === 'visible') load()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearTimeout(timer)
      supabase.removeChannel(channel)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [load])

  const run = useCallback(
    async (update, request) => {
      setData((d) => update(d))
      const { error } = await request()
      if (error) {
        notify('No se pudo guardar. Intenta de nuevo.')
        load()
      }
    },
    [load, notify],
  )

  const patch = (list, id, fields) => list.map((row) => (row.id === id ? { ...row, ...fields } : row))

  const actions = useMemo(
    () => ({
      createProject: async ({ name, goal, launch_date }) => {
        const { data: id, error } = await supabase.rpc('create_project', {
          p_name: name,
          p_goal: goal || null,
          p_launch: launch_date || null,
        })
        if (error) {
          notify('No se pudo crear el proyecto. Intenta de nuevo.')
          return null
        }
        await load()
        selectProject(id)
        return id
      },
      updateProject: (id, fields) =>
        run((d) => ({ ...d, projects: patch(d.projects, id, fields) }), () => supabase.from('projects').update(fields).eq('id', id)),
      deleteProject: (id) =>
        run(
          (d) => ({
            projects: d.projects.filter((p) => p.id !== id),
            phases: d.phases.filter((p) => p.project_id !== id),
            tasks: d.tasks.filter((t) => t.project_id !== id),
            items: d.items.filter((i) => i.project_id !== id),
            people: d.people,
          }),
          () => supabase.from('projects').delete().eq('id', id),
        ),
      addTask: (fields) => {
        const row = newRow({ status: 'todo', explanation: '', created_at: new Date().toISOString(), ...fields })
        return run((d) => ({ ...d, tasks: [...d.tasks, row] }), () => supabase.from('tasks').insert(row))
      },
      updateTask: (id, fields) =>
        run((d) => ({ ...d, tasks: patch(d.tasks, id, fields) }), () => supabase.from('tasks').update(fields).eq('id', id)),
      deleteTask: (id) =>
        run(
          (d) => ({ ...d, tasks: d.tasks.filter((t) => t.id !== id), items: d.items.filter((i) => i.task_id !== id) }),
          () => supabase.from('tasks').delete().eq('id', id),
        ),
      addItem: (fields) => {
        const row = newRow({ done: false, ...fields })
        return run((d) => ({ ...d, items: [...d.items, row] }), () => supabase.from('checklist_items').insert(row))
      },
      updateItem: (id, fields) =>
        run((d) => ({ ...d, items: patch(d.items, id, fields) }), () => supabase.from('checklist_items').update(fields).eq('id', id)),
      deleteItem: (id) =>
        run((d) => ({ ...d, items: d.items.filter((i) => i.id !== id) }), () => supabase.from('checklist_items').delete().eq('id', id)),
    }),
    [run, load, notify, selectProject],
  )

  const email = session.user.email?.toLowerCase()
  const me = data.people.find((p) => p.email === email)?.name ?? null
  const project = data.projects.find((p) => p.id === projectId) ?? data.projects[data.projects.length - 1] ?? null

  const value = { ...data, project, selectProject, ready, actions, notify, me, session }

  return (
    <DataContext.Provider value={value}>
      {children}
      <div className={`toast ${toast ? 'show' : ''}`} role="status">
        {toast}
      </div>
    </DataContext.Provider>
  )
}
