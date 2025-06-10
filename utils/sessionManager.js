// utils/sessionManager.js
const db = require('../config/database');

class SessionManager {
    async getSession(phoneNumber) {
        try {
            const session = await db.get(
                'SELECT * FROM sms_sessions WHERE phone_number = ? AND expires_at > datetime("now")',
                [phoneNumber]
            );
            
            if (session && session.session_data) {
                try {
                    session.session_data = JSON.parse(session.session_data);
                } catch (e) {
                    session.session_data = {};
                }
            }
            
            return session || null;
        } catch (error) {
            console.error('Get session error:', error);
            return null;
        }
    }

    async createSession(phoneNumber, sessionData = {}) {
        try {
            await db.run(
                `INSERT OR REPLACE INTO sms_sessions 
                (phone_number, current_step, session_data, expires_at) 
                VALUES (?, 'welcome', ?, datetime('now', '+30 minutes'))`,
                [phoneNumber, JSON.stringify(sessionData)]
            );
            
            return await this.getSession(phoneNumber);
        } catch (error) {
            console.error('Create session error:', error);
            throw error;
        }
    }

    async updateSession(phoneNumber, updates) {
        try {
            const session = await this.getSession(phoneNumber);
            if (!session) {
                return await this.createSession(phoneNumber, updates.sessionData || {});
            }

            const newSessionData = { 
                ...session.session_data, 
                ...(updates.sessionData || {}) 
            };
            
            await db.run(
                `UPDATE sms_sessions 
                SET current_step = ?, session_data = ?, last_message = ?
                WHERE phone_number = ?`,
                [
                    updates.currentMenu || session.current_step,
                    JSON.stringify(newSessionData),
                    updates.lastMessage || session.last_message,
                    phoneNumber
                ]
            );
            
            return await this.getSession(phoneNumber);
        } catch (error) {
            console.error('Update session error:', error);
            throw error;
        }
    }

    async clearSession(phoneNumber) {
        try {
            await db.run('DELETE FROM sms_sessions WHERE phone_number = ?', [phoneNumber]);
        } catch (error) {
            console.error('Clear session error:', error);
        }
    }

    // Clean up expired sessions (run periodically)
    async cleanExpiredSessions() {
        try {
            const result = await db.run('DELETE FROM sms_sessions WHERE expires_at <= datetime("now")');
            if (result.changes > 0) {
                console.log(`🧹 Cleaned up ${result.changes} expired sessions`);
            }
        } catch (error) {
            console.error('Clean expired sessions error:', error);
        }
    }
}

module.exports = new SessionManager();