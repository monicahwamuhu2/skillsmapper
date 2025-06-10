// utils/smsProvider.js - Enhanced SMS Provider with Dual Provider Support
const axios = require('axios');

class SMSProvider {
    constructor() {
        this.enableRealSMS = process.env.ENABLE_REAL_SMS === 'true';
        this.isDevelopment = process.env.NODE_ENV === 'development';
        
        // Provider configurations with priority order
        this.providers = {
            africastalking: {
                name: "Africa's Talking",
                enabled: !!(process.env.AFRICASTALKING_USERNAME && process.env.AFRICASTALKING_API_KEY),
                priority: 1 // Try Africa's Talking first (more reliable)
            },
            safaricom: {
                name: 'Safaricom',
                enabled: !!(process.env.SAFARICOM_CONSUMER_KEY && process.env.SAFARICOM_CONSUMER_SECRET),
                priority: 2 // Safaricom as fallback
            }
        };
        
        // Cache for tokens
        this.tokenCache = {
            safaricom: {
                token: null,
                expiry: null
            }
        };
        
        this.logProviderStatus();
    }

    logProviderStatus() {
        console.log(`\n📱 SMS Provider System Initialized:`);
        console.log(`   Mode: ${this.enableRealSMS ? '🚀 REAL SMS' : '🧪 DEMO ONLY'}`);
        console.log(`   Environment: ${this.isDevelopment ? 'Development' : 'Production'}`);
        console.log(`   Africa's Talking: ${this.providers.africastalking.enabled ? '✅ Ready' : '❌ Missing credentials'}`);
        console.log(`   Safaricom: ${this.providers.safaricom.enabled ? '✅ Ready' : '❌ Missing credentials'}`);
        
        const enabledProviders = Object.entries(this.providers)
            .filter(([_, config]) => config.enabled)
            .map(([name, config]) => `${config.name} (Priority ${config.priority})`)
            .join(', ');
            
        console.log(`   Active Providers: ${enabledProviders || 'None - Demo mode only'}`);
        console.log('');
    }

    async sendSMS(phoneNumber, message) {
        // Always show demo SMS for development visibility
        this.logDemoSMS(phoneNumber, message);
        
        const result = {
            success: true,
            mode: this.enableRealSMS ? 'real' : 'demo',
            provider: 'demo',
            to: phoneNumber,
            message: message,
            timestamp: new Date().toISOString(),
            fallbackUsed: false
        };

        // Try real SMS if enabled
        if (this.enableRealSMS) {
            console.log(`🚀 Real SMS mode enabled - attempting to send via providers...`);
            
            try {
                const realResult = await this.sendWithFallback(phoneNumber, message);
                return { ...result, ...realResult };
            } catch (error) {
                console.error('❌ All real SMS providers failed:', error.message);
                console.log('🔄 Continuing with demo mode for platform stability');
                
                return {
                    ...result,
                    mode: 'demo_fallback',
                    error: error.message,
                    warning: 'Real SMS failed - check provider configurations'
                };
            }
        }

        console.log('🧪 Demo mode - no real SMS sent');
        return result;
    }

    async sendWithFallback(phoneNumber, message) {
        // Get enabled providers sorted by priority
        const providers = Object.entries(this.providers)
            .filter(([_, config]) => config.enabled)
            .sort(([_, a], [__, b]) => a.priority - b.priority);

        if (providers.length === 0) {
            throw new Error('No SMS providers configured');
        }

        let lastError = null;
        const attemptResults = [];
        
        for (const [providerName, config] of providers) {
            try {
                console.log(`🔄 Attempting ${config.name} (Priority ${config.priority})...`);
                
                const startTime = Date.now();
                const result = await this.sendWithProvider(providerName, phoneNumber, message);
                const duration = Date.now() - startTime;
                
                console.log(`✅ ${config.name} SMS sent successfully in ${duration}ms!`);
                console.log(`📊 Result:`, {
                    messageId: result.messageId,
                    cost: result.cost,
                    status: result.status
                });
                
                return {
                    success: true,
                    provider: providerName,
                    providerName: config.name,
                    fallbackUsed: providers.indexOf([providerName, config]) > 0,
                    duration: duration,
                    attemptResults: attemptResults,
                    ...result
                };
                
            } catch (error) {
                const errorDetails = {
                    provider: providerName,
                    error: error.message,
                    timestamp: new Date().toISOString()
                };
                
                attemptResults.push(errorDetails);
                console.error(`❌ ${config.name} failed: ${error.message}`);
                lastError = error;
                
                // Continue to next provider
                continue;
            }
        }
        
        // All providers failed
        throw new Error(`All SMS providers failed. Attempts: ${attemptResults.length}. Last error: ${lastError?.message}`);
    }

