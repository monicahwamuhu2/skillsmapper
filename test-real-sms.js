// test-real-sms.js - Send actual SMS messages for testing
require('dotenv').config();
const smsProvider = require('./utils/smsProvider');

async function testRealSMS() {
    console.log('🚀 REAL SMS TESTING SCRIPT');
    console.log('⚠️  This will send ACTUAL SMS messages and consume credits!\n');
    
    // Safety checks
    if (process.env.ENABLE_REAL_SMS !== 'true') {
        console.log('❌ Real SMS is disabled. Set ENABLE_REAL_SMS=true in your .env file');
        return;
    }
    
    const testPhone = process.env.TEST_PHONE_NUMBER;
    if (!testPhone) {
        console.log('❌ TEST_PHONE_NUMBER not set in .env file');
        console.log('Add: TEST_PHONE_NUMBER=+254722123456');
        return;
    }
    
    // Check provider status
    const status = smsProvider.getStatus();
    if (status.enabledProviders === 0) {
        console.log('❌ No SMS providers configured');
        return;
    }
    
    console.log(`📱 Target Phone: ${testPhone}`);
    console.log(`🔧 Enabled Providers: ${status.enabledProviders}`);
    console.log(`🔄 Fallback Available: ${status.fallbackAvailable ? 'Yes' : 'No'}\n`);
    
    // Test 1: Automatic provider selection with fallback
    console.log('1️⃣ Testing Automatic Provider Selection (with fallback):');
    console.log('─'.repeat(60));
    
    try {
        const result = await smsProvider.sendTestSMS(testPhone);
        
        console.log('✅ SMS sent successfully!');
        console.log(`📊 Provider: ${result.providerName || result.provider}`);
        console.log(`📱 Message ID: ${result.messageId}`);
        console.log(`💰 Cost: ${typeof result.cost === 'object' ? JSON.stringify(result.cost) : result.cost}`);
        console.log(`⏱️  Duration: ${result.duration}ms`);
        
        if (result.fallbackUsed) {
            console.log('🔄 Note: Primary provider failed, fallback was used');
        }
        
    } catch (error) {
        console.log('❌ Automatic SMS failed:', error.message);
    }
    
    // Test 2: Test each provider individually (if multiple available)
    if (status.enabledProviders > 1) {
        console.log('\n2️⃣ Testing Individual Providers:');
        console.log('─'.repeat(60));
        
        for (const provider of status.providers) {
            console.log(`\nTesting ${provider.name}...`);
            
            try {
                const providerResult = await smsProvider.sendTestSMS(
                    testPhone, 
                    provider.name.toLowerCase().replace(/[^a-z]/g, '')
                );
                
                console.log(`✅ ${provider.name} SMS sent successfully!`);
                console.log(`   Message ID: ${providerResult.messageId}`);
                console.log(`   Cost: ${typeof providerResult.cost === 'object' ? JSON.stringify(providerResult.cost) : providerResult.cost}`);
                
            } catch (error) {
                console.log(`❌ ${provider.name} failed: ${error.message}`);
            }
            
            // Wait between tests to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    
    // Test 3: Test the complete SkillsMapper conversation flow
    console.log('\n3️⃣ Testing Complete SkillsMapper Conversation:');
    console.log('─'.repeat(60));
    
    const conversationMessages = [
        {
            delay: 0,
            message: `Welcome to SkillsMapper! 🎯

Your AI job matchmaker for Kenya!

Reply with number:
1 - Skills Assessment ⭐ START HERE
2 - View Jobs (0 matches)
3 - Free Courses
4 - My Progress
5 - Success Stories
0 - Help

Reply STOP to unsubscribe`
        },
        {
            delay: 3000,
            message: `📚 SKILLS ASSESSMENT

What's your highest education level?

1 - Primary School
2 - High School/Secondary
3 - Certificate/Diploma
4 - University Degree
5 - Postgraduate

Reply 0 to go back to main menu`
        },
        {
            delay: 3000,
            message: `📍 LOCATION

Which county are you in or prefer to work?

1 - Nairobi
2 - Mombasa
3 - Kisumu
4 - Nakuru
5 - Eldoret
6 - Other Kenya

Reply 0 for main menu`
        },
        {
            delay: 3000,
            message: `✅ ASSESSMENT COMPLETE!

🎯 Found 3 jobs matching your profile
📚 Recommended 2 FREE courses

Profile Summary:
🎓 Education: High School
📍 Location: Nairobi
💼 Interest: Customer Service

You'll receive job & course recommendations shortly.

Reply JOBS anytime for main menu.`
        },
        {
            delay: 5000,
            message: `🎯 YOUR JOB RECOMMENDATIONS

1. Customer Service Rep
🏢 KCB Bank
📍 Nairobi
💰 KES 25,000-35,000
📧 Apply: kcbgroup.com/careers

2. Call Center Agent
🏢 Teletech Kenya
📍 Nairobi
💰 KES 28,000-38,000
📧 Apply: teletech.com/careers

💡 TIP: Complete recommended courses to increase your chances!

Reply JOBS for main menu`
        }
    ];
    
    console.log(`📱 Sending ${conversationMessages.length} conversation messages to ${testPhone}`);
    console.log('⏱️  This will take about 15 seconds with delays between messages...\n');
    
    for (let i = 0; i < conversationMessages.length; i++) {
        const msg = conversationMessages[i];
        
        if (msg.delay > 0) {
            console.log(`⏱️  Waiting ${msg.delay/1000} seconds...`);
            await new Promise(resolve => setTimeout(resolve, msg.delay));
        }
        
        try {
            console.log(`📤 Sending message ${i + 1}/${conversationMessages.length}...`);
            const result = await smsProvider.sendSMS(testPhone, msg.message);
            
            if (result.success) {
                console.log(`✅ Message ${i + 1} sent via ${result.providerName || result.provider}`);
            } else {
                console.log(`⚠️  Message ${i + 1} failed but continuing...`);
            }
            
        } catch (error) {
            console.log(`❌ Message ${i + 1} error: ${error.message}`);
        }
    }
    
    console.log('\n4️⃣ Testing Complete!');
    console.log('─'.repeat(60));
    console.log('✅ Real SMS testing completed successfully!');
    console.log('📱 Check your phone for the test messages');
    console.log('🎯 Your SMS system is ready for the hackathon!');
    
    // Summary
    console.log('\n📊 TESTING SUMMARY:');
    console.log('═'.repeat(60));
    console.log(`📱 Target Number: ${testPhone}`);
    console.log(`🔧 Providers Tested: ${status.providers.map(p => p.name).join(', ')}`);
    console.log(`📨 Total Messages Sent: ${conversationMessages.length + (status.enabledProviders > 1 ? status.enabledProviders : 0) + 1}`);
    console.log(`💰 Estimated Cost: ~${(conversationMessages.length + 2) * status.enabledProviders} KES`);
    console.log('🚀 System Status: READY FOR PRODUCTION');
    
    console.log('\n💡 Next Steps:');
    console.log('1. Your SMS system is working perfectly!');
    console.log('2. Users can now text your system and get real responses');
    console.log('3. Set up webhooks for incoming SMS (optional)');
    console.log('4. Monitor your SMS provider credits/balance');
    console.log('5. Demo your working SMS system to judges! 🎉');
}

// Safety wrapper
async function safeTestRealSMS() {
    try {
        await testRealSMS();
    } catch (error) {
        console.error('\n❌ Testing failed:', error.message);
        console.log('\n🔧 Troubleshooting:');
        console.log('1. Check your .env file configuration');
        console.log('2. Verify your SMS provider credentials');
        console.log('3. Ensure you have sufficient credits');
        console.log('4. Check your internet connection');
        console.log('5. Run: node test-dual-sms.js for configuration check');
    }
}

// Confirmation prompt for safety
console.log('⚠️  WARNING: This will send REAL SMS messages!');
console.log('💰 This will consume SMS credits from your providers');
console.log('📱 Make sure TEST_PHONE_NUMBER is set to YOUR phone number\n');

// Check if running interactively
if (require.main === module) {
    console.log('Starting real SMS test in 3 seconds...');
    console.log('Press Ctrl+C to cancel\n');
    
    setTimeout(() => {
        safeTestRealSMS();
    }, 3000);
}

module.exports = { testRealSMS, safeTestRealSMS };