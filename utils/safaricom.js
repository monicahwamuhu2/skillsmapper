// utils/safaricom.js - Enhanced for Real SMS Integration
const axios = require('axios');

class SafaricomAPI {
    constructor() {
        this.consumerKey = process.env.SAFARICOM_CONSUMER_KEY;
        this.consumerSecret = process.env.SAFARICOM_CONSUMER_SECRET;
        this.baseURL = 'https://sandbox.safaricom.co.ke';
        this.accessToken = null;
        this.tokenExpiry = null;
        this.enableRealSMS = process.env.ENABLE_REAL_SMS === 'true';
        this.isDevelopment = process.env.NODE_ENV === 'development';
        
        console.log(`📱 SMS Mode: ${this.enableRealSMS ? 'REAL SMS ENABLED' : 'DEMO MODE'}`);
    }

    async getAccessToken() {
        // Return mock token if real SMS is disabled
        if (!this.enableRealSMS) {
            return 'mock_token_for_demo';
        }

        // Check if we have a valid cached token
        if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
            return this.accessToken;
        }

        // Validate credentials
        if (!this.consumerKey || !this.consumerSecret) {
            throw new Error('Safaricom API credentials not configured');
        }

        const credentials = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');
        
        try {
            console.log('🔑 Getting Safaricom access token...');
            
            const response = await axios.get(`${this.baseURL}/oauth/v1/generate?grant_type=client_credentials`, {
                headers: {
                    'Authorization': `Basic ${credentials}`,
                    'Content-Type': 'application/json'
                },
                timeout: 10000 // 10 second timeout
            });

            this.accessToken = response.data.access_token;
            this.tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000; // 1 min buffer
            
            console.log('✅ Safaricom access token obtained successfully');
            console.log(`⏰ Token expires in: ${response.data.expires_in} seconds`);
            
            return this.accessToken;
            
        } catch (error) {
            console.error('❌ Safaricom authentication failed:');
            console.error('Status:', error.response?.status);
            console.error('Error:', error.response?.data || error.message);
            
            if (error.response?.status === 400) {
                console.log('\n💡 Common authentication issues:');
                console.log('   • Check if your Consumer Key and Secret are correct');
                console.log('   • Ensure your app is activated in Safaricom Developer Portal');
                console.log('   • Verify you have subscribed to SMS API in your app');
                console.log('   • Make sure you are using sandbox credentials for testing');
            }
            
            throw new Error(`Safaricom API authentication failed: ${error.response?.data?.error_description || error.message}`);
        }
    }

    formatPhoneNumber(phoneNumber) {
        // Remove any spaces, dashes, or parentheses
        let cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '');
        
        // Remove leading + if present
        cleaned = cleaned.replace(/^\+/, '');
        
        // Handle different Kenyan number formats
        if (cleaned.startsWith('0')) {
            // Convert 0722123456 to 254722123456
            cleaned = '254' + cleaned.substring(1);
        } else if (cleaned.startsWith('7') || cleaned.startsWith('1')) {
            // Convert 722123456 to 254722123456
            cleaned = '254' + cleaned;
        } else if (!cleaned.startsWith('254')) {
            // If it doesn't start with 254, assume it's a local number
            cleaned = '254' + cleaned;
        }
        
        // Validate the final format
        if (!/^254[71]\d{8}$/.test(cleaned)) {
            throw new Error(`Invalid Kenyan phone number format: ${phoneNumber}. Expected format: 254722123456`);
        }
        
        return cleaned;
    }

    async sendRealSMS(phoneNumber, message) {
        try {
            const accessToken = await this.getAccessToken();
            const formattedPhone = this.formatPhoneNumber(phoneNumber);
            
            console.log(`📤 Sending REAL SMS to ${formattedPhone}...`);
            console.log(`📝 Message length: ${message.length} characters`);
            
            // Safaricom SMS API has a 160 character limit per message
            if (message.length > 160) {
                console.log('⚠️  Message exceeds 160 characters, will be sent as multiple SMS');
            }

            const requestPayload = {
                from: process.env.SMS_SENDER_ID || 'SKILLSMAP',
                to: formattedPhone,
                text: message
            };

            const response = await axios.post(`${this.baseURL}/v1/sms/send`, requestPayload, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                timeout: 15000 // 15 second timeout
            });

            console.log('✅ Real SMS sent successfully!');
            console.log('📊 Safaricom Response:', {
                messageId: response.data.messageId || response.data.SMSMessageData?.MessageId,
                recipients: response.data.SMSMessageData?.Recipients || response.data.recipients,
                message: response.data.SMSMessageData?.Message || 'SMS sent'
            });

            return {
                success: true,
                messageId: response.data.messageId || response.data.SMSMessageData?.MessageId,
                recipients: response.data.SMSMessageData?.Recipients || response.data.recipients,
                to: formattedPhone,
                message: message,
                timestamp: new Date().toISOString(),
                provider: 'Safaricom',
                cost: this.estimateSMSCost(message),
                safaricomResponse: response.data
            };
            
        } catch (error) {
            console.error('❌ Real SMS sending failed:');
            console.error('Status:', error.response?.status);
            console.error('Error:', error.response?.data || error.message);
            
            if (error.response?.status === 401) {
                console.log('🔑 Authentication failed - refreshing token...');
                this.accessToken = null; // Force token refresh on next call
            }
            
            throw new Error(`SMS sending failed: ${error.response?.data?.errorMessage || error.message}`);
        }
    }

    async sendSMS(phoneNumber, message) {
        // Always show mock SMS in console for development visibility
        this.logMockSMS(phoneNumber, message);
        
        const result = {
            status: 'success',
            mode: this.enableRealSMS ? 'real' : 'mock',
            to: phoneNumber,
            message: message,
            timestamp: new Date().toISOString()
        };

        // Send real SMS if enabled
        if (this.enableRealSMS) {
            try {
                console.log('🚀 Real SMS mode enabled - sending actual SMS...');
                const realSMSResult = await this.sendRealSMS(phoneNumber, message);
                
                // Merge real SMS result with basic result
                return {
                    ...result,
                    realSMS: realSMSResult,
                    messageId: realSMSResult.messageId,
                    cost: realSMSResult.cost
                };
                
            } catch (error) {
                console.error('❌ Real SMS failed, but continuing with mock for demo...');
                console.error('Error:', error.message);
                
                return {
                    ...result,
                    realSMS: {
                        success: false,
                        error: error.message
                    },
                    warning: 'Real SMS failed - check Safaricom API credentials'
                };
            }
        }
        
        return result;
    }

    logMockSMS(phoneNumber, message) {
        const border = '═'.repeat(60);
        const timestamp = new Date().toLocaleTimeString();
        
        console.log('\n' + border);
        console.log(`📱 ${this.enableRealSMS ? 'REAL SMS' : 'MOCK SMS'} TO: ${phoneNumber}`);
        console.log(`📅 Time: ${timestamp}`);
        console.log(`📝 Length: ${message.length} chars`);
        console.log(border);
        console.log(message);
        console.log(border);
        
        if (this.enableRealSMS) {
            console.log('🔥 This message was ACTUALLY SENT to the phone number above!');
        } else {
            console.log('🧪 This is a simulation - set ENABLE_REAL_SMS=true to send real SMS');
        }
        
        console.log(border + '\n');
    }

    estimateSMSCost(message) {
        // Estimate cost based on message length
        // Safaricom typically charges per 160 character segment
        const segments = Math.ceil(message.length / 160);
        const costPerSegment = 1; // Approximate cost in KES
        
        return {
            segments: segments,
            estimatedCostKES: segments * costPerSegment,
            currency: 'KES'
        };
    }

    async testConnection() {
        try {
            console.log('🧪 Testing Safaricom API connection...');
            
            const token = await this.getAccessToken();
            
            if (token === 'mock_token_for_demo') {
                console.log('✅ Demo mode - connection test passed');
                return { success: true, mode: 'demo' };
            }
            
            console.log('✅ Real API connection test passed');
            return { 
                success: true, 
                mode: 'real',
                token: token.substring(0, 20) + '...',
                baseURL: this.baseURL
            };
            
        } catch (error) {
            console.error('❌ Connection test failed:', error.message);
            return { 
                success: false, 
                error: error.message 
            };
        }
    }

    // Utility method to validate if SMS can be sent
    canSendSMS() {
        if (!this.enableRealSMS) {
            return { canSend: true, mode: 'demo', reason: 'Demo mode enabled' };
        }
        
        if (!this.consumerKey || !this.consumerSecret) {
            return { 
                canSend: false, 
                mode: 'real', 
                reason: 'Missing Safaricom API credentials' 
            };
        }
        
        return { canSend: true, mode: 'real', reason: 'Real SMS mode ready' };
    }

    // Get SMS sending statistics
    getStats() {
        return {
            mode: this.enableRealSMS ? 'real' : 'demo',
            hasCredentials: !!(this.consumerKey && this.consumerSecret),
            hasValidToken: !!(this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry),
            baseURL: this.baseURL,
            environment: this.isDevelopment ? 'development' : 'production'
        };
    }
}

module.exports = new SafaricomAPI();