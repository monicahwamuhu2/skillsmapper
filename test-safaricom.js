// test-safaricom.js
require('dotenv').config();
const axios = require('axios');

async function testSafaricomCredentials() {
    console.log('🧪 Testing Safaricom API credentials...\n');
    
    const consumerKey = process.env.SAFARICOM_CONSUMER_KEY;
    const consumerSecret = process.env.SAFARICOM_CONSUMER_SECRET;
    
    console.log('📋 Using credentials:');
    console.log(`Consumer Key: ${consumerKey?.substring(0, 10)}...`);
    console.log(`Consumer Secret: ${consumerSecret?.substring(0, 10)}...`);
    
    try {
        const credentials = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
        
        console.log('\n🔑 Attempting to get access token...');
        
        const response = await axios.get('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ SUCCESS! Safaricom API credentials are working');
        console.log(`🎫 Access Token: ${response.data.access_token.substring(0, 20)}...`);
        console.log(`⏰ Expires in: ${response.data.expires_in} seconds`);
        
        return true;
        
    } catch (error) {
        console.error('❌ FAILED! Safaricom API error:');
        console.error('Status:', error.response?.status);
        console.error('Error:', error.response?.data || error.message);
        
        if (error.response?.status === 400) {
            console.log('\n💡 This might be because:');
            console.log('   • Your app in Safaricom portal is not activated');
            console.log('   • You need to subscribe to SMS API in your app dashboard');
            console.log('   • Credentials are for a different environment');
        }
        
        return false;
    }
}

// Run the test
testSafaricomCredentials();