    async sendWithProvider(provider, phoneNumber, message) {
        switch (provider) {
            case 'africastalking':
                return await this.sendAfricasTalking(phoneNumber, message);
            case 'safaricom':
                return await this.sendSafaricom(phoneNumber, message);
            default:
                throw new Error(`Unknown provider: ${provider}`);
        }
    }

    async sendAfricasTalking(phoneNumber, message) {
        try {
            // Dynamically require Africa's Talking (in case package isn't installed)
            let AfricasTalking;
            try {
                AfricasTalking = require('africastalking');
            } catch (err) {
                throw new Error('Africa\'s Talking package not installed. Run: npm install africastalking');
            }
            
            const client = AfricasTalking({
                apiKey: process.env.AFRICASTALKING_API_KEY,
                username: process.env.AFRICASTALKING_USERNAME
            });

            const formattedPhone = this.formatPhoneForAfricasTalking(phoneNumber);
            
            console.log(`📤 Sending via Africa's Talking to ${formattedPhone}...`);
            console.log(`📝 Message length: ${message.length} characters`);

            const smsOptions = {
                to: [formattedPhone],
                message: message
            };

            // Only add sender ID for production accounts (not sandbox)
            if (process.env.AFRICASTALKING_USERNAME !== 'sandbox') {
                smsOptions.from = process.env.AFRICASTALKING_SENDER_ID || 'SKILLSMAP';
            }

            const response = await client.SMS.send(smsOptions);

            console.log('📋 Africa\'s Talking raw response:', JSON.stringify(response, null, 2));

            // Handle different response formats
            if (response.SMSMessageData) {
                const messageData = response.SMSMessageData;
                
                // Check for successful message
                if (messageData.Message === 'Sent' || messageData.Recipients) {
                    const recipient = messageData.Recipients?.[0];
                    
                    if (recipient) {
                        if (recipient.status === 'Success' || recipient.statusCode === 101) {
                            return {
                                messageId: recipient.messageId || `at_${Date.now()}`,
                                cost: recipient.cost || 'FREE (Sandbox)',
                                status: recipient.status || 'Success',
                                statusCode: recipient.statusCode,
                                africasTalkingResponse: response
                            };
                        } else {
                            throw new Error(`Message failed: ${recipient.status} (Code: ${recipient.statusCode})`);
                        }
                    } else {
                        // Handle sandbox "Sent" response without recipients array
                        return {
                            messageId: `at_sandbox_${Date.now()}`,
                            cost: 'FREE (Sandbox)',
                            status: 'Sent',
                            statusCode: 'sandbox',
                            africasTalkingResponse: response
                        };
                    }
                } else if (messageData.Message === 'InvalidSenderId') {
                    throw new Error('Invalid Sender ID - remove sender ID for sandbox testing');
                } else {
                    throw new Error(`Unexpected response: ${messageData.Message}`);
                }
            }

            throw new Error('Invalid response format from Africa\'s Talking');
            
        } catch (error) {
            if (error.message.includes('package not installed')) {
                throw error;
            }
            throw new Error(`Africa's Talking SMS failed: ${error.message}`);
        }
    }

