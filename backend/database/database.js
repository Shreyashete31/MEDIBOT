const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const config = require('../config/environment');

class Database {
  constructor() {
    this.db = null;
    this.isConnected = false;
  }

  async initialize() {
    try {
      // Ensure database directory exists
      const dbDir = path.dirname(config.database.path);
      const fs = require('fs');
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      // Connect to database
      this.db = new sqlite3.Database(config.database.path, (err) => {
        if (err) {
          console.error('Error opening database:', err.message);
          throw err;
        }
        console.log('Connected to SQLite database');
        this.isConnected = true;
      });

      // Enable foreign keys
      await this.run('PRAGMA foreign_keys = ON');
      
      // Create tables
      await this.createTables();
      
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    }
  }

  async createTables() {
    const tables = [
      // Users table
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(100),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Remedies table
      `CREATE TABLE IF NOT EXISTS remedies (
        id VARCHAR(50) PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        description TEXT NOT NULL,
        category VARCHAR(50) NOT NULL,
        difficulty VARCHAR(20) NOT NULL CHECK(difficulty IN ('easy', 'medium', 'hard')),
        rating DECIMAL(2,1) DEFAULT 4.0 CHECK(rating >= 0 AND rating <= 5),
        prep_time VARCHAR(50) NOT NULL,
        ingredients TEXT NOT NULL, -- JSON array
        instructions TEXT NOT NULL, -- JSON array
        benefits TEXT NOT NULL,
        warnings TEXT NOT NULL,
        image VARCHAR(10), -- Emoji or image reference
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // First Aid table
      `CREATE TABLE IF NOT EXISTS first_aid (
        id VARCHAR(50) PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        category VARCHAR(50) NOT NULL,
        emergency BOOLEAN DEFAULT 0,
        description TEXT NOT NULL,
        steps TEXT NOT NULL, -- JSON array
        warnings TEXT NOT NULL,
        severity VARCHAR(20) NOT NULL CHECK(severity IN ('low', 'medium', 'high', 'critical')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Symptoms table
      `CREATE TABLE IF NOT EXISTS symptoms (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        severity VARCHAR(20) NOT NULL CHECK(severity IN ('low', 'medium', 'high')),
        description TEXT NOT NULL,
        common_causes TEXT NOT NULL, -- JSON array
        recommendations TEXT NOT NULL, -- JSON array
        when_to_see_doctor TEXT NOT NULL, -- JSON array
        related_remedies TEXT, -- JSON array of remedy IDs
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // User Favorites table
      `CREATE TABLE IF NOT EXISTS user_favorites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        remedy_id VARCHAR(50),
        first_aid_id VARCHAR(50),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (remedy_id) REFERENCES remedies(id) ON DELETE CASCADE,
        FOREIGN KEY (first_aid_id) REFERENCES first_aid(id) ON DELETE CASCADE,
        UNIQUE(user_id, remedy_id),
        UNIQUE(user_id, first_aid_id),
        CHECK((remedy_id IS NOT NULL AND first_aid_id IS NULL) OR 
              (remedy_id IS NULL AND first_aid_id IS NOT NULL))
      )`,

      // Emergency Contacts table
      `CREATE TABLE IF NOT EXISTS emergency_contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        relation VARCHAR(50),
        is_favorite BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`,

      // User Medical Info table
      `CREATE TABLE IF NOT EXISTS user_medical_info (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL UNIQUE,
        blood_type VARCHAR(10),
        allergies TEXT,
        medications TEXT,
        medical_conditions TEXT,
        emergency_contact VARCHAR(100),
        emergency_phone VARCHAR(20),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`,

      // Search History table
      `CREATE TABLE IF NOT EXISTS search_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        search_term VARCHAR(200) NOT NULL,
        search_type VARCHAR(20) NOT NULL CHECK(search_type IN ('remedy', 'first_aid', 'symptom')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`,

      // Chat History table
      `CREATE TABLE IF NOT EXISTS chat_history (
        id VARCHAR(50) PRIMARY KEY,
        user_id VARCHAR(100) NOT NULL,
        user_message TEXT NOT NULL,
        bot_response TEXT NOT NULL,
        suggested_remedies TEXT, -- JSON array
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Quiz Results table
      `CREATE TABLE IF NOT EXISTS quiz_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id VARCHAR(100) NOT NULL,
        quiz_type VARCHAR(50) NOT NULL,
        score INTEGER NOT NULL,
        total_questions INTEGER NOT NULL,
        answers TEXT NOT NULL, -- JSON object
        completed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Admin Users table
      `CREATE TABLE IF NOT EXISTS admin_users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'admin' CHECK(role IN ('admin', 'super_admin')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    for (const table of tables) {
      await this.run(table);
    }

    console.log('✅ Database tables created successfully');
  }

  // Database operation methods
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  }

  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async close() {
    if (this.db && this.isConnected) {
      return new Promise((resolve, reject) => {
        this.db.close((err) => {
          if (err) {
            reject(err);
          } else {
            this.isConnected = false;
            console.log('Database connection closed');
            resolve();
          }
        });
      });
    }
  }

  // Health check
  async healthCheck() {
    try {
      const result = await this.get('SELECT 1 as healthy');
      return result && result.healthy === 1;
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
const database = new Database();
module.exports = database;
