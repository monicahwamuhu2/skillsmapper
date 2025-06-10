// config/database.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create database file in project folder
const dbPath = path.join(__dirname, '../database/skillsmapper.db');

class Database {
    constructor() {
        this.db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('Database connection error:', err);
            } else {
                console.log('✅ Connected to SQLite database');
                this.initializeTables();
            }
        });
    }

    async initializeTables() {
        console.log('🔧 Creating database tables...');
        
        // Create all tables
        const tables = [
            `CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                phone_number TEXT UNIQUE NOT NULL,
                education_level TEXT,
                location TEXT,
                interests TEXT,
                profile_completed BOOLEAN DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            
            `CREATE TABLE IF NOT EXISTS jobs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                company TEXT NOT NULL,
                location TEXT,
                salary_min INTEGER,
                salary_max INTEGER,
                description TEXT,
                required_skills TEXT,
                education_requirement TEXT,
                application_url TEXT,
                is_active BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            
            `CREATE TABLE IF NOT EXISTS certifications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                provider TEXT NOT NULL,
                duration_weeks INTEGER,
                skills_taught TEXT,
                certification_url TEXT,
                difficulty_level TEXT DEFAULT 'Beginner',
                is_free BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            
            `CREATE TABLE IF NOT EXISTS sms_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                phone_number TEXT NOT NULL,
                current_step TEXT DEFAULT 'welcome',
                session_data TEXT,
                last_message TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                expires_at DATETIME DEFAULT (datetime('now', '+30 minutes'))
            )`,
            
            `CREATE TABLE IF NOT EXISTS sms_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                phone_number TEXT,
                message_type TEXT,
                message_content TEXT,
                status TEXT DEFAULT 'success',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            
            `CREATE TABLE IF NOT EXISTS user_job_matches (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_phone TEXT,
                job_id INTEGER,
                match_score INTEGER,
                viewed BOOLEAN DEFAULT 0,
                applied BOOLEAN DEFAULT 0,
                recommended_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (job_id) REFERENCES jobs (id)
            )`,
            
            `CREATE TABLE IF NOT EXISTS user_cert_recommendations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_phone TEXT,
                certification_id INTEGER,
                priority_score INTEGER,
                status TEXT DEFAULT 'recommended',
                recommended_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (certification_id) REFERENCES certifications (id)
            )`
        ];

        for (const table of tables) {
            await this.runQuery(table);
        }

        // Insert sample data
        await this.insertSampleData();
        console.log('✅ Database setup complete');
    }

    runQuery(sql, params = []) {
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

    async insertSampleData() {
        console.log('📊 Inserting sample data...');
        
        // Check if data already exists
        const existingJobs = await this.query('SELECT COUNT(*) as count FROM jobs');
        if (existingJobs[0].count > 0) {
            console.log('Sample data already exists, skipping...');
            return;
        }

        // Sample jobs
        const jobs = [
            ['Customer Service Representative', 'KCB Bank', 'Nairobi', 25000, 35000, 'Handle customer inquiries and provide excellent service', 'communication,customer service,computer literacy', 'High School', 'https://kcbgroup.com/careers'],
            ['Sales Agent', 'Safaricom', 'Mombasa', 30000, 45000, 'Sell products and services to customers', 'sales,communication,target achievement', 'Certificate', 'https://safaricom.co.ke/careers'],
            ['Data Entry Clerk', 'Kenya Red Cross', 'Kisumu', 20000, 30000, 'Enter and manage data accurately', 'computer literacy,data entry,attention to detail', 'High School', 'https://redcross.or.ke/jobs'],
            ['Security Guard', 'G4S Kenya', 'Nakuru', 18000, 25000, 'Provide security services', 'security,vigilance,physical fitness', 'Primary', 'https://g4s.co.ke/careers'],
            ['Teaching Assistant', 'Bridge International', 'Eldoret', 22000, 32000, 'Assist teachers in classroom activities', 'teaching,communication,patience', 'Certificate', 'https://bridgeinternationalacademies.com/careers'],
            ['Motorcycle Taxi Driver', 'Uber Boda', 'Nairobi', 35000, 50000, 'Provide motorcycle taxi services', 'driving,navigation,customer service', 'Primary', 'https://uber.com/ke/drive/'],
            ['Call Center Agent', 'Teletech Kenya', 'Nairobi', 28000, 38000, 'Handle customer calls and support', 'communication,computer literacy,problem solving', 'High School', 'https://teletech.com/careers'],
            ['Farm Worker', 'Del Monte Kenya', 'Thika', 15000, 22000, 'Agricultural work and crop management', 'agriculture,physical fitness,teamwork', 'Primary', 'https://freshdelmonte.com/careers']
        ];

        const jobQuery = `INSERT INTO jobs 
            (title, company, location, salary_min, salary_max, description, required_skills, education_requirement, application_url) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        for (const job of jobs) {
            await this.runQuery(jobQuery, job);
        }

        // Sample certifications
        const certs = [
            ['Google Digital Skills for Africa', 'Google', 4, 'digital marketing,online presence,e-commerce', 'https://learndigital.withgoogle.com/digitalskills', 'Beginner'],
            ['Microsoft Office Specialist', 'Microsoft', 6, 'microsoft office,excel,word,powerpoint', 'https://www.microsoft.com/learning', 'Beginner'],
            ['Customer Service Excellence', 'Coursera', 3, 'customer service,communication,problem solving', 'https://coursera.org/customer-service', 'Beginner'],
            ['Basic Computer Skills', 'Khan Academy', 2, 'computer literacy,internet basics,email', 'https://khanacademy.org/computing', 'Beginner'],
            ['English Communication', 'FutureLearn', 4, 'english,communication,writing', 'https://futurelearn.com/courses/english-communication', 'Beginner'],
            ['Financial Literacy', 'edX', 3, 'finance,budgeting,saving', 'https://edx.org/course/financial-literacy', 'Beginner'],
            ['Digital Marketing Fundamentals', 'Google', 8, 'digital marketing,social media,seo', 'https://skillshop.exceedlms.com/student/catalog', 'Intermediate'],
            ['Data Entry Skills', 'Alison', 2, 'data entry,typing,accuracy', 'https://alison.com/course/data-entry-skills', 'Beginner']
        ];

        const certQuery = `INSERT INTO certifications 
            (name, provider, duration_weeks, skills_taught, certification_url, difficulty_level) 
            VALUES (?, ?, ?, ?, ?, ?)`;

        for (const cert of certs) {
            await this.runQuery(certQuery, cert);
        }

        console.log('✅ Sample data inserted successfully');
    }

    // Simple query method
    query(sql, params = []) {
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

    // Simple run method for INSERT/UPDATE/DELETE
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

    // Get single row
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

    // Close database connection
    close() {
        return new Promise((resolve, reject) => {
            this.db.close((err) => {
                if (err) {
                    reject(err);
                } else {
                    console.log('Database connection closed');
                    resolve();
                }
            });
        });
    }
}

module.exports = new Database();