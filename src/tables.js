export const EXTRA = {
  briefs: { table: 'brand_brief', key: 'project_id' },
  modules: { table: 'module_progress', key: ['project_id', 'step_code'] },
  guests: { table: 'guests', order: 'created_at' },
  ideas: { table: 'ideas', order: 'created_at' },
  calendar: { table: 'calendar_items', order: 'publish_on' },
  messages: { table: 'ai_messages', order: 'created_at' },
  favorites: { table: 'favorites', order: 'created_at' },
  references: { table: 'references_shows', order: 'created_at' },
}
