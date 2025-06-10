// test-dual-sms.js - Test both SMS providers with fallback
require('dotenv').config();
const smsProvider = require('./utils/smsProvider');

async function testDualSMSSystem() {
    console.log('🧪 Testing Dual SMS Provider System (Africa\'s Talking + Safaricom)...\n');
    
    // Test 1: Show current configuration
    console.log('1️⃣ Current Configuration:');
    console.log('─'.repeat(50));
    const status = smsProvider.getStatus();
    console.log(`Real SMS: ${status.realSMSEnabled ? '✅ ENABLED' : '❌ DISABLED'}`);
    console.log(`Environment: ${status.environment}`);
    console.log(`Total Providers: ${status.totalProviders}`);
    console.log(`Enabled Providers: ${status.enabledProviders}`);
    console.log(`Fallback Available: ${status.fallbackAvailable ? '✅ YES' : '❌ NO'}`);
    
    if (status.providers.length > 0) {
        console.log('\nProvider Priority Order:');
        status.providers.forEach((provider, index) => {
            console.log(`  ${index + 1}. ${provider.name} (Priority ${provider.priority})`);
        });
    }
    
    // Test 2: Test provider configurations
    console.log('\n2️⃣ Testing Provider Configurations:');
    console.log('─'.repeat(50));
    const testResults = await smsProvider.testProviders();
    
    // Test 3: Environment variables check
    console.log('\n3️⃣ Environment Variables:');
    console.log('─'.repeat(50));
    console.log(`ENABLE_REAL_SMS: ${process.env.ENABLE_REAL_SMS}`);
    console.log(`AFRICASTALKING_USERNAME: ${process.env.AFRICASTALKING_USERNAME || 'NOT SET'}`);
    console.log(`AFRICASTALKING_API_KEY: ${process.env.AFRICASTALKING_API_KEY ? 'SET (' + process.env.AFRICASTALKING_API_KEY.substring(0, 10) + '...)' : 'NOT SET'}`);
    console.log(`SAFARICOM_CONSUMER_KEY: ${process.env.SAFARICOM_CONSUMER_KEY ? 'SET (' + process.env.SAFARICOM_CONSUMER_KEY.substring(0, 10) + '...)' : 'NOT SET'}`);
    console.log(`SAFARICOM_CONSUMER_SECRET: ${process.env.SAFARICOM_CONSUMER_SECRET ? 'SET (' + process.env.SAFARICOM_CONSUMER_SECRET.substring(0, 10) + '...)' : 'NOT SET'}`);
    
    // Test 4: Demo SMS (always works)
    console.log('\n4️⃣ Testing Demo SMS:');
    console.log('─'.repeat(50));
    const testPhone = process.env.TEST_PHONE_NUMBER || '+254722123456';
    const demoMessage = `🎯 SkillsMapper Demo

This is a test of your dual SMS provider system!

Features:
✅ Africa's Talking (Primary)
✅ Safaricom (Fallback)  
✅ Demo mode for testing

Time: ${new Date().toLocaleTimeString()}`;

    try {
        const result = await smsProvider.sendSMS(testPhone, demoMessage);
        console.log('📊 Demo SMS Result:');
        console.log(`   Success: ${result.success}`);
        console.log(`   Mode: ${result.mode}`);
        console.log(`   Provider: ${result.provider}`);
        if (result.fallbackUsed) {
            console.log(`   ⚠️ Fallback was used!`);
        }
        if (result.error) {
            console.log(`   Error: ${result.error}`);
        }
    } catch (error) {
        console.log('❌ Demo SMS failed:', error.message);
    }
    
    // Test 5: Real SMS test (only if enabled and user confirms)
    if (process.env.ENABLE_REAL_SMS === 'true' && status.enabledProviders > 0) {
        console.log('\n5️⃣ Real SMS Test Available:');
        console.log('─'.repeat(50));
        console.log('⚠️  REAL SMS TESTING IS ENABLED!');
        console.log('⚠️  This will send actual SMS messages and consume credits.');
        console.log('\nTo test real SMS sending:');
        console.log('1. Set TEST_PHONE_NUMBER in your .env file');
        console.log('2. Run: node test-real-sms.js');
        console.log('\nOr call manually in code:');
        console.log('await smsProvider.sendTestSMS("+254722123456");');
    } else {
        console.log('\n5️⃣ Real SMS Test:');
        console.log('─'.repeat(50));
        console.log('❌ Real SMS is disabled or no providers configured');
        console.log('To enable real SMS:');
        console.log('1. Set ENABLE_REAL_SMS=true');
        console.log('2. Configure at least one provider (Africa\'s Talking or Safaricom)');
    }
    
    // Summary
    console.log('\n📊 TEST SUMMARY:');
    console.log('═'.repeat(60));
    
    const workingProviders = Object.entries(testResults)
        .filter(([_, result]) => result.status.includes('✅'))
        .map(([name, _]) => name);
    
    if (workingProviders.length > 0) {
        console.log(`✅ Working Providers: ${workingProviders.join(', ')}`);
        console.log(`🔄 Fallback System: ${workingProviders.length > 1 ? 'Available' : 'Single provider only'}`);
        
        if (process.env.ENABLE_REAL_SMS === 'true') {
            console.log('🚀 Your SMS system is READY for real messages!');
        } else {
            console.log('🧪 Your SMS system is ready for demo mode');
            console.log('💡 Set ENABLE_REAL_SMS=true to send real SMS');
        }
    } else {
        console.log('❌ No working SMS providers found');
        console.log('🔧 Configure at least one provider:');
        console.log('   • Africa\'s Talking: Set AFRICASTALKING_USERNAME and AFRICASTALKING_API_KEY');
        console.log('   • Safaricom: Set SAFARICOM_CONSUMER_KEY and SAFARICOM_CONSUMER_SECRET');
    }
    
    console.log('\n🎯 Your SkillsMapper SMS system is ready for the hackathon!');
    console.log('═'.repeat(60));
}

// Run the comprehensive test
testDualSMSSystem().catch(console.error);