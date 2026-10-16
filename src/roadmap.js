import { tk } from './i18n'

export const ROADMAP_STATUS = [
  { id: 'next', label: tk('Próximo') },
  { id: 'doing', label: tk('En camino') },
  { id: 'done', label: tk('Listo') },
]

export const ROADMAP = [
  { status: 'next', title: tk('Recordar el idioma y la IA en su cuenta, en cualquier dispositivo') },
  { status: 'next', title: tk('Lista de espera en la página pública') },
  { status: 'next', title: tk('Acceso para Michelle') },
  { status: 'next', title: tk('Página con la historia del proyecto') },
  { status: 'doing', title: tk('Pantallas más claras: listas vacías, pasos bloqueados y celebraciones') },
  { status: 'doing', title: tk('Tareas más cómodas en el celular') },
  { status: 'done', title: tk('Toda la app y la demo en inglés') },
  { status: 'done', title: tk('Página pública con demo') },
  { status: 'done', title: tk('IA: guion del episodio, hoja del día de grabación y mensajes para invitados') },
  { status: 'done', title: tk('Revisión automática de cada cambio') },
]
