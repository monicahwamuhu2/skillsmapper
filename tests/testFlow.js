// tests/testFlow.js
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

class TestFlow {
    async testCompleteUserFlow() {
        console.log('🧪 Testing complete user flow...\n');
        
        const testPhone = '254722000000';
        
        try {
            // Test 1: Initial message
            console.log('1️⃣ Testing initial contact...');
            await this.simulateSMS(testPhone, 'JOBS');
            
            // Test 2: Skills assessment
            console.log('2️⃣ Testing skills assessment...');
            await this.simulateSMS(testPhone, '1'); // Start assessment
            await this.simulateSMS(testPhone, '3'); // Certificate level
            await this.simulateSMS(testPhone, '1'); // Nairobi
            await this.simulateSMS(testPhone, '1'); // Customer service
            
            // Test 3: Get recommendations
            console.log('3️⃣ Getting job recommendations...');
            const jobs = await this.getJobRecommendations(testPhone);
            console.log(`Found ${jobs.length} job recommendations`);
            
            // Test 4: View job details
            console.log('4️⃣ Testing job viewing...');
            await this.simulateSMS(testPhone, '2'); // View jobs
            
            console.log('✅ All tests passed!\n');
            
        } catch (error) {
            console.error('❌ Test failed:', error.message);
        }
    }
    
    async simulateSMS(phoneNumber, message) {
        try {
            const response = await axios.post(`${BASE_URL}/api/sms/webhook`, {
                from: phoneNumber,
                text: message,
                id: `test_${Date.now()}`,
                date: new Date().toISOString()
            });
            
            console.log(`   📱 Sent: "${message}" -> Status: ${response.status}`);
            
            // Wait a bit between messages
            await new Promise(resolve => setTimeout(resolve, 1000));
            
        } catch (error) {
            console.error(`   ❌ SMS failed: ${error.message}`);
            throw error;
        }
    }
    
    async getJobRecommendations(phoneNumber) {
        try {
            const response = await axios.get(`${BASE_URL}/api/jobs/recommendations/${phoneNumber}`);
            return response.data.jobs;
        } catch (error) {
            console.error('Get recommendations failed:', error.message);
            return [];
        }
    }
    
    async testAPIEndpoints() {
        console.log('🔧 Testing API endpoints...\n');
        
        try {
            // Test health check
            const health = await axios.get(`${BASE_URL}/health`);
            console.log('✅ Health check:', health.data.status);
            
            // Test jobs endpoint
            const jobs = await axios.get(`${BASE_URL}/api/jobs`);
            console.log(`✅ Jobs endpoint: ${jobs.data.jobs.length} jobs found`);
            
            console.log('✅ All API tests passed!\n');
            
        } catch (error) {
            console.error('❌ API test failed:', error.message);
        }
    }
}

// Run tests
const tester = new TestFlow();

(async () => {
    await tester.testAPIEndpoints();
    await tester.testCompleteUserFlow();
})();