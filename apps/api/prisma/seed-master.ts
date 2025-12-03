import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Creating Master Super Admin...');

  // Check if master admin already exists
  const existingMaster = await prisma.user.findFirst({
    where: { 
      isMaster: true,
      role: UserRole.MASTER_SUPER_ADMIN 
    }
  });

  if (existingMaster) {
    console.log('✅ Master Super Admin already exists:', existingMaster.email);
    return;
  }

  // Create Master Super Admin
  const hashedPassword = await bcrypt.hash('MasterAdmin@2024!', 12);

  const masterAdmin = await prisma.user.create({
    data: {
      email: 'master@schoolsaas.com', // Change this to your email
      password: hashedPassword,
      firstName: 'Master',
      lastName: 'Admin',
      role: UserRole.MASTER_SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      isMaster: true,
      // No schoolId - platform level admin
    }
  });

  console.log('✅ Master Super Admin created successfully!');
  console.log('📧 Email:', masterAdmin.email);
  console.log('🔑 Password: MasterAdmin@2024!');
  console.log('⚠️  Please change the password after first login!');

  // Create some permission templates
  const templates = [
    {
      name: 'School Admin Full Access',
      description: 'Full access to school management',
      role: UserRole.SCHOOL_ADMIN,
      resource: 'USERS' as any,
      actions: ['MANAGE' as any],
      isDefault: true
    },
    {
      name: 'Branch Admin Limited',
      description: 'Limited access to branch management',
      role: UserRole.BRANCH_ADMIN,
      resource: 'STUDENTS' as any,
      actions: ['CREATE' as any, 'READ' as any, 'UPDATE' as any],
      isDefault: true
    }
  ];

  for (const template of templates) {
    await prisma.permissionTemplate.create({ data: template });
  }

  console.log('✅ Permission templates created!');
}

main()
  .catch((e) => {
    console.error('❌ Error creating Master Super Admin:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
