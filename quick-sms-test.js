// quick-sms-test.js - Test the fixed SMS providers
require('dotenv').config();

async function testSafaricomDirectly() {
    console.log('🧪 Testing Safaricom SMS API Directly\n');
    
    const axios = require('axios');
    
    try {
        // Get access token
        const consumerKey = process.env.SAFARICOM_CONSUMER_KEY;
        const consumerSecret = process.env.SAFARICOM_CONSUMER_SECRET;
        const credentials = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
        
        console.log('🔑 Getting access token...');
        const tokenResponse = await axios.get(
            'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
            {
                headers: {
                    'Authorization': `Basic ${credentials}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        const accessToken = tokenResponse.data.access_token;
        console.log('✅ Token obtained successfully\n');
        
        // Try different SMS endpoints
        const endpoints = [
            'https://sandbox.safaricom.co.ke/v1/sms/send',
            'https://sandbox.safaricom.co.ke/v3/sms/send',
            'https://sandbox.safaricom.co.ke/sms/v1/send'
        ];
        
        const testPayloads = [
            {
                from: '600000', // Default sandbox shortcode
                to: '254717192945',
                text: 'Test SMS from SkillsMapper'
            },
            {
                from: process.env.SAFARICOM_SHORTCODE || '174379',
                to: '254717192945',
                text: 'Test SMS from SkillsMapper'
            }
        ];
        
        for (const endpoint of endpoints) {
            for (const payload of testPayloads) {
                console.log(`📤 Testing: ${endpoint}`);
                console.log(`📋 Payload: From ${payload.from} to ${payload.to}`);
                
                try {
                    const response = await axios.post(endpoint, payload, {
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                            'Content-Type': 'application/json'
                        },
                        timeout: 10000
                    });
                    
                    console.log('✅ SUCCESS!', response.data);
                    console.log('🎉 Found working endpoint!\n');
                    return;
                    
                } catch (error) {
                    console.log(`❌ Failed: ${error.response?.status} - ${error.response?.data?.errorMessage || error.message}`);
                }
            }
        }
        
        console.log('\n❌ All endpoints failed');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

async function testAfricasTalkingDirectly() {
    console.log('\n🧪 Testing Africa\'s Talking SMS API Directly\n');
    
    try {
        const AfricasTalking = require('africastalking');
        
        const client = AfricasTalking({
            apiKey: process.env.AFRICASTALKING_API_KEY,
            username: process.env.AFRICASTALKING_USERNAME || 'sandbox'
        });
        
        console.log('📤 Testing Africa\'s Talking SMS...');
        
        // Test without sender ID (sandbox mode)
        console.log('1️⃣ Testing without sender ID (recommended for sandbox)...');
        try {
            const response1 = await client.SMS.send({
                to: ['+254717192945'],
                message: 'Test SMS from SkillsMapper via Africa\'s Talking'
            });
            
            console.log('✅ SUCCESS without sender ID!', response1);
            return;
            
        } catch (error) {
            console.log('❌ Failed without sender ID:', error.message);
        }
        
        // Test with sender ID
        console.log('2️⃣ Testing with sender ID...');
        try {
            const response2 = await client.SMS.send({
                to: ['+254717192945'],
                message: 'Test SMS from SkillsMapper via Africa\'s Talking',
                from: 'SKILLSMAP'
            });
            
            console.log('✅ SUCCESS with sender ID!', response2);
            
        } catch (error) {
            console.log('❌ Failed with sender ID:', error.message);
        }
        
    } catch (error) {
        console.error('❌ Africa\'s Talking test failed:', error.message);
    }
}

async function testBothProviders() {
    console.log('🚀 SkillsMapper SMS Provider Direct Test\n');
    console.log('Testing both Safaricom and Africa\'s Talking APIs directly\n');
    console.log('='.repeat(60));
    
    await testSafaricomDirectly();
    await testAfricasTalkingDirectly();
    
    console.log('\n' + '='.repeat(60));
    console.log('🎯 Direct API tests complete!');
    console.log('='.repeat(60));
}

// Run the tests
testBothProviders();