// routes/users.js
const express = require('express');
const router = express.Router();
const userService = require('../utils/userService');
const db = require('../config/database');

// Get user profile
router.get('/:phoneNumber', async (req, res) => {
    try {
        const { phoneNumber } = req.params;
        const user = await userService.getUserProfile(phoneNumber);
        
        if (!user) {
            return res.status(404).json({ 
                error: 'User not found' 
            });
        }

        // Don't expose sensitive information
        const safeUser = {
            phoneNumber: user.phone_number,
            educationLevel: user.education_level,
            location: user.location,
            interests: user.interests,
            profileCompleted: user.profile_completed,
            createdAt: user.created_at,
            updatedAt: user.updated_at
        };

        res.json({ user: safeUser });
        
    } catch (error) {
        console.error('❌ Get user error:', error);
        res.status(500).json({ 
            error: 'Failed to get user profile' 
        });
    }
});

// Get user progress and statistics
router.get('/:phoneNumber/progress', async (req, res) => {
    try {
        const { phoneNumber } = req.params;
        const progress = await userService.getUserProgress(phoneNumber);
        
        if (!progress) {
            return res.status(404).json({ 
                error: 'User not found' 
            });
        }

        res.json({
            user: {
                phoneNumber: progress.user.phone_number,
                educationLevel: progress.user.education_level,
                location: progress.user.location,
                interests: progress.user.interests,
                profileCompleted: progress.user.profile_completed
            },
            stats: progress.stats
        });
        
    } catch (error) {
        console.error('❌ Get user progress error:', error);
        res.status(500).json({ 
            error: 'Failed to get user progress' 
        });
    }
});

// Get user's certification recommendations
router.get('/:phoneNumber/certifications', async (req, res) => {
    try {
        const { phoneNumber } = req.params;
        const { limit = 5 } = req.query;

        const certifications = await userService.getCertificationRecommendations(phoneNumber, parseInt(limit));
        
        res.json({ 
            phoneNumber,
            certificationCount: certifications.length,
            certifications: certifications 
        });
        
    } catch (error) {
        console.error('❌ Get certification recommendations error:', error);
        res.status(500).json({ 
            error: 'Failed to get certification recommendations' 
        });
    }
});

// Get all users (admin endpoint with privacy protection)
router.get('/', async (req, res) => {
    try {
        const { limit = 50, offset = 0 } = req.query;

        const users = await db.query(
            `SELECT 
                phone_number,
                education_level,
                location,
                interests,
                profile_completed,
                created_at
             FROM users 
             ORDER BY created_at DESC 
             LIMIT ? OFFSET ?`,
            [parseInt(limit), parseInt(offset)]
        );

        // Get user statistics
        const stats = await db.get(`
            SELECT 
                COUNT(*) as total_users,
                COUNT(CASE WHEN profile_completed = 1 THEN 1 END) as completed_profiles,
                COUNT(DISTINCT location) as unique_locations,
                COUNT(DISTINCT education_level) as unique_education_levels
            FROM users
        `);

        res.json({
            userCount: users.length,
            stats: stats,
            users: users
        });
        
    } catch (error) {
        console.error('❌ Get users error:', error);
        res.status(500).json({ 
            error: 'Failed to get users' 
        });
    }
});

// Delete user profile (GDPR compliance)
router.delete('/:phoneNumber', async (req, res) => {
    try {
        const { phoneNumber } = req.params;

        // Delete all user data
        await db.run('DELETE FROM user_job_matches WHERE user_phone = ?', [phoneNumber]);
        await db.run('DELETE FROM user_cert_recommendations WHERE user_phone = ?', [phoneNumber]);
        await db.run('DELETE FROM sms_sessions WHERE phone_number = ?', [phoneNumber]);
        await db.run('DELETE FROM sms_log WHERE phone_number = ?', [phoneNumber]);
        const result = await db.run('DELETE FROM users WHERE phone_number = ?', [phoneNumber]);

        if (result.changes === 0) {
            return res.status(404).json({ 
                error: 'User not found' 
            });
        }

        res.json({ 
            message: 'User profile and all associated data deleted successfully',
            phoneNumber: phoneNumber
        });
        
    } catch (error) {
        console.error('❌ Delete user error:', error);
        res.status(500).json({ 
            error: 'Failed to delete user profile' 
        });
    }
});

module.exports = router;