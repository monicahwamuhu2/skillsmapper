// utils/userService.js
const db = require('../config/database');

class UserService {
    async getUserProfile(phoneNumber) {
        try {
            const user = await db.get(
                'SELECT * FROM users WHERE phone_number = ?',
                [phoneNumber]
            );
            return user || null;
        } catch (error) {
            console.error('Get user profile error:', error);
            return null;
        }
    }

    async saveUserProfile(phoneNumber, profileData) {
        try {
            const { education, location, interests } = profileData;
            
            const result = await db.run(
                `INSERT OR REPLACE INTO users 
                (phone_number, education_level, location, interests, profile_completed, updated_at) 
                VALUES (?, ?, ?, ?, 1, datetime('now'))`,
                [phoneNumber, education, location, interests]
            );

            // Generate recommendations after saving profile
            await this.generateRecommendations(phoneNumber);
            
            return await this.getUserProfile(phoneNumber);
        } catch (error) {
            console.error('Save user profile error:', error);
            throw error;
        }
    }

    async getJobRecommendations(phoneNumber, limit = 10) {
        try {
            const jobs = await db.query(
                `SELECT j.*, ujm.match_score
                FROM jobs j
                LEFT JOIN user_job_matches ujm ON j.id = ujm.job_id AND ujm.user_phone = ?
                WHERE j.is_active = 1
                ORDER BY ujm.match_score DESC, j.salary_max DESC
                LIMIT ?`,
                [phoneNumber, limit]
            );

            return jobs;
        } catch (error) {
            console.error('Get job recommendations error:', error);
            return [];
        }
    }

    async getCertificationRecommendations(phoneNumber, limit = 5) {
        try {
            const certs = await db.query(
                `SELECT c.*, ucr.priority_score
                FROM certifications c
                LEFT JOIN user_cert_recommendations ucr ON c.id = ucr.certification_id AND ucr.user_phone = ?
                WHERE c.is_free = 1
                ORDER BY ucr.priority_score DESC, c.duration_weeks ASC
                LIMIT ?`,
                [phoneNumber, limit]
            );

            return certs;
        } catch (error) {
            console.error('Get certification recommendations error:', error);
            return [];
        }
    }

    async generateRecommendations(phoneNumber) {
        try {
            const user = await this.getUserProfile(phoneNumber);
            if (!user || !user.profile_completed) return;

            // Clear existing recommendations
            await db.run('DELETE FROM user_job_matches WHERE user_phone = ?', [phoneNumber]);
            await db.run('DELETE FROM user_cert_recommendations WHERE user_phone = ?', [phoneNumber]);

            // Get all jobs and calculate match scores
            const jobs = await db.query('SELECT * FROM jobs WHERE is_active = 1');
            
            for (const job of jobs) {
                const matchScore = this.calculateJobMatchScore(user, job);
                
                if (matchScore > 30) { // Only recommend jobs with decent match
                    await db.run(
                        `INSERT INTO user_job_matches (user_phone, job_id, match_score)
                         VALUES (?, ?, ?)`,
                        [phoneNumber, job.id, matchScore]
                    );
                }
            }

            // Generate certification recommendations
            const certifications = await db.query('SELECT * FROM certifications WHERE is_free = 1');
            
            for (const cert of certifications) {
                const priorityScore = this.calculateCertMatchScore(user, cert);
                
                if (priorityScore > 40) {
                    await db.run(
                        `INSERT INTO user_cert_recommendations (user_phone, certification_id, priority_score)
                         VALUES (?, ?, ?)`,
                        [phoneNumber, cert.id, priorityScore]
                    );
                }
            }

            console.log(`✅ Generated recommendations for ${phoneNumber}`);
        } catch (error) {
            console.error('Generate recommendations error:', error);
        }
    }

    calculateJobMatchScore(user, job) {
        let score = 0;

        // Education match
        const educationOrder = ['Primary', 'High School', 'Certificate', 'University', 'Postgraduate'];
        const userEduLevel = educationOrder.indexOf(user.education_level);
        const jobEduLevel = educationOrder.indexOf(job.education_requirement);
        
        if (userEduLevel >= jobEduLevel) {
            score += 40; // Education requirement met
        } else {
            score += 10; // Close but not quite
        }

        // Location match
        if (job.location === user.location) {
            score += 30; // Perfect location match
        } else if (job.location === 'Remote') {
            score += 20; // Remote work is good for anyone
        } else {
            score += 5; // Other locations still possible
        }

        // Skills/Interest match
        if (user.interests && job.required_skills) {
            const userInterests = user.interests.toLowerCase();
            const jobSkills = job.required_skills.toLowerCase();
            
            if (jobSkills.includes(userInterests) || userInterests.includes('customer service')) {
                score += 30; // Skills match
            } else {
                score += 10; // Generic match
            }
        }

        return Math.min(score, 100); // Cap at 100
    }

    calculateCertMatchScore(user, cert) {
        let score = 0;

        // Skills relevance
        if (user.interests && cert.skills_taught) {
            const userInterests = user.interests.toLowerCase();
            const certSkills = cert.skills_taught.toLowerCase();
            
            if (certSkills.includes(userInterests) || userInterests.includes('customer service')) {
                score += 50;
            } else {
                score += 20;
            }
        }

        // Beginner friendly
        if (cert.difficulty_level === 'Beginner') {
            score += 30;
        }

        // Short duration preferred
        if (cert.duration_weeks <= 4) {
            score += 20;
        }

        return Math.min(score, 100);
    }

    async logMessage(phoneNumber, type, content) {
        try {
            await db.run(
                'INSERT INTO sms_log (phone_number, message_type, message_content) VALUES (?, ?, ?)',
                [phoneNumber, type, content]
            );
        } catch (error) {
            console.error('Log message error:', error);
        }
    }

    async getUserProgress(phoneNumber) {
        try {
            const user = await this.getUserProfile(phoneNumber);
            if (!user) return null;

            const stats = await db.get(
                `SELECT 
                    COUNT(DISTINCT ujm.job_id) as recommended_jobs,
                    COUNT(DISTINCT CASE WHEN ujm.viewed = 1 THEN ujm.job_id END) as viewed_jobs,
                    COUNT(DISTINCT CASE WHEN ujm.applied = 1 THEN ujm.job_id END) as applied_jobs,
                    COUNT(DISTINCT ucr.certification_id) as recommended_courses
                FROM users u
                LEFT JOIN user_job_matches ujm ON u.phone_number = ujm.user_phone
                LEFT JOIN user_cert_recommendations ucr ON u.phone_number = ucr.user_phone
                WHERE u.phone_number = ?`,
                [phoneNumber]
            );

            return {
                user: user,
                stats: stats || {}
            };
        } catch (error) {
            console.error('Get user progress error:', error);
            return null;
        }
    }
}

module.exports = new UserService();