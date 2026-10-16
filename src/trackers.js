import { t, tk } from './i18n'
export const slug = (s) => (s ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '')

export const nameLinks = (name, handle) => {
  const q = encodeURIComponent(name)
  const h = slug(handle || name)
  return [
    { key: 'spotify', label: 'Spotify', url: `https://open.spotify.com/search/${q}/podcasts` },
    { key: 'apple', label: 'Apple Podcasts', url: `https://podcasts.apple.com/search?term=${q}` },
    { key: 'domain', label: `Dominio ${h}.com`, url: `https://www.namecheap.com/domains/registration/results/?domain=${h}.com` },
    { key: 'instagram', label: 'Instagram', url: `https://www.instagram.com/${h}/` },
    { key: 'x', label: 'X', url: `https://x.com/${h}` },
    { key: 'tiktok', label: 'TikTok', url: `https://www.tiktok.com/@${h}` },
    { key: 'youtube', label: 'YouTube', url: `https://www.youtube.com/@${h}` },
    { key: 'uspto', label: t('Marcas (USPTO)'), url: 'https://tmsearch.uspto.gov/search/search-information' },
    { key: 'sunbiz', label: t('Empresas en Florida'), url: 'https://search.sunbiz.org/Inquiry/CorporationSearch/ByName' },
  ]
}

export const KINDS = [
  { id: 'episode', label: tk('Episodio') },
  { id: 'short', label: tk('Short') },
  { id: 'vlog', label: tk('Vlog') },
]

export const kindLabel = (k) => t(KINDS.find((x) => x.id === k)?.label ?? k)

export const GUEST_STATUS = [
  { id: 'idea', label: tk('Idea') },
  { id: 'contacted', label: tk('Contactado') },
  { id: 'confirmed', label: tk('Confirmado') },
  { id: 'recorded', label: tk('Grabado') },
  { id: 'published', label: tk('Publicado') },
]

export const CAL_STATUS = [
  { id: 'planned', label: tk('Planeado') },
  { id: 'recorded', label: tk('Grabado') },
  { id: 'edited', label: tk('Editado') },
  { id: 'scheduled', label: tk('Programado') },
  { id: 'published', label: tk('Publicado') },
]

export const today = () => new Date().toISOString().slice(0, 10)
