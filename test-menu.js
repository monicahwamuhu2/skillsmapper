// test-menu.js
const menuSystem = require('./utils/menuSystem');

async function testMenuFlow() {
    console.log('🧪 Testing SMS Menu System...\n');
    
    const testPhone = '254722123456';
    
    try {
        // Test 1: Initial contact
        console.log('1️⃣ Testing initial contact...');
        await menuSystem.processMessage(testPhone, 'JOBS');
        
        // Test 2: Start skills assessment
        console.log('\n2️⃣ Testing skills assessment...');
        await menuSystem.processMessage(testPhone, '1');
        await menuSystem.processMessage(testPhone, '2'); // High School
        await menuSystem.processMessage(testPhone, '1'); // Nairobi
        await menuSystem.processMessage(testPhone, '1'); // Customer service
        
        // Test 3: Check job recommendations
        console.log('\n3️⃣ Testing job recommendations...');
        await menuSystem.processMessage(testPhone, 'JOBS');
        await menuSystem.processMessage(testPhone, '2'); // View jobs
        
        console.log('\n✅ Menu system test completed!');
        
    } catch (error) {
        console.error('❌ Menu test failed:', error);
    }
}

// Run the test
testMenuFlow();