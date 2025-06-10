// test-db.js
const db = require('./config/database');

async function testDatabase() {
    console.log('🧪 Testing SQLite database...\n');
    
    try {
        // Wait a bit for database to initialize
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Test 1: Check jobs
        console.log('1️⃣ Testing jobs table...');
        const jobs = await db.query('SELECT * FROM jobs LIMIT 3');
        console.log(`   Found ${jobs.length} jobs`);
        if (jobs.length > 0) {
            console.log(`   Sample: ${jobs[0].title} at ${jobs[0].company}`);
        }
        
        // Test 2: Check certifications
        console.log('\n2️⃣ Testing certifications table...');
        const certs = await db.query('SELECT * FROM certifications LIMIT 3');
        console.log(`   Found ${certs.length} certifications`);
        if (certs.length > 0) {
            console.log(`   Sample: ${certs[0].name} by ${certs[0].provider}`);
        }
        
        // Test 3: Test user operations
        console.log('\n3️⃣ Testing user operations...');
        const testPhone = '254722000000';
        
        // Create test user
        await db.run(
            `INSERT OR REPLACE INTO users 
            (phone_number, education_level, location, interests, profile_completed) 
            VALUES (?, ?, ?, ?, ?)`,
            [testPhone, 'High School', 'Nairobi', 'customer service', 1]
        );
        
        // Retrieve test user
        const user = await db.get('SELECT * FROM users WHERE phone_number = ?', [testPhone]);
        console.log(`   Created user: ${user.phone_number} from ${user.location}`);
        
        // Test 4: Test job matching
        console.log('\n4️⃣ Testing job matching...');
        const nairobiJobs = await db.query(
            'SELECT * FROM jobs WHERE location = ? OR location = "Remote" LIMIT 3',
            ['Nairobi']
        );
        console.log(`   Found ${nairobiJobs.length} jobs in Nairobi/Remote`);
        
        console.log('\n✅ All database tests passed!');
        console.log('\n🚀 Your database is ready for the SMS system!');
        
    } catch (error) {
        console.error('❌ Database test failed:', error);
    }
}

// Run the test
testDatabase();