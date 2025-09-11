// Test script to verify Supabase connection
// Run this after setting up your Supabase credentials

const { PrismaClient } = require('./src/generated/prisma');

async function testSupabaseConnection() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔄 Testing Supabase connection...');
    
    // Test database connection
    await prisma.$connect();
    console.log('✅ Successfully connected to Supabase!');
    
    // Test a simple query
    const userCount = await prisma.user.count();
    console.log(`📊 Current user count: ${userCount}`);
    
    console.log('🎉 Supabase integration is working correctly!');
    
  } catch (error) {
    console.error('❌ Supabase connection failed:');
    console.error(error.message);
    
    if (error.message.includes('Environment variable not found')) {
      console.log('\n💡 Make sure to update your .env file with actual Supabase credentials');
    }
    
    if (error.message.includes('connect ECONNREFUSED')) {
      console.log('\n💡 Check your DATABASE_URL and ensure Supabase project is active');
    }
    
  } finally {
    await prisma.$disconnect();
  }
}

testSupabaseConnection();