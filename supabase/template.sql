delete from public.template_phases;

do $$
declare p uuid;
begin
  insert into public.template_phases (position, title, summary) values (1, 'Concepto y marca', 'Definan de qué trata el podcast, para quién es y cómo se va a ver y sonar.') returning id into p;
  insert into public.template_steps (phase_id, position, title, explanation, checklist) values
    (p, 1, 'Definir la idea y el público', 'Escriban en una frase de qué trata el podcast y a quién le hablan.', array['Frase de la idea', 'Describir al oyente ideal']),
    (p, 2, 'Elegir nombre y estilo', 'Busquen un nombre fácil de recordar y definan el tono del programa.', array['Lista de nombres', 'Nombre elegido', 'Tono definido']);

  insert into public.template_phases (position, title, summary) values (2, 'Equipo y presupuesto', 'Repartan roles y decidan cuánto van a invertir.') returning id into p;
  insert into public.template_steps (phase_id, position, title, explanation, checklist) values
    (p, 1, 'Repartir roles', 'Decidan quién hace qué: conducción, guion, edición y redes.', array['Roles escritos']),
    (p, 2, 'Armar el presupuesto', 'Hagan una lista de lo que necesitan comprar y cuánto cuesta.', array['Lista de equipo', 'Total aprobado']);

  insert into public.template_phases (position, title, summary) values (3, 'Grabación', 'Preparen el espacio y graben los primeros episodios.') returning id into p;
  insert into public.template_steps (phase_id, position, title, explanation, checklist) values
    (p, 1, 'Preparar el espacio', 'Elijan un lugar tranquilo y prueben el sonido.', array['Lugar elegido', 'Prueba de sonido']),
    (p, 2, 'Grabar los primeros episodios', 'Graben al menos 3 episodios antes de lanzar.', array['Episodio 1', 'Episodio 2', 'Episodio 3']);

  insert into public.template_phases (position, title, summary) values (4, 'Edición', 'Dejen cada episodio listo para publicar.') returning id into p;
  insert into public.template_steps (phase_id, position, title, explanation, checklist) values
    (p, 1, 'Editar los episodios', 'Corten errores, ajusten el volumen y agreguen intro y música.', array['Intro y música', 'Episodios editados']);

  insert into public.template_phases (position, title, summary) values (5, 'Lanzamiento y plataformas', 'Publiquen el podcast y avísenle al mundo.') returning id into p;
  insert into public.template_steps (phase_id, position, title, explanation, checklist) values
    (p, 1, 'Subir a las plataformas', 'Publiquen en Spotify, Apple Podcasts y YouTube.', array['Spotify', 'Apple Podcasts', 'YouTube']),
    (p, 2, 'Anunciar el lanzamiento', 'Preparen publicaciones para redes y compártanlas el día del lanzamiento.', array['Publicaciones listas', 'Día del lanzamiento']);

  insert into public.template_phases (position, title, summary) values (6, 'Crecimiento', 'Mantengan el ritmo y hagan crecer la audiencia.') returning id into p;
  insert into public.template_steps (phase_id, position, title, explanation, checklist) values
    (p, 1, 'Definir el calendario', 'Decidan cada cuánto publican y respétenlo.', array['Frecuencia elegida']),
    (p, 2, 'Revisar resultados', 'Cada mes miren cuántas personas escuchan y qué funciona mejor.', array['Revisión mensual']);
end $$;
