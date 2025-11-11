const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  try {
    // Create a test user
    const hashedPassword = await bcrypt.hash('password123', 10);
    const user = await prisma.user.upsert({
      where: { email: 'test@example.com' },
      update: {},
      create: {
        email: 'test@example.com',
        password: hashedPassword,
        name: 'Test User',
      },
    });

    console.log('Created user:', user.email);

    // Create sample clients
    const client1 = await prisma.client.upsert({
      where: { id: 'client1' },
      update: {},
      create: {
        id: 'client1',
        userId: user.id,
        name: 'Acme Corporation',
        email: 'contact@acme.com',
        company: 'Acme Corp',
        phone: '+1-555-0123',
        notes: 'Large enterprise client',
      },
    });

    const client2 = await prisma.client.upsert({
      where: { id: 'client2' },
      update: {},
      create: {
        id: 'client2',
        userId: user.id,
        name: 'TechStart Inc',
        email: 'hello@techstart.com',
        company: 'TechStart Inc',
        phone: '+1-555-0456',
        notes: 'Startup focused on AI solutions',
      },
    });

    const client3 = await prisma.client.upsert({
      where: { id: 'client3' },
      update: {},
      create: {
        id: 'client3',
        userId: user.id,
        name: 'Creative Agency',
        email: 'projects@creative.com',
        company: 'Creative Agency LLC',
        phone: '+1-555-0789',
        notes: 'Design and marketing agency',
      },
    });

    console.log('Created clients:', [client1.name, client2.name, client3.name]);

    // Create sample projects
    const projects = [
      {
        id: 'project1',
        userId: user.id,
        clientId: client1.id,
        name: 'E-commerce Platform Development',
        description: 'Building a modern e-commerce platform with React and Node.js',
        rate: 150.0,
        rateType: 'HOURLY',
        startDate: new Date('2024-01-15'),
        deadline: new Date('2024-04-15'),
        status: 'ACTIVE',
      },
      {
        id: 'project2',
        userId: user.id,
        clientId: client2.id,
        name: 'Mobile App UI/UX Design',
        description: 'Complete mobile app design for iOS and Android platforms',
        rate: 5000.0,
        rateType: 'FIXED',
        startDate: new Date('2024-02-01'),
        deadline: new Date('2024-03-01'),
        status: 'COMPLETED',
      },
      {
        id: 'project3',
        userId: user.id,
        clientId: client3.id,
        name: 'Website Redesign',
        description: 'Complete website redesign with modern responsive design',
        rate: 125.0,
        rateType: 'HOURLY',
        startDate: new Date('2024-01-01'),
        deadline: new Date('2024-02-28'),
        status: 'PAUSED',
      },
      {
        id: 'project4',
        userId: user.id,
        clientId: client1.id,
        name: 'API Integration',
        description: 'Integrate third-party APIs for payment processing',
        rate: 3500.0,
        rateType: 'FIXED',
        startDate: new Date('2024-03-01'),
        deadline: new Date('2024-01-20'), // Overdue project
        status: 'ACTIVE',
      },
      {
        id: 'project5',
        userId: user.id,
        clientId: client2.id,
        name: 'Database Optimization',
        description: 'Optimize database queries and improve performance',
        rate: 175.0,
        rateType: 'HOURLY',
        startDate: new Date('2024-01-10'),
        deadline: new Date('2024-01-25'), // Due this week
        status: 'ACTIVE',
      },
    ];

    for (const projectData of projects) {
      const project = await prisma.project.upsert({
        where: { id: projectData.id },
        update: {},
        create: projectData,
      });
      console.log('Created project:', project.name);
    }

    console.log('\n✅ Sample data created successfully!');
    console.log('\n📊 Summary:');
    console.log('- 1 test user created');
    console.log('- 3 clients created');
    console.log('- 5 projects created (2 active, 1 completed, 1 paused, 1 overdue)');
    console.log('\n🔗 You can now view the data at:');
    console.log('- Projects page: http://localhost:3001/projects');
    console.log('- Prisma Studio: http://localhost:5555');

  } catch (error) {
    console.error('Error creating sample data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();