    async sendSafaricom(phoneNumber, message) {
        try {
            const accessToken = await this.getSafaricomAccessToken();
            const formattedPhone = this.formatKenyanPhoneNumber(phoneNumber);
            
            console.log(`📤 Sending via Safaricom to ${formattedPhone}...`);
            
            // Use correct Safaricom SMS endpoint
            const endpoint = 'https://sandbox.safaricom.co.ke/v1/sms/send';
            
            const payload = {
                from: process.env.SAFARICOM_SENDER_ID || '600000',
                to: formattedPhone,
                text: message
            };

            const response = await axios.post(endpoint, payload, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                timeout: 15000
            });

            console.log('📋 Safaricom response:', response.data);

            return {
                messageId: response.data.messageId || response.data.SMSMessageData?.MessageId || `saf_${Date.now()}`,
                cost: this.estimateSMSCost(message),
                status: 'Success',
                safaricomResponse: response.data
            };
            
        } catch (error) {
            let errorMessage = error.message;
            
            if (error.response?.status === 404) {
                errorMessage = 'Safaricom SMS endpoint not found - API may have changed';
            } else if (error.response?.status === 401) {
                errorMessage = 'Safaricom authentication failed - check credentials';
                this.tokenCache.safaricom = { token: null, expiry: null }; // Clear cache
            } else if (error.response?.status === 400) {
                errorMessage = `Safaricom request error: ${error.response.data?.error_description || 'Invalid request'}`;
            } else if (error.response?.data) {
                errorMessage = `Safaricom API error: ${JSON.stringify(error.response.data)}`;
            }
            
            throw new Error(errorMessage);
        }
    }

    async getSafaricomAccessToken() {
        // Check cache first
        if (this.tokenCache.safaricom.token && 
            this.tokenCache.safaricom.expiry && 
            Date.now() < this.tokenCache.safaricom.expiry) {
            return this.tokenCache.safaricom.token;
        }

        const consumerKey = process.env.SAFARICOM_CONSUMER_KEY;
        const consumerSecret = process.env.SAFARICOM_CONSUMER_SECRET;
        
        if (!consumerKey || !consumerSecret) {
            throw new Error('Safaricom credentials not configured');
        }

        const credentials = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
        
        try {
            console.log('🔑 Getting Safaricom access token...');
            
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

            // Cache the token
            this.tokenCache.safaricom = {
                token: response.data.access_token,
                expiry: Date.now() + (response.data.expires_in * 1000) - 60000 // 1 min buffer
            };

            console.log('✅ Safaricom access token obtained and cached');
            console.log(`⏰ Token expires in: ${response.data.expires_in} seconds`);
            
            return response.data.access_token;
            
        } catch (error) {
            console.error('❌ Safaricom authentication error:', error.response?.data || error.message);
            throw new Error(`Safaricom authentication failed: ${error.response?.data?.error_description || error.message}`);
        }
    }

    formatKenyanPhoneNumber(phoneNumber) {
        let cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '').replace(/^\+/, '');
        
        if (cleaned.startsWith('0')) {
            cleaned = '254' + cleaned.substring(1);
        } else if (cleaned.startsWith('7') || cleaned.startsWith('1')) {
            cleaned = '254' + cleaned;
        } else if (!cleaned.startsWith('254')) {
            cleaned = '254' + cleaned;
        }
        
        if (!/^254[71]\d{8}$/.test(cleaned)) {
            console.warn(`⚠️ Phone number might be invalid: ${phoneNumber} -> ${cleaned}`);
        }
        
        return cleaned;
    }

    formatPhoneForAfricasTalking(phoneNumber) {
        const cleaned = this.formatKenyanPhoneNumber(phoneNumber);
        return '+' + cleaned;
    }

    estimateSMSCost(message) {
        const segments = Math.ceil(message.length / 160);
        const costPerSegment = 1;
        
        return {
            segments: segments,
            estimatedCostKES: segments * costPerSegment,
            currency: 'KES',
            characterCount: message.length
        };
    }

    logDemoSMS(phoneNumber, message) {
        const border = '═'.repeat(60);
        const timestamp = new Date().toLocaleTimeString();
        
        console.log('\n' + border);
        console.log(`📱 SMS TO: ${phoneNumber}`);
        console.log(`📅 Time: ${timestamp}`);
        console.log(`🔧 Mode: ${this.enableRealSMS ? 'REAL + DEMO' : 'DEMO ONLY'}`);
        console.log(`📝 Length: ${message.length} chars (${Math.ceil(message.length / 160)} segments)`);
        
        // Show provider status
        const enabledProviders = Object.entries(this.providers)
            .filter(([_, config]) => config.enabled)
            .map(([name, config]) => `${config.name}`)
            .join(' → ');
        console.log(`📡 Providers: ${enabledProviders || 'Demo only'}`);
        
        console.log(border);
        console.log(message);
        console.log(border);
        
        if (this.enableRealSMS && enabledProviders) {
            console.log('🔥 This message will be ACTUALLY SENT to the phone number above!');
            console.log(`🔄 Fallback chain: ${enabledProviders}`);
        } else {
            console.log('🧪 This is a simulation - configure providers and set ENABLE_REAL_SMS=true');
        }
        
        console.log(border + '\n');
    }

    // Test all providers
    async testProviders() {
        console.log('\n🧪 Testing SMS provider configurations...\n');
        
        const results = {};
        
        // Test Africa's Talking
        if (this.providers.africastalking.enabled) {
            try {
                let AfricasTalking;
                try {
                    AfricasTalking = require('africastalking');
                } catch (err) {
                    throw new Error('Package not installed: npm install africastalking');
                }
                
                const client = AfricasTalking({
                    apiKey: process.env.AFRICASTALKING_API_KEY,
                    username: process.env.AFRICASTALKING_USERNAME
                });
                
                if (client.SMS) {
                    results.africastalking = { status: '✅ Ready', error: null };
                    console.log('✅ Africa\'s Talking: Configuration valid');
                } else {
                    throw new Error('SMS service not available');
                }
            } catch (error) {
                results.africastalking = { status: '❌ Failed', error: error.message };
                console.log('❌ Africa\'s Talking:', error.message);
            }
        } else {
            results.africastalking = { status: '⚠️ Disabled', error: 'Missing credentials' };
            console.log('⚠️ Africa\'s Talking: Missing credentials');
        }
        
        // Test Safaricom
        if (this.providers.safaricom.enabled) {
            try {
                await this.getSafaricomAccessToken();
                results.safaricom = { status: '✅ Ready', error: null };
                console.log('✅ Safaricom: Configuration valid');
            } catch (error) {
                results.safaricom = { status: '❌ Failed', error: error.message };
                console.log('❌ Safaricom:', error.message);
            }
        } else {
            results.safaricom = { status: '⚠️ Disabled', error: 'Missing credentials' };
            console.log('⚠️ Safaricom: Missing credentials');
        }
        
        console.log('\n📊 Test Summary:');
        Object.entries(results).forEach(([provider, result]) => {
            console.log(`   ${provider}: ${result.status}`);
        });
        
        return results;
    }

    // Send a real test SMS (use carefully!)
    async sendTestSMS(phoneNumber, providerName = null) {
        if (!this.enableRealSMS) {
            throw new Error('Real SMS is disabled. Set ENABLE_REAL_SMS=true to send test messages.');
        }

        const testMessage = `🎯 SkillsMapper Test SMS

Your SMS system is working!

Provider: ${providerName || 'Auto-select'}
Time: ${new Date().toLocaleTimeString()}
Date: ${new Date().toDateString()}

This confirms your SMS integration is ready for the hackathon! 🚀`;

        if (providerName) {
            // Test specific provider
            console.log(`🧪 Testing specific provider: ${providerName}`);
            return await this.sendWithProvider(providerName, phoneNumber, testMessage);
        } else {
            // Test with fallback
            console.log('🧪 Testing with automatic fallback...');
            return await this.sendSMS(phoneNumber, testMessage);
        }
    }

    // Get current status
    getStatus() {
        const enabledProviders = Object.entries(this.providers)
            .filter(([_, config]) => config.enabled)
            .sort(([_, a], [__, b]) => a.priority - b.priority)
            .map(([name, config]) => ({
                name: config.name,
                enabled: config.enabled,
                priority: config.priority
            }));

        return {
            realSMSEnabled: this.enableRealSMS,
            environment: this.isDevelopment ? 'development' : 'production',
            totalProviders: Object.keys(this.providers).length,
            enabledProviders: enabledProviders.length,
            providers: enabledProviders,
            fallbackAvailable: enabledProviders.length > 1
        };
    }
}

module.exports = new SMSProvider();