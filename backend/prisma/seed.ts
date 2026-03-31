import { PrismaClient, Role, Status, ProjectType, ProjectStage, PropertyStatus } from '@prisma/client';
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

  // 5. Casagrand (Builder Company)
  const casagrand = await prisma.user.upsert({
    where: { email: 'contact@casagrand.co.in' },
    update: {},
    create: {
      email: 'contact@casagrand.co.in',
      phone: '+919884800062',
      passwordHash,
      role: Role.COMPANY,
      status: Status.ACTIVE,
      inviteCode: 'CASAGRAND_INVITE',
    },
  });

  // 6. Casagrand Promenade — Yelahanka, Bengaluru
  const casagrandPromenade = await prisma.property.upsert({
    where: { id: 'casagrand-promenade-yelahanka' },
    update: {},
    create: {
      id: 'casagrand-promenade-yelahanka',
      title: 'Casagrand Promenade',
      description:
        'Casagrand Promenade offers 223 thoughtfully designed homes on 3.89 acres in Yelahanka, North Bangalore. The project features 2, 3 & 4 BHK Elite apartments with dual balconies, premium finishes, and Vaastu-compliant designs. With 66% open space, a 13,000 sq.ft clubhouse, and 65+ world-class amenities including a 3,400 sq.ft swimming pool and 33,000 sq.ft central courtyard, it redefines luxury living in Bangalore North.',
      projectType: ProjectType.APARTMENT,
      projectStage: ProjectStage.UNDER_CONSTRUCTION,
      status: PropertyStatus.AVAILABLE,
      reraId: 'PRM/KA/RERA/1251/309/PR/070525/007719',
      country: 'India',
      state: 'Karnataka',
      city: 'Bengaluru',
      locality: 'Yelahanka',
      address: 'Yelahanka, Bengaluru North, Karnataka',
      price: 14600000,   // ₹1.46 Cr (3BHK starting)
      maxPrice: 20400000, // ₹2.04 Cr+ (4BHK)
      pricePerSqFt: 7499,
      currency: 'INR',
      builderName: 'Casagrand Builder Private Limited',
      builderContact: '+91-98848-00062',
      builderEmail: 'contact@casagrand.co.in',
      builderAddress: 'Chennai (Head Office) — +91-99629-44444',
      commissionPoolPct: 2.0,
      amenities: [
        'Clubhouse (13,000 sq.ft)',
        'Swimming Pool (3,400 sq.ft)',
        'Central Courtyard (33,000 sq.ft)',
        'Gymnasium',
        'Kids Play Area',
        'Yoga Deck',
        'Jogging Track',
        'Meditation Pavilion',
        'Sports Courts',
        'Multipurpose Hall',
        'Games Room',
        'Learning Center',
        'Creche',
        'Terrace Sky Cinema',
        '24/7 Security',
        'Power Backup',
      ],
      seoTags: ['casagrand', 'promenade', 'yelahanka', 'bangalore north', 'luxury apartments', '3bhk', '4bhk'],
      companyId: casagrand.id,
      units: {
        create: [
          {
            name: '2 BHK Elite',
            beds: 2,
            baths: 2,
            balconies: 2,
            superArea: 1647,
            carpetArea: 1220,
            minPrice: 9500000,
            maxPrice: 12350000,
            totalUnits: 60,
            availableUnits: 0, // Sold out
          },
          {
            name: '3 BHK Elite',
            beds: 3,
            baths: 3,
            balconies: 2,
            superArea: 2152,
            carpetArea: 1595,
            minPrice: 14600000,
            maxPrice: 16600000,
            totalUnits: 120,
            availableUnits: 78,
          },
          {
            name: '4 BHK Elite',
            beds: 4,
            baths: 4,
            balconies: 2,
            superArea: 2670,
            carpetArea: 1980,
            minPrice: 20400000,
            maxPrice: 20400000,
            totalUnits: 43,
            availableUnits: 25,
          },
        ],
      },
    },
  });

  // Upsert documents for Casagrand Promenade (idempotent)
  const existingDocs = await prisma.propertyDocument.findMany({
    where: { propertyId: 'casagrand-promenade-yelahanka' },
  });
  if (existingDocs.length === 0) {
    await prisma.propertyDocument.createMany({
      data: [
        {
          propertyId: 'casagrand-promenade-yelahanka',
          type: 'Brochure',
          title: 'Casagrand Promenade Brochure',
          url: 'https://casagrand-prod.s3.ap-south-1.amazonaws.com/wp-content/uploads/2025/05/Casagrand-Promenade-E-Brochure.pdf',
        },
        {
          propertyId: 'casagrand-promenade-yelahanka',
          type: 'Master Plan',
          title: 'Site Plan',
          url: 'https://casagrand-prod.s3.ap-south-1.amazonaws.com/wp-content/uploads/2025/05/SITE-PLAN-scaled.jpg',
        },
        {
          propertyId: 'casagrand-promenade-yelahanka',
          type: 'Floor Plan',
          title: 'Ground Floor Plan',
          url: 'https://casagrand-prod.s3.ap-south-1.amazonaws.com/wp-content/uploads/2025/05/GROUND-FLOOR-PLAN-1-scaled.jpg',
        },
      ],
    });
  }

  console.log('Demo users created successfully:');
  console.table([
    { role: 'Admin', email: admin.email, password: 'password123' },
    { role: 'Company', email: company.email, password: 'password123' },
    { role: 'Agent 1', email: agent1.email, password: 'password123' },
    { role: 'Agent 2', email: agent2.email, password: 'password123' },
    { role: 'Company (Casagrand)', email: casagrand.email, password: 'password123' },
  ]);

  console.log('\nProjects seeded:');
  console.table([
    {
      project: casagrandPromenade.title,
      locality: casagrandPromenade.locality,
      city: casagrandPromenade.city,
      stage: casagrandPromenade.projectStage,
      rera: casagrandPromenade.reraId,
    },
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
