const { PrismaClient } = require("@prisma/client");
(async () => {
  const prisma = new PrismaClient();
  try {
    await prisma.$connect();
    console.log("CONNECTED");
    const result = await prisma.$queryRaw`SELECT current_database() as db, current_user as user`;
    console.log(JSON.stringify(result));
  } catch (err) {
    console.error("CONNECTION_ERROR");
    console.error(err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
