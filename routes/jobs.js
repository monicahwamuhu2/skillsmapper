// routes/jobs.js
const express = require('express');
const router = express.Router();
const userService = require('../utils/userService');
const db = require('../config/database');

// Get job recommendations for a user
router.get('/recommendations/:phoneNumber', async (req, res) => {
    try {
        const { phoneNumber } = req.params;
        const { limit = 10 } = req.query;

        const jobs = await userService.getJobRecommendations(phoneNumber, parseInt(limit));
        
        res.json({ 
            phoneNumber,
            jobCount: jobs.length,
            jobs: jobs 
        });
        
    } catch (error) {
        console.error('❌ Get job recommendations error:', error);
        res.status(500).json({ 
            error: 'Failed to get job recommendations' 
        });
    }
});

// Get all jobs with filtering
router.get('/', async (req, res) => {
    try {
        const { 
            location, 
            education, 
            company,
            minSalary,
            maxSalary,
            limit = 20, 
            offset = 0 
        } = req.query;

        let query = 'SELECT * FROM jobs WHERE is_active = 1';
        const params = [];
        let paramCount = 0;

        if (location) {
            paramCount++;
            query += ` AND (location = ? OR location = 'Remote')`;
            params.push(location);
        }

        if (education) {
            paramCount++;
            query += ` AND education_requirement = ?`;
            params.push(education);
        }

        if (company) {
            paramCount++;
            query += ` AND company LIKE ?`;
            params.push(`%${company}%`);
        }

        if (minSalary) {
            paramCount++;
            query += ` AND salary_min >= ?`;
            params.push(parseInt(minSalary));
        }

        if (maxSalary) {
            paramCount++;
            query += ` AND salary_max <= ?`;
            params.push(parseInt(maxSalary));
        }

        query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
        params.push(parseInt(limit), parseInt(offset));

        const jobs = await db.query(query, params);
        
        res.json({ 
            total: jobs.length,
            limit: parseInt(limit),
            offset: parseInt(offset),
            jobs: jobs 
        });
        
    } catch (error) {
        console.error('❌ Get jobs error:', error);
        res.status(500).json({ 
            error: 'Failed to get jobs' 
        });
    }
});

// Get job details by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const job = await db.get(
            'SELECT * FROM jobs WHERE id = ? AND is_active = 1',
            [id]
        );

        if (!job) {
            return res.status(404).json({ 
                error: 'Job not found' 
            });
        }

        res.json({ job });
        
    } catch (error) {
        console.error('❌ Get job details error:', error);
        res.status(500).json({ 
            error: 'Failed to get job details' 
        });
    }
});

// Add new job (admin endpoint)
router.post('/', async (req, res) => {
    try {
        const {
            title,
            company,
            location,
            salary_min,
            salary_max,
            description,
            required_skills,
            education_requirement,
            application_url
        } = req.body;

        if (!title || !company) {
            return res.status(400).json({ 
                error: 'Title and company are required' 
            });
        }

        const result = await db.run(
            `INSERT INTO jobs (
                title, company, location, salary_min, salary_max, 
                description, required_skills, education_requirement, application_url
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                title, company, location, salary_min, salary_max,
                description, required_skills, education_requirement, application_url
            ]
        );

        const newJob = await db.get('SELECT * FROM jobs WHERE id = ?', [result.id]);
        
        res.status(201).json({ 
            message: 'Job created successfully',
            job: newJob 
        });
        
    } catch (error) {
        console.error('❌ Add job error:', error);
        res.status(500).json({ 
            error: 'Failed to add job' 
        });
    }
});

// Get job statistics
router.get('/stats/overview', async (req, res) => {
    try {
        const stats = await db.get(`
            SELECT 
                COUNT(*) as total_jobs,
                COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_jobs,
                COUNT(DISTINCT location) as unique_locations,
                COUNT(DISTINCT company) as unique_companies,
                AVG(salary_min) as avg_min_salary,
                AVG(salary_max) as avg_max_salary
            FROM jobs
        `);

        // Get top locations
        const topLocations = await db.query(`
            SELECT location, COUNT(*) as job_count 
            FROM jobs 
            WHERE is_active = 1 AND location IS NOT NULL
            GROUP BY location 
            ORDER BY job_count DESC 
            LIMIT 5
        `);

        // Get top companies
        const topCompanies = await db.query(`
            SELECT company, COUNT(*) as job_count 
            FROM jobs 
            WHERE is_active = 1 
            GROUP BY company 
            ORDER BY job_count DESC 
            LIMIT 5
        `);

        res.json({
            overview: stats,
            topLocations: topLocations,
            topCompanies: topCompanies
        });
        
    } catch (error) {
        console.error('❌ Get job stats error:', error);
        res.status(500).json({ 
            error: 'Failed to get job statistics' 
        });
    }
});

module.exports = router;