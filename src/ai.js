import { supabase } from './supabase'
import { demoAnswer } from './demo-ai'
import { getLang, t, tk } from './i18n'

const KEY = 'podcast-creator-ai'

let demoMode = false
export const setDemoMode = (on) => {
  demoMode = on
}

export const isDemo = () => demoMode
export const DEMO_MESSAGE = tk('Esta es una demo de solo lectura. Inicia sesión para guardar cambios.')

let user = null
export const setAiUser = (id) => {
  user = id ?? null
}

const userKey = () => `${KEY}:${demoMode ? 'demo' : user ?? 'anon'}`

export const aiEnabled = () => (localStorage.getItem(userKey()) ?? (demoMode ? 'on' : localStorage.getItem(KEY))) !== 'off'
export const setAiEnabled = (on) => localStorage.setItem(userKey(), on ? 'on' : 'off')

export async function askAI({ projectId, message, mode = 'chat', context = null, author }) {
  if (demoMode) {
    await new Promise((r) => setTimeout(r, 400))
    return demoAnswer(mode, message)
  }
  const { data, error } = await supabase.functions.invoke('ai-chat', { body: { project_id: projectId, message, mode, context, author, lang: getLang() } })
  if (error) {
    let reason = ''
    try {
      reason = (await error.context?.json())?.error ?? ''
    } catch {
      reason = ''
    }
    throw new Error(reason || t('No pudimos hablar con la IA ahora.'))
  }
  return data
}

export async function researchReference({ referenceId, pick = null, refresh = false }) {
  if (demoMode) throw new Error(t(DEMO_MESSAGE))
  const { data, error } = await supabase.functions.invoke('research-referente', { body: { reference_id: referenceId, pick, refresh, ai: aiEnabled() } })
  if (error) {
    let reason = ''
    try {
      reason = (await error.context?.json())?.error ?? ''
    } catch {
      reason = ''
    }
    throw new Error(reason || t('No pudimos investigar este referente ahora.'))
  }
  return data
}
