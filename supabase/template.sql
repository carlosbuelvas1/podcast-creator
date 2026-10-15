delete from public.template_phases;

do $$
declare p uuid;
begin
  insert into public.template_phases (position, title, summary) values (1, 'Concepto e identidad', '') returning id into p;
  insert into public.template_steps (phase_id, position, title, explanation, checklist) values
    (p, 1, 'Define quién eres como creador', 'La autenticidad es obligatoria y la originalidad es opcional: tu podcast debe nacer de lo que realmente piensas, sientes y eres.', array['Escribe en una frase qué te hace único como persona', 'Revisa que el tema sea coherente con tu forma de pensar', 'Acepta que puedes hablar de temas comunes si lo haces desde tu verdad']),
    (p, 2, 'Encuentra tu autoridad', 'Responde qué te da permiso para hablar del tema: puede ser tu conocimiento o tu curiosidad.', array['Responde: ¿cuál es mi autoridad?', 'Responde: ¿qué aporto a esta conversación?', 'Decide si hablas desde el conocimiento o desde la curiosidad']),
    (p, 3, 'Elige el formato del show', 'Decide cómo será tu podcast combinando las opciones del curso, como hicieron Escuela de Nada o Joe Rogan.', array['Audio solo o audio + video', 'Solo, dupla, grupo; con o sin invitados', 'Continuo, por temporadas o limitado', 'En estudio o remoto']),
    (p, 4, 'Define el modelo de acceso', 'Desde el inicio decide qué será gratis y qué será de pago, porque eso afecta la marca y el negocio.', array['Contenido gratis', 'Contenido con paywall (por ejemplo Patreon)', 'Anuncios / patrocinios', 'Transmisiones en vivo']);

  insert into public.template_phases (position, title, summary) values (2, 'Marca e identidad visual', '') returning id into p;
  insert into public.template_steps (phase_id, position, title, explanation, checklist) values
    (p, 1, 'Elige la personalidad de tu marca', 'Usa la rueda de arquetipos de marca para definir qué emoción y valor transmite tu podcast.', array['Elige un arquetipo (Sabio, Bufón, Explorador, Héroe, etc.)', 'Define el deseo que conecta con tu audiencia', 'Asegura que encaje con tu autenticidad']),
    (p, 2, 'Crea lo esencial de la marca', 'Un podcast no es solo un nombre y un logo: necesita un estilo definido y coherencia visual.', array['Nombre y logotipo (e isotipo/icono)', 'Paleta de colores', 'Tipografía(s)', 'Guía de estilo (stylesheet)']),
    (p, 3, 'Escribe los textos de la marca', 'Prepara las frases que te presentarán en todas las plataformas.', array['Eslogan (tagline)', 'Descripción corta (logline)', 'Descripción larga (sinopsis)']),
    (p, 4, 'Prepara las piezas gráficas', 'Crea los materiales que usarás en cada episodio y en redes para verte siempre consistente.', array['Portadas/miniaturas para episodios y redes', 'Avatares para redes sociales', 'Plantillas y gráficos de soporte (patrones, texturas)', 'Opcional: un tema claro para contenido público y uno oscuro para contenido pago']),
    (p, 5, 'Arma tu one sheet', 'Un documento de una página, fiel a la marca, que resume tu podcast para invitados, socios y marcas.', array['Nombre del podcast y eslogan', 'Ficha técnica: formato, temporadas, duración', 'Descripción corta y larga', 'Elementos de valor: invitados, lugares']);

  insert into public.template_phases (position, title, summary) values (3, 'Equipo de trabajo y presupuesto', '') returning id into p;
  insert into public.template_steps (phase_id, position, title, explanation, checklist) values
    (p, 1, 'Elige bien a tu equipo', 'Rodéate de personas que estén por las razones correctas.', array['Confirma la motivación de cada integrante', 'Acuerda expectativas y compromiso']),
    (p, 2, 'Define roles', 'Asigna un responsable claro para cada tarea del proyecto.', array['¿Quién escribe?', '¿Quién produce?', '¿Quién publica?', '¿Quién lleva las redes?', '¿Quién registra la compañía?']),
    (p, 3, 'Formaliza el negocio', 'Define la sociedad o el negocio antes de crecer para evitar conflictos.', array['Acordar la sociedad entre los integrantes', 'Registrar la compañía']),
    (p, 4, 'Mapea todo el trabajo real', 'Un podcast nunca es solo un podcast: incluye clips, redes, newsletter, agenda de invitados y más.', array['Lista las tareas: escribir, investigar, agendar, booking', 'Lista las salidas: versiones de audio y video, clips, YouTube', 'Lista los canales: Instagram, X, TikTok, Facebook, newsletter, Patreon', 'Asigna quién modera comentarios']),
    (p, 5, 'Arma el presupuesto de equipo', 'Compra según tu presupuesto: empieza simple y mejora con el tiempo.', array['Micrófonos y grabadora (desde ~$100)', 'Audífonos para monitorear (ej. Sony MDR-7506, ~$100)', 'Luces (desde ~$60–$99)', 'Cámara si harás video (desde ~$500)']);

  insert into public.template_phases (position, title, summary) values (4, 'Grabación', '') returning id into p;
  insert into public.template_steps (phase_id, position, title, explanation, checklist) values
    (p, 1, 'Elige dónde grabar el audio', 'Escoge la opción más simple que te funcione para empezar.', array['Grabadora de audio externa', 'Interfaz de audio conectada a la computadora', 'Directo a la cámara o al teléfono']),
    (p, 2, 'Prepara el espacio', 'Reduce el eco del cuarto con elementos de tela y madera.', array['Alfombras, muebles, cortinas y cojines', 'Paneles acústicos en paredes o esquinas', 'Mantas de sonido en puertas o ventanas']),
    (p, 3, 'Cuida el sonido durante la grabación', 'Usa bien tu micrófono y escucha siempre lo que grabas.', array['Coloca el micrófono en la posición correcta', 'Monitorea con audífonos', 'Graba un minuto del silencio del cuarto para la edición']),
    (p, 4, 'Cuida la imagen (si hay video)', 'Un encuadre y una luz sencillos hacen que el show se vea profesional.', array['Cámara a la altura de los ojos', 'Deja espacio para textos en pantalla y para versiones verticales', 'Usa tres luces: principal, de relleno y trasera']),
    (p, 5, 'Organiza los archivos al terminar', 'Respalda y entrega el material de cada grabación de forma ordenada.', array['Sube el material crudo a la carpeta compartida', 'Registra en una tabla de control qué se grabó y qué falló', 'Guarda un respaldo antes de borrar nada']);

  insert into public.template_phases (position, title, summary) values (5, 'Edición y entregables', '') returning id into p;
  insert into public.template_steps (phase_id, position, title, explanation, checklist) values
    (p, 1, 'Arma la primera versión', 'El editor une el material y deja una versión base del episodio.', array['Unir cámaras y audio', 'Agregar intro, outro y gráficos', 'Quitar errores y cortes no deseados']),
    (p, 2, 'Revisa el episodio en equipo', 'Otra persona revisa la versión base y marca lo importante.', array['Elegir el clip de apertura', 'Marcar clips para redes sociales', 'Marcar menciones de la marca y patrocinadores', 'Anotar errores y correcciones']),
    (p, 3, 'Termina la edición', 'El editor aplica las notas y deja el episodio listo.', array['Corregir según las notas de revisión', 'Actualizar la lista de agradecimientos']),
    (p, 4, 'Prepara los entregables', 'Exporta todas las versiones que necesita cada plataforma.', array['Video para YouTube (público y, si aplica, de pago)', 'Audio para plataformas de podcast', 'Fotos fijas del episodio', 'Clips para redes']),
    (p, 5, 'Cierra el ciclo del episodio', 'Publica, guarda la versión final y libera espacio de forma segura.', array['Subir el video a YouTube', 'Guardar la versión final completa', 'Borrar el material crudo solo tras confirmar el respaldo']);

  insert into public.template_phases (position, title, summary) values (6, 'Lanzamiento, crecimiento y monetización', '') returning id into p;
  insert into public.template_steps (phase_id, position, title, explanation, checklist) values
    (p, 1, 'Asegura una buena primera impresión', 'Lanza con la marca cuidada y suficiente contenido para que te descubran.', array['Branding cuidado', 'Optimiza para que te encuentren', 'Estrena con formatos variados', 'Lanza con más de un episodio publicado', 'Usa el mismo nombre de usuario en todas las plataformas']),
    (p, 2, 'Completa el kit de iniciación', 'Activa los canales básicos antes de pensar en monetizar.', array['Cuentas activas en YouTube, Spotify y redes', 'Clips en TikTok, Shorts y Reels', 'Comunidad en Patreon y WhatsApp', 'Estrategia de promoción desde el día 1']),
    (p, 3, 'Crea tu base de datos desde el día uno', 'Las plataformas son prestadas; tu lista de contactos sí te pertenece.', array['Abre un newsletter o formulario (Mailchimp, ConvertKit, Substack)', 'Escucha a tu audiencia en redes', 'Convierte seguidores en comunidad']),
    (p, 4, 'Lleva a la audiencia hacia tu contenido principal', 'Usa contenido corto para exposición y dirígelo al contenido largo y a los canales que monetizan.', array['Contenido corto → episodio completo', 'Episodio → newsletter, WhatsApp o Patreon', 'Recuerda: lo corto da exposición, no conversión']),
    (p, 5, 'Crece junto a otros', 'En una segunda fase, colabora y experimenta para llegar a más gente.', array['Promoción cruzada con otros creadores', 'Publicidad pagada si puedes', 'Eventos en vivo', 'Define tu estrategia y tus fuentes de ingreso']),
    (p, 6, 'Diversifica tus ingresos', 'Activa las herramientas de las plataformas, pero no dependas solo de ellas; el podcast es un centro de contenidos.', array['Programas de socios de YouTube y Spotify (revisa requisitos)', 'Patreon o membresías con contenido exclusivo', 'Patrocinios y publicidad en episodios', 'Merch, productos digitales y shows en vivo']),
    (p, 7, 'Prepara tu media kit', 'Presenta tu podcast a marcas con datos claros y tarifas.', array['Descripción del podcast', 'Audiencia: descargas, suscriptores y datos demográficos', 'Frecuencia, duración y formato', 'Opciones para anunciantes y tarifas', 'Enlaces a los episodios con más alcance']);
end $$;
