INSERT INTO roles (nombre, descripcion, activo)
VALUES ('ADMINISTRADOR', 'Usuario con acceso administrativo al sistema', true)
ON CONFLICT (nombre) DO NOTHING;


INSERT INTO usuarios (
  nombre,
  correo,
  password,
  id_rol,
  activo,
  creado_en
)
VALUES (
  'Administrador',
  'admin@test.com',
  '$2b$10$LKpapqLGJ8nMxvVPY7nkmuVtTQj2.vmWOQUtHYROmXtdfLFFtLTKu',
  (SELECT id_rol FROM roles WHERE nombre = 'ADMINISTRADOR'),
  true,
  NOW()
)
ON CONFLICT (correo) DO UPDATE SET
  password = EXCLUDED.password,
  id_rol = EXCLUDED.id_rol,
  activo = true;