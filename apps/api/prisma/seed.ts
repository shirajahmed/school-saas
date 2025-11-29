import { PrismaClient, UserRole } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // School 1
  const school1 = await prisma.school.create({
    data: {
      name: 'Green Valley School',
      code: 'GVS001',
      email: 'admin@greenvalley.edu',
      phone: '+1234567890',
    },
  });

  const branch1 = await prisma.branch.create({
    data: {
      schoolId: school1.id,
      name: 'Main Campus',
      code: 'MAIN',
      email: 'main@greenvalley.edu',
    },
  });

  // Super Admin
  await prisma.user.create({
    data: {
      schoolId: school1.id,
      email: 'admin@greenvalley.edu',
      password: await hash('admin123', 10),
      firstName: 'John',
      lastName: 'Admin',
      roles: [UserRole.SUPER_ADMIN],
    },
  });

  // School Admin
  await prisma.user.create({
    data: {
      schoolId: school1.id,
      branchId: branch1.id,
      email: 'school@greenvalley.edu',
      password: await hash('school123', 10),
      firstName: 'Jane',
      lastName: 'Principal',
      roles: [UserRole.SCHOOL_ADMIN],
    },
  });

  console.log('Seed data created successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
