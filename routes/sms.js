// routes/sms.js
const express = require('express');
const router = express.Router();
const menuSystem = require('../utils/menuSystem');
const userService = require('../utils/userService');

// Webhook endpoint for receiving SMS from Safaricom
router.post('/webhook', async (req, res) => {
    try {
        console.log('📥 SMS Webhook received:', req.body);
        
        // Safaricom sends different field names depending on the service
        const phoneNumber = req.body.from || req.body.msisdn || req.body.phone;
        const message = req.body.text || req.body.message;
        const messageId = req.body.id || req.body.messageId;
        
        if (!phoneNumber || !message) {
            console.error('❌ Missing required fields:', req.body);
            return res.status(400).json({ 
                error: 'Missing required fields: from/phone and text/message' 
            });
        }

        // Process the message through our menu system
        console.log(`📨 Processing message from ${phoneNumber}: "${message}"`);
        await menuSystem.processMessage(phoneNumber, message);

        // Track user activity
        await userService.logMessage(phoneNumber, 'webhook_received', message);

        // Respond to Safaricom
        res.status(200).json({ 
            status: 'success',
            message: 'SMS processed successfully',
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ SMS webhook error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
});

// Endpoint for sending SMS manually (for testing)
router.post('/send', async (req, res) => {
    try {
        const { phoneNumber, message } = req.body;
        
        if (!phoneNumber || !message) {
            return res.status(400).json({ 
                error: 'Phone number and message required' 
            });
        }

        await menuSystem.sendMessage(phoneNumber, message);
        
        res.json({ 
            status: 'Message sent successfully',
            to: phoneNumber,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Send SMS error:', error);
        res.status(500).json({ 
            error: 'Failed to send message',
            details: error.message 
        });
    }
});

// Get SMS conversation history
router.get('/history/:phoneNumber', async (req, res) => {
    try {
        const { phoneNumber } = req.params;
        const { limit = 50 } = req.query;

        const db = require('../config/database');
        const messages = await db.query(
            `SELECT * FROM sms_log 
             WHERE phone_number = ? 
             ORDER BY created_at DESC 
             LIMIT ?`,
            [phoneNumber, parseInt(limit)]
        );

        res.json({ 
            phoneNumber,
            messageCount: messages.length,
            messages: messages 
        });
        
    } catch (error) {
        console.error('❌ Get SMS history error:', error);
        res.status(500).json({ 
            error: 'Failed to get message history' 
        });
    }
});

// Get active SMS sessions
router.get('/sessions', async (req, res) => {
    try {
        const db = require('../config/database');
        const sessions = await db.query(
            `SELECT phone_number, current_step, 
             datetime(created_at, 'localtime') as created_at,
             datetime(expires_at, 'localtime') as expires_at
             FROM sms_sessions 
             WHERE expires_at > datetime('now')
             ORDER BY created_at DESC`
        );

        res.json({ 
            activeSessions: sessions.length,
            sessions: sessions 
        });
        
    } catch (error) {
        console.error('❌ Get sessions error:', error);
        res.status(500).json({ 
            error: 'Failed to get sessions' 
        });
    }
});

module.exports = router;