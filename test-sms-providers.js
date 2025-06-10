// test-sms-providers.js - Comprehensive SMS Provider Diagnostics
require('dotenv').config();
const smsProvider = require('./utils/smsProvider');

class SMSDiagnostic {
    async runFullDiagnostic() {
        console.log('🧪 SkillsMapper SMS Provider Diagnostic Tool');
        console.log('='.repeat(60));
        console.log(`📅 ${new Date().toLocaleString()}`);
        console.log('='.repeat(60) + '\n');

        await this.checkEnvironment();
        await this.testProviderConfigurations();
        await this.testPhoneNumberFormatting();
        await this.simulateRealSMS();
        
        console.log('\n' + '='.repeat(60));
        console.log('🎯 DIAGNOSTIC COMPLETE');
        console.log('='.repeat(60));
    }

    async checkEnvironment() {
        console.log('1️⃣ ENVIRONMENT CHECK\n');
        
        const envVars = [
            'NODE_ENV',
            'ENABLE_REAL_SMS',
            'SMS_SENDER_ID',
            'SAFARICOM_CONSUMER_KEY',
            'SAFARICOM_CONSUMER_SECRET',
            'AFRICASTALKING_USERNAME',
            'AFRICASTALKING_API_KEY'
        ];

        envVars.forEach(varName => {
            const value = process.env[varName];
            const status = value ? '✅' : '❌';
            const display = value ? 
                (varName.includes('KEY') || varName.includes('SECRET') ? 
                    value.substring(0, 8) + '...' : value) : 
                'Not set';
            
            console.log(`   ${status} ${varName}: ${display}`);
        });

        console.log(`\n   🔧 Real SMS Mode: ${process.env.ENABLE_REAL_SMS === 'true' ? '✅ ENABLED' : '❌ DISABLED'}`);
        console.log(`   🌍 Environment: ${process.env.NODE_ENV || 'development'}\n`);
    }

    async testProviderConfigurations() {
        console.log('2️⃣ PROVIDER CONFIGURATION TEST\n');
        
        try {
            const results = await smsProvider.testProviders();
            
            Object.entries(results).forEach(([provider, result]) => {
                console.log(`   ${result.status} ${provider.toUpperCase()}: ${result.error || 'Ready to send SMS'}`);
                
                if (result.error) {
                    console.log(`      Error: ${result.error}`);
                }
            });
            
        } catch (error) {
            console.log(`   ❌ Provider test failed: ${error.message}`);
        }
        
        console.log();
    }

    async testPhoneNumberFormatting() {
        console.log('3️⃣ PHONE NUMBER FORMATTING TEST\n');
        
        const testNumbers = [
            '254717192945',    // Your number
            '+254717192945',   // International format
            '0717192945',      // Local format
            '717192945',       // Short format
            '254722123456',    // Different network
            '0722123456'       // Different network local
        ];

        testNumbers.forEach(number => {
            try {
                const formatted = this.formatTestNumber(number);
                console.log(`   ✅ ${number.padEnd(15)} → ${formatted}`);
            } catch (error) {
                console.log(`   ❌ ${number.padEnd(15)} → Error: ${error.message}`);
            }
        });
        
        console.log();
    }

    formatTestNumber(phoneNumber) {
        // Replicating the formatting logic from smsProvider
        let cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '');
        cleaned = cleaned.replace(/^\+/, '');
        
        if (cleaned.startsWith('0')) {
            cleaned = '254' + cleaned.substring(1);
        } else if (cleaned.startsWith('7') || cleaned.startsWith('1')) {
            cleaned = '254' + cleaned;
        } else if (!cleaned.startsWith('254')) {
            cleaned = '254' + cleaned;
        }
        
        if (!/^254[71]\d{8}$/.test(cleaned)) {
            throw new Error('Invalid format - must be Kenyan mobile number');
        }
        
        return cleaned;
    }

    async simulateRealSMS() {
        console.log('4️⃣ SMS SIMULATION TEST\n');
        
        const testPhone = '254717192945'; // Your number
        const testMessage = 'SkillsMapper SMS test message 📱✅';
        
        console.log(`   📱 Test Number: ${testPhone}`);
        console.log(`   📝 Test Message: "${testMessage}"`);
        console.log(`   📊 Message Length: ${testMessage.length} chars\n`);
        
        try {
            console.log('   🚀 Attempting to send test SMS...\n');
            
            const result = await smsProvider.sendSMS(testPhone, testMessage);
            
            console.log(`   📋 RESULT SUMMARY:`);
            console.log(`   ✅ Status: ${result.success ? 'Success' : 'Failed'}`);
            console.log(`   🔧 Mode: ${result.mode}`);
            console.log(`   📡 Provider: ${result.provider}`);
            console.log(`   🔄 Fallback Used: ${result.fallbackUsed ? 'Yes' : 'No'}`);
            
            if (result.messageId) {
                console.log(`   📧 Message ID: ${result.messageId}`);
            }
            
            if (result.cost) {
                console.log(`   💰 Estimated Cost: ${result.cost.estimatedCostKES} KES`);
            }
            
            if (result.error) {
                console.log(`   ⚠️ Error: ${result.error}`);
            }
            
            if (result.warning) {
                console.log(`   ⚠️ Warning: ${result.warning}`);
            }
            
        } catch (error) {
            console.log(`   ❌ Test failed: ${error.message}`);
        }
        
        console.log();
    }

    async quickSafaricomTest() {
        console.log('🔑 QUICK SAFARICOM AUTHENTICATION TEST\n');
        
        const consumerKey = process.env.SAFARICOM_CONSUMER_KEY;
        const consumerSecret = process.env.SAFARICOM_CONSUMER_SECRET;
        
        if (!consumerKey || !consumerSecret) {
            console.log('❌ Safaricom credentials not configured');
            return;
        }
        
        try {
            const axios = require('axios');
            const credentials = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
            
            console.log('🔑 Testing Safaricom authentication...');
            
            const response = await axios.get(
                'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
                {
                    headers: {
                        'Authorization': `Basic ${credentials}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 10000
                }
            );
            
            console.log('✅ Safaricom authentication successful!');
            console.log(`📊 Token received: ${response.data.access_token.substring(0, 20)}...`);
            console.log(`⏰ Expires in: ${response.data.expires_in} seconds`);
            
        } catch (error) {
            console.log('❌ Safaricom authentication failed');
            console.log(`Status: ${error.response?.status}`);
            console.log(`Error: ${error.response?.data?.error_description || error.message}`);
            
            if (error.response?.status === 400) {
                console.log('\n💡 Common solutions:');
                console.log('   • Check Consumer Key and Secret are correct');
                console.log('   • Ensure app is activated in Safaricom portal');
                console.log('   • Subscribe to SMS API in your app dashboard');
            }
        }
    }
}

// Command line interface
const args = process.argv.slice(2);
const diagnostic = new SMSDiagnostic();

if (args.includes('--safaricom-only')) {
    diagnostic.quickSafaricomTest();
} else {
    diagnostic.runFullDiagnostic();
}