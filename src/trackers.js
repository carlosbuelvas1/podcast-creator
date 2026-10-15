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
    { key: 'uspto', label: 'Marcas (USPTO)', url: 'https://tmsearch.uspto.gov/search/search-information' },
    { key: 'sunbiz', label: 'Empresas en Florida', url: 'https://search.sunbiz.org/Inquiry/CorporationSearch/ByName' },
  ]
}

export const KINDS = [
  { id: 'episode', label: 'Episodio' },
  { id: 'short', label: 'Short' },
  { id: 'vlog', label: 'Vlog' },
]

export const kindLabel = (k) => KINDS.find((x) => x.id === k)?.label ?? k

export const GUEST_STATUS = [
  { id: 'idea', label: 'Idea' },
  { id: 'contacted', label: 'Contactado' },
  { id: 'confirmed', label: 'Confirmado' },
  { id: 'recorded', label: 'Grabado' },
  { id: 'published', label: 'Publicado' },
]

export const CAL_STATUS = [
  { id: 'planned', label: 'Planeado' },
  { id: 'recorded', label: 'Grabado' },
  { id: 'edited', label: 'Editado' },
  { id: 'scheduled', label: 'Programado' },
  { id: 'published', label: 'Publicado' },
]

export const today = () => new Date().toISOString().slice(0, 10)
