import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from './supabase'
import { DataContext } from './context'

const empty = { settings: null, tasks: [], goals: [], items: [], people: [] }

const newRow = (fields) => ({ id: crypto.randomUUID(), created_at: new Date().toISOString(), ...fields })

export function DataProvider({ session, children }) {
  const [data, setData] = useState(empty)
  const [ready, setReady] = useState(false)
  const [toast, setToast] = useState('')
  const toastTimer = useRef()

  const notify = useCallback((text) => {
    setToast(text)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(''), 3200)
  }, [])

  const load = useCallback(async () => {
    const results = await Promise.all([
      supabase.from('settings').select('*').eq('id', 1).maybeSingle(),
      supabase.from('tasks').select('*').order('created_at'),
      supabase.from('goals').select('*').order('created_at'),
      supabase.from('goal_items').select('*').order('created_at'),
      supabase.from('allowed_emails').select('*'),
    ])
    if (results.some((r) => r.error)) {
      notify('No pudimos cargar los datos. Revisa tu conexión.')
      setReady(true)
      return
    }
    const [settings, tasks, goals, items, people] = results.map((r) => r.data)
    setData({ settings, tasks: tasks ?? [], goals: goals ?? [], items: items ?? [], people: people ?? [] })
    setReady(true)
  }, [notify])

  useEffect(() => {
    load()
    let timer
    const channel = supabase
      .channel(`cuadrando-${crypto.randomUUID()}`)
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        clearTimeout(timer)
        timer = setTimeout(load, 250)
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

  const actions = useMemo(
    () => ({
      saveSettings: (fields) =>
        run(
          (d) => ({ ...d, settings: { id: 1, ...d.settings, ...fields } }),
          () => supabase.from('settings').upsert({ id: 1, ...fields, updated_at: new Date().toISOString() }),
        ),
      addTask: (fields) => {
        const row = newRow({ status: 'todo', ...fields })
        return run((d) => ({ ...d, tasks: [...d.tasks, row] }), () => supabase.from('tasks').insert(row))
      },
      updateTask: (id, fields) =>
        run(
          (d) => ({ ...d, tasks: d.tasks.map((t) => (t.id === id ? { ...t, ...fields } : t)) }),
          () => supabase.from('tasks').update(fields).eq('id', id),
        ),
      deleteTask: (id) =>
        run((d) => ({ ...d, tasks: d.tasks.filter((t) => t.id !== id) }), () => supabase.from('tasks').delete().eq('id', id)),
      addGoal: (title) => {
        const row = newRow({ title })
        return run((d) => ({ ...d, goals: [...d.goals, row] }), () => supabase.from('goals').insert(row))
      },
      updateGoal: (id, fields) =>
        run(
          (d) => ({ ...d, goals: d.goals.map((g) => (g.id === id ? { ...g, ...fields } : g)) }),
          () => supabase.from('goals').update(fields).eq('id', id),
        ),
      deleteGoal: (id) =>
        run(
          (d) => ({ ...d, goals: d.goals.filter((g) => g.id !== id), items: d.items.filter((i) => i.goal_id !== id) }),
          () => supabase.from('goals').delete().eq('id', id),
        ),
      addItem: (goal_id, text) => {
        const row = newRow({ goal_id, text, done: false })
        return run((d) => ({ ...d, items: [...d.items, row] }), () => supabase.from('goal_items').insert(row))
      },
      updateItem: (id, fields) =>
        run(
          (d) => ({ ...d, items: d.items.map((i) => (i.id === id ? { ...i, ...fields } : i)) }),
          () => supabase.from('goal_items').update(fields).eq('id', id),
        ),
      deleteItem: (id) =>
        run((d) => ({ ...d, items: d.items.filter((i) => i.id !== id) }), () => supabase.from('goal_items').delete().eq('id', id)),
    }),
    [run],
  )

  const email = session.user.email?.toLowerCase()
  const me = data.people.find((p) => p.email === email)?.name ?? null

  const value = { ...data, ready, actions, notify, me, session }

  return (
    <DataContext.Provider value={value}>
      {children}
      <div className={`toast ${toast ? 'show' : ''}`} role="status">
        {toast}
      </div>
    </DataContext.Provider>
  )
}
