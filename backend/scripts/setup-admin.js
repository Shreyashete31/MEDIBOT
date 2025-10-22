#!/usr/bin/env node

/**
 * Admin Setup Script for HealthHub
 * Creates the initial admin user for the system
 */

const bcrypt = require('bcryptjs');
const database = require('../database/database');

async function setupAdmin() {
  try {
    console.log('🔧 Setting up admin user...');
    
    // Initialize database
    await database.initialize();
    console.log('✅ Database initialized');
    
    // Check if admin already exists
    const existingAdmin = await database.get('SELECT * FROM admin_users LIMIT 1');
    
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists');
      console.log(`   Username: ${existingAdmin.username}`);
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Role: ${existingAdmin.role}`);
      return;
    }
    
    // Create default admin user
    const adminData = {
      username: 'admin',
      email: 'admin@healthhub.com',
      password: 'admin123', // In production, this should be more secure
      role: 'super_admin'
    };
    
    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(adminData.password, saltRounds);
    
    // Insert admin user
    await database.run(`
      INSERT INTO admin_users (username, email, password_hash, role, created_at, updated_at)
      VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
    `, [adminData.username, adminData.email, passwordHash, adminData.role]);
    
    console.log('✅ Admin user created successfully!');
    console.log('📋 Admin Credentials:');
    console.log(`   Username: ${adminData.username}`);
    console.log(`   Email: ${adminData.email}`);
    console.log(`   Password: ${adminData.password}`);
    console.log(`   Role: ${adminData.role}`);
    console.log('');
    console.log('⚠️  IMPORTANT: Change the default password after first login!');
    console.log('🌐 Access admin dashboard at: http://localhost:3001/admin.html');
    
  } catch (error) {
    console.error('❌ Error setting up admin user:', error);
    process.exit(1);
  } finally {
    await database.close();
    console.log('🔒 Database connection closed');
  }
}

// Run setup if called directly
if (require.main === module) {
  setupAdmin();
}

module.exports = setupAdmin;

