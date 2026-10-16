import { useSyncExternalStore } from 'react'
import en from './locales/en.json'
import content from './locales/content-en.json'

const KEY = 'podcast-creator-lang'
const DICTS = { en: { ...content, ...en } }
export const LANGS = ['es', 'en']

const read = () => {
  try {
    return localStorage.getItem(KEY) === 'en' ? 'en' : 'es'
  } catch {
    return 'es'
  }
}

let lang = read()
const listeners = new Set()

export const getLang = () => lang

export function setLang(next) {
  lang = LANGS.includes(next) ? next : 'es'
  localStorage.setItem(KEY, lang)
  document.documentElement.lang = lang
  listeners.forEach((fn) => fn())
}

const subscribe = (fn) => {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export const useLang = () => useSyncExternalStore(subscribe, getLang)

export function t(text, vars) {
  const out = (lang !== 'es' && DICTS[lang]?.[text]) || text
  return vars ? out.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '') : out
}
export const tk = (text) => text
