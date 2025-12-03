import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create a test school
  const school = await prisma.school.upsert({
    where: { email: 'admin@testschool.com' },
    update: {},
    create: {
      name: 'Test School',
      email: 'admin@testschool.com',
      phone: '+1234567890',
      address: '123 Test Street, Test City'
    }
  });

  console.log('Created school:', school);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
