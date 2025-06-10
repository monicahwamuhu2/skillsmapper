// database/seed.js
const pool = require('../config/database');

const seedJobs = async () => {
    const jobs = [
        {
            title: 'Customer Service Representative',
            company: 'KCB Bank',
            location: 'Nairobi',
            salary_min: 25000,
            salary_max: 35000,
            required_skills: ['communication', 'customer service', 'computer literacy'],
            education_requirement: 'High School',
            application_url: 'https://kcbgroup.com/careers'
        },
        {
            title: 'Sales Agent',
            company: 'Safaricom',
            location: 'Mombasa',
            salary_min: 30000,
            salary_max: 45000,
            required_skills: ['sales', 'communication', 'target achievement'],
            education_requirement: 'Certificate',
            application_url: 'https://safaricom.co.ke/careers'
        },
        {
            title: 'Data Entry Clerk',
            company: 'Kenya Red Cross',
            location: 'Kisumu',
            salary_min: 20000,
            salary_max: 30000,
            required_skills: ['computer literacy', 'data entry', 'attention to detail'],
            education_requirement: 'High School',
            application_url: 'https://redcross.or.ke/jobs'
        }
    ];

    for (const job of jobs) {
        await pool.query(
            `INSERT INTO jobs (title, company, location, salary_min, salary_max, required_skills, education_requirement, application_url)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [job.title, job.company, job.location, job.salary_min, job.salary_max, job.required_skills, job.education_requirement, job.application_url]
        );
    }
};

const seedCertifications = async () => {
    const certs = [
        {
            name: 'Google Digital Skills for Africa',
            provider: 'Google',
            duration_weeks: 4,
            skills_taught: ['digital marketing', 'online presence', 'e-commerce'],
            certification_url: 'https://learndigital.withgoogle.com/digitalskills',
            difficulty_level: 'Beginner'
        },
        {
            name: 'Microsoft Office Specialist',
            provider: 'Microsoft',
            duration_weeks: 6,
            skills_taught: ['microsoft office', 'excel', 'word', 'powerpoint'],
            certification_url: 'https://www.microsoft.com/learning',
            difficulty_level: 'Beginner'
        },
        {
            name: 'Customer Service Excellence',
            provider: 'Coursera',
            duration_weeks: 3,
            skills_taught: ['customer service', 'communication', 'problem solving'],
            certification_url: 'https://coursera.org/customer-service',
            difficulty_level: 'Beginner'
        }
    ];

    for (const cert of certs) {
        await pool.query(
            `INSERT INTO certifications (name, provider, duration_weeks, skills_taught, certification_url, difficulty_level)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [cert.name, cert.provider, cert.duration_weeks, cert.skills_taught, cert.certification_url, cert.difficulty_level]
        );
    }
};

// Run seed
(async () => {
    try {
        await seedJobs();
        await seedCertifications();
        console.log('Database seeded successfully');
        process.exit(0);
    } catch (error) {
        console.error('Seed error:', error);
        process.exit(1);
    }
})();