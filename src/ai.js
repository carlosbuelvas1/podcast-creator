import { supabase } from './supabase'

const KEY = 'podcast-creator-ai'

export const aiEnabled = () => localStorage.getItem(KEY) !== 'off'
export const setAiEnabled = (on) => localStorage.setItem(KEY, on ? 'on' : 'off')

export async function askAI({ projectId, message, mode = 'chat', context = null, author }) {
  const { data, error } = await supabase.functions.invoke('ai-chat', { body: { project_id: projectId, message, mode, context, author } })
  if (error) {
    let reason = ''
    try {
      reason = (await error.context?.json())?.error ?? ''
    } catch {
      reason = ''
    }
    throw new Error(reason || 'No pudimos hablar con la IA ahora.')
  }
  return data
}
