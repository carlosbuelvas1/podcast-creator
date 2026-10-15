insert into public.settings (id, goal, launch_date)
values (1, 'Lanzar el podcast Cuadrando', current_date + 60)
on conflict (id) do nothing;

do $$
declare g1 uuid; g2 uuid; g3 uuid;
begin
  if not exists (select 1 from public.goals) then
    insert into public.goals (title) values ('Grabar los primeros 3 episodios') returning id into g1;
    insert into public.goals (title) values ('Abrir la cuenta de Instagram') returning id into g2;
    insert into public.goals (title) values ('Comprar los micrófonos') returning id into g3;
    insert into public.goal_items (goal_id, text) values
      (g1, 'Episodio 1'), (g1, 'Episodio 2'), (g1, 'Episodio 3'),
      (g2, 'Elegir el nombre de usuario'), (g2, 'Foto de perfil y descripción'), (g2, 'Primeras 3 publicaciones'),
      (g3, 'Comparar opciones'), (g3, 'Elegir el modelo'), (g3, 'Comprar 2 micrófonos');
  end if;

  if not exists (select 1 from public.tasks) then
    insert into public.tasks (title, owner, due_date, status) values
      ('Definir el formato de cada episodio', 'Carlos', current_date + 3, 'todo'),
      ('Escribir la guía del episodio 1', 'Michelle', current_date + 5, 'todo'),
      ('Diseñar el logo del podcast', 'Michelle', current_date + 7, 'todo'),
      ('Elegir dónde publicar el podcast', 'Carlos', current_date + 10, 'todo');
  end if;
end $$;
