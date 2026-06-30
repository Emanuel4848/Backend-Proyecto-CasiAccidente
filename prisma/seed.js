const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const rol = await prisma.roles.upsert({
    where: { nombre: "ADMINISTRADOR" },
    update: {
      descripcion: "Rol administrador del sistema",
      activo: true,
    },
    create: {
      nombre: "ADMINISTRADOR",
      descripcion: "Rol administrador del sistema",
      activo: true,
    },
  });

  const passwordHasheada = await bcrypt.hash("123456", 10);

  await prisma.usuarios.upsert({
    where: { correo: "admin@test.com" },
    update: {
      nombre: "Administrador",
      password: passwordHasheada,
      id_rol: rol.id_rol,
      activo: true,
    },
    create: {
      nombre: "Administrador",
      correo: "admin@test.com",
      password: passwordHasheada,
      id_rol: rol.id_rol,
      activo: true,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
