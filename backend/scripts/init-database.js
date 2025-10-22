#!/usr/bin/env node

const database = require('../database/database');
const { seedDatabase } = require('../database/seed-data');

async function initializeDatabase() {
  try {
    console.log('🚀 Initializing HealthHub Database...');
    
    // Initialize database
    await database.initialize();
    
    // Seed with sample data
    await seedDatabase();
    
    console.log('✅ Database initialization completed successfully!');
    console.log('\n📊 Database Statistics:');
    
    // Get counts
    const remedyCount = await database.get('SELECT COUNT(*) as count FROM remedies');
    const firstAidCount = await database.get('SELECT COUNT(*) as count FROM first_aid');
    const symptomCount = await database.get('SELECT COUNT(*) as count FROM symptoms');
    
    console.log(`   • Remedies: ${remedyCount.count}`);
    console.log(`   • First Aid Instructions: ${firstAidCount.count}`);
    console.log(`   • Symptoms: ${symptomCount.count}`);
    
    console.log('\n🎯 Next Steps:');
    console.log('   1. Start the server: npm start');
    console.log('   2. Test the API: http://localhost:3001/api/remedies');
    console.log('   3. Check health: http://localhost:3001/health');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  } finally {
    await database.close();
  }
}

// Run if called directly
if (require.main === module) {
  initializeDatabase();
}

module.exports = initializeDatabase;
