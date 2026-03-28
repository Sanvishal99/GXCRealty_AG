import { PrismaClient, Role, Status } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed process...');
  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@gxcrealty.com' },
    update: {},
    create: {
      email: 'admin@gxcrealty.com',
      phone: '+10000000000',
      passwordHash,
      role: Role.ADMIN,
      status: Status.ACTIVE,
      inviteCode: 'ADMIN_INVITE',
    },
  });

  // 2. Company
  const company = await prisma.user.upsert({
    where: { email: 'company@gxcrealty.com' },
    update: {},
    create: {
      email: 'company@gxcrealty.com',
      phone: '+10000000001',
      passwordHash,
      role: Role.COMPANY,
      status: Status.ACTIVE,
      inviteCode: 'COMPANY_INVITE',
    },
  });

  // 3. Agent 1
  const agent1 = await prisma.user.upsert({
    where: { email: 'agent1@gxcrealty.com' },
    update: {},
    create: {
      email: 'agent1@gxcrealty.com',
      phone: '+10000000002',
      passwordHash,
      role: Role.AGENT,
      status: Status.ACTIVE,
      inviteCode: 'AGENT1_INVITE',
      referredById: company.id,
    },
  });

  // 4. Agent 2
  const agent2 = await prisma.user.upsert({
    where: { email: 'agent2@gxcrealty.com' },
    update: {},
    create: {
      email: 'agent2@gxcrealty.com',
      phone: '+10000000003',
      passwordHash,
      role: Role.AGENT,
      status: Status.ACTIVE,
      inviteCode: 'AGENT2_INVITE',
      referredById: agent1.id, // Agent 2 referred by Agent 1 to show MLM relation
    },
  });

  console.log('Demo users created successfully:');
  console.table([
    { role: 'Admin', email: admin.email, password: 'password123' },
    { role: 'Company', email: company.email, password: 'password123' },
    { role: 'Agent 1', email: agent1.email, password: 'password123' },
    { role: 'Agent 2', email: agent2.email, password: 'password123' },
  ]);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
