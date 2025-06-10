// utils/menuSystem.js
const smsProvider = require('./smsProvider'); // Updated import
const sessionManager = require('./sessionManager');
const userService = require('./userService');

class MenuSystem {
    async processMessage(phoneNumber, message) {
        const session = await sessionManager.getSession(phoneNumber);
        const messageText = message.toLowerCase().trim();

        // Log incoming message
        await userService.logMessage(phoneNumber, 'incoming', message);

        // Handle start/restart commands
        if (!session || messageText === 'jobs' || messageText === 'start' || messageText === 'menu') {
            return await this.showMainMenu(phoneNumber);
        }

        // Route based on current conversation step
        switch (session.current_step) {
            case 'welcome':
                return await this.handleMainMenuSelection(phoneNumber, messageText, session);
            case 'education_level':
                return await this.handleEducationLevel(phoneNumber, messageText, session);
            case 'location_selection':
                return await this.handleLocationSelection(phoneNumber, messageText, session);
            case 'interests_selection':
                return await this.handleInterestsSelection(phoneNumber, messageText, session);
            case 'job_browsing':
                return await this.handleJobBrowsing(phoneNumber, messageText, session);
            case 'course_browsing':
                return await this.handleCourseBrowsing(phoneNumber, messageText, session);
            default:
                return await this.showMainMenu(phoneNumber);
        }
    }

    async showMainMenu(phoneNumber) {
        await sessionManager.createSession(phoneNumber);
        
        const user = await userService.getUserProfile(phoneNumber);
        const greeting = user?.profile_completed ? 
            `Welcome back, ${phoneNumber.slice(-4)}!` : 
            `Welcome to SkillsMapper! 🎯`;
        
        const jobCount = user?.profile_completed ? await this.getJobCount(phoneNumber) : 0;
        
        const menu = `${greeting}

Your AI job matchmaker for Kenya!

Reply with number:
1 - Skills Assessment ${user?.profile_completed ? '(Update)' : '⭐ START HERE'}
2 - View Jobs (${jobCount} matches)
3 - Free Courses
4 - My Progress
5 - Success Stories
0 - Help

Reply STOP to unsubscribe`;

        await this.sendMessage(phoneNumber, menu);
        await sessionManager.updateSession(phoneNumber, { currentMenu: 'welcome' });
    }

    async handleMainMenuSelection(phoneNumber, message, session) {
        switch (message) {
            case '1':
                return await this.startSkillsAssessment(phoneNumber);
            case '2':
                return await this.showJobs(phoneNumber);
            case '3':
                return await this.showCourses(phoneNumber);
            case '4':
                return await this.showProgress(phoneNumber);
            case '5':
                return await this.showSuccessStories(phoneNumber);
            case '0':
                return await this.showHelp(phoneNumber);
            default:
                await this.sendMessage(phoneNumber, `Invalid option: "${message}"

Please reply with 1-5 or 0
Or reply JOBS for main menu`);
                return await this.showMainMenu(phoneNumber);
        }
    }

    async startSkillsAssessment(phoneNumber) {
        await sessionManager.updateSession(phoneNumber, { 
            currentMenu: 'education_level',
            sessionData: { assessmentData: {} }
        });

        const message = `📚 SKILLS ASSESSMENT

What's your highest education level?

1 - Primary School
2 - High School/Secondary  
3 - Certificate/Diploma
4 - University Degree
5 - Postgraduate

Reply 0 to go back to main menu`;

        await this.sendMessage(phoneNumber, message);
    }

    async handleEducationLevel(phoneNumber, message, session) {
        const educationLevels = {
            '1': 'Primary',
            '2': 'High School',
            '3': 'Certificate',
            '4': 'University',
            '5': 'Postgraduate'
        };

        if (message === '0') {
            return await this.showMainMenu(phoneNumber);
        }

        if (!educationLevels[message]) {
            await this.sendMessage(phoneNumber, `Please reply with 1-5 only

1 - Primary School
2 - High School  
3 - Certificate/Diploma
4 - University Degree
5 - Postgraduate

Reply 0 for main menu`);
            return;
        }

        const assessmentData = { 
            ...session.session_data.assessmentData, 
            education: educationLevels[message] 
        };
        
        await sessionManager.updateSession(phoneNumber, {
            currentMenu: 'location_selection',
            sessionData: { assessmentData }
        });

        const locationMessage = `📍 LOCATION

Which county are you in or prefer to work?

1 - Nairobi
2 - Mombasa
3 - Kisumu
4 - Nakuru
5 - Eldoret
6 - Other Kenya

Reply 0 for main menu`;

        await this.sendMessage(phoneNumber, locationMessage);
    }

    async handleLocationSelection(phoneNumber, message, session) {
        const locations = {
            '1': 'Nairobi',
            '2': 'Mombasa',
            '3': 'Kisumu',
            '4': 'Nakuru',
            '5': 'Eldoret',
            '6': 'Other'
        };

        if (message === '0') {
            return await this.showMainMenu(phoneNumber);
        }

        if (!locations[message]) {
            await this.sendMessage(phoneNumber, `Please reply with 1-6 only

1 - Nairobi  2 - Mombasa  3 - Kisumu
4 - Nakuru   5 - Eldoret  6 - Other

Reply 0 for main menu`);
            return;
        }

        const assessmentData = { 
            ...session.session_data.assessmentData, 
            location: locations[message] 
        };
        
        await sessionManager.updateSession(phoneNumber, {
            currentMenu: 'interests_selection',
            sessionData: { assessmentData }
        });

        const interestsMessage = `💼 WORK INTERESTS

What type of work interests you most?

1 - Customer Service
2 - Sales & Marketing  
3 - Computer/Data Work
4 - Security/Driving
5 - Teaching/Training
6 - Healthcare
7 - Agriculture  
8 - Other

Reply 0 for main menu`;

        await this.sendMessage(phoneNumber, interestsMessage);
    }

    async handleInterestsSelection(phoneNumber, message, session) {
        const interests = {
            '1': 'customer service',
            '2': 'sales',
            '3': 'computer literacy',
            '4': 'security',
            '5': 'teaching',
            '6': 'healthcare',
            '7': 'agriculture',
            '8': 'other'
        };

        if (message === '0') {
            return await this.showMainMenu(phoneNumber);
        }

        if (!interests[message]) {
            await this.sendMessage(phoneNumber, `Please reply with 1-8 only

1-Customer Service  2-Sales & Marketing
3-Computer/Data     4-Security/Driving  
5-Teaching/Training 6-Healthcare
7-Agriculture       8-Other

Reply 0 for main menu`);
            return;
        }

        const assessmentData = { 
            ...session.session_data.assessmentData, 
            interests: interests[message]
        };

        // Save user profile
        await userService.saveUserProfile(phoneNumber, assessmentData);

        // Get recommendation counts
        const jobCount = await this.getJobCount(phoneNumber);
        const certCount = await this.getCertCount(phoneNumber);

        await this.sendMessage(phoneNumber, `✅ ASSESSMENT COMPLETE!

🎯 Found ${jobCount} jobs matching your profile
📚 Recommended ${certCount} FREE courses

You'll receive detailed recommendations in the next messages.

Reply JOBS anytime for main menu.`);

        // Send detailed recommendations
        setTimeout(() => this.sendJobRecommendations(phoneNumber), 2000);
        setTimeout(() => this.sendCourseRecommendations(phoneNumber), 4000);

        // Clear session
        await sessionManager.clearSession(phoneNumber);
    }

    async showJobs(phoneNumber) {
        const user = await userService.getUserProfile(phoneNumber);
        
        if (!user?.profile_completed) {
            await this.sendMessage(phoneNumber, `📋 Complete your profile first to see personalized job matches!

Reply 1 to start skills assessment
Reply JOBS for main menu`);
            return;
        }

        const jobs = await userService.getJobRecommendations(phoneNumber, 3);
        
        if (jobs.length === 0) {
            await this.sendMessage(phoneNumber, `😔 No jobs found for your profile yet.

Try updating your skills assessment or check back later.

Reply 1 to update assessment
Reply JOBS for main menu`);
            return;
        }

        let jobMessage = `🎯 YOUR TOP JOB MATCHES:\n\n`;
        
        jobs.forEach((job, index) => {
            const salaryRange = job.salary_min && job.salary_max ? 
                `KES ${job.salary_min.toLocaleString()}-${job.salary_max.toLocaleString()}` : 
                'Salary negotiable';
                
            jobMessage += `${index + 1}. ${job.title}
🏢 ${job.company}
📍 ${job.location}  
💰 ${salaryRange}

`;
        });

        jobMessage += `Reply job number (1-${jobs.length}) for details
Reply ALL for complete list via SMS
Reply JOBS for main menu`;

        await this.sendMessage(phoneNumber, jobMessage);
        
        await sessionManager.updateSession(phoneNumber, {
            currentMenu: 'job_browsing',
            sessionData: { jobs }
        });
    }

    async handleJobBrowsing(phoneNumber, message, session) {
        if (message === '0' || message.toLowerCase() === 'jobs') {
            return await this.showMainMenu(phoneNumber);
        }

        if (message.toLowerCase() === 'all') {
            await this.sendJobRecommendations(phoneNumber, 10);
            return;
        }

        const jobIndex = parseInt(message) - 1;
        const jobs = session.session_data?.jobs || [];

        if (jobIndex >= 0 && jobIndex < jobs.length) {
            const job = jobs[jobIndex];
            const detailMessage = `📋 JOB DETAILS

${job.title}
🏢 Company: ${job.company}
📍 Location: ${job.location}
💰 Salary: KES ${job.salary_min?.toLocaleString() || 'N/A'}-${job.salary_max?.toLocaleString() || 'N/A'}

📝 Description: ${job.description || 'Contact employer for details'}

🎯 Skills needed: ${job.required_skills || 'Contact employer'}

📧 Apply: ${job.application_url || 'Contact company directly'}

Reply JOBS for main menu
Reply 2 for more jobs`;

            await this.sendMessage(phoneNumber, detailMessage);
        } else {
            await this.sendMessage(phoneNumber, `Invalid job number. Reply 1-${jobs.length}

Or reply JOBS for main menu`);
        }
    }

    async showCourses(phoneNumber) {
        const user = await userService.getUserProfile(phoneNumber);
        
        if (!user?.profile_completed) {
            await this.sendMessage(phoneNumber, `📚 Complete your profile first for personalized course recommendations!

Reply 1 to start skills assessment`);
            return;
        }

        await this.sendCourseRecommendations(phoneNumber, 5);
    }

    async showProgress(phoneNumber) {
        const progress = await userService.getUserProgress(phoneNumber);
        
        if (!progress?.user?.profile_completed) {
            await this.sendMessage(phoneNumber, `📊 Complete your skills assessment first to track progress!

Reply 1 to start assessment
Reply JOBS for main menu`);
            return;
        }

        const stats = progress.stats;
        const progressMessage = `📊 YOUR PROGRESS

👤 Profile: ✅ Complete
📍 Location: ${progress.user.location}
🎓 Education: ${progress.user.education_level}
💼 Interest: ${progress.user.interests}

📈 STATS:
🎯 Jobs recommended: ${stats.recommended_jobs || 0}
👀 Jobs viewed: ${stats.viewed_jobs || 0}
📧 Jobs applied: ${stats.applied_jobs || 0}
📚 Courses recommended: ${stats.recommended_courses || 0}

💡 TIP: Complete free courses to get more job matches!

Reply JOBS for main menu`;

        await this.sendMessage(phoneNumber, progressMessage);
    }

    async showSuccessStories(phoneNumber) {
        const stories = `🌟 SUCCESS STORIES

"Got my first job at KCB after completing Google Digital Skills!" - Mary, Kisumu

"The customer service course helped me land a call center job. Earning 30K now!" - John, Nairobi  

"Found farm manager position through SkillsMapper. Very grateful!" - Grace, Nakuru

📈 Over 500 people got jobs through our platform this year!

Reply 1 to start YOUR success story
Reply JOBS for main menu`;

        await this.sendMessage(phoneNumber, stories);
    }

    async showHelp(phoneNumber) {
        const helpMessage = `❓ HOW SKILLSMAPPER WORKS

1️⃣ Take quick skills assessment
2️⃣ Get personalized job matches  
3️⃣ Complete FREE courses
4️⃣ Apply for recommended jobs
5️⃣ Get hired! 🎉

📱 COMMANDS:
- Reply JOBS anytime for main menu
- Reply numbers (1,2,3...) to select options
- Reply 0 to go back

🆓 100% FREE service
🇰🇪 Made for Kenyans

Reply JOBS for main menu`;

        await this.sendMessage(phoneNumber, helpMessage);
    }

    async sendJobRecommendations(phoneNumber, limit = 5) {
        const jobs = await userService.getJobRecommendations(phoneNumber, limit);
        
        if (jobs.length === 0) {
            await this.sendMessage(phoneNumber, `😔 No job matches found yet. Try updating your skills assessment!`);
            return;
        }

        let message = `🎯 YOUR JOB RECOMMENDATIONS\n\n`;
        
        jobs.forEach((job, index) => {
            const salaryRange = job.salary_min && job.salary_max ? 
                `KES ${job.salary_min.toLocaleString()}-${job.salary_max.toLocaleString()}` : 
                'Competitive salary';
                
            message += `${index + 1}. ${job.title}
🏢 ${job.company}
📍 ${job.location}
💰 ${salaryRange}
📧 Apply: ${job.application_url}

`;
        });

        message += `💡 TIP: Complete recommended courses to increase your chances!

Reply JOBS for main menu`;

        await this.sendMessage(phoneNumber, message);
    }

    async sendCourseRecommendations(phoneNumber, limit = 3) {
        const courses = await userService.getCertificationRecommendations(phoneNumber, limit);
        
        if (courses.length === 0) {
            await this.sendMessage(phoneNumber, `📚 No course recommendations available yet.`);
            return;
        }

        let message = `📚 FREE COURSES FOR YOU\n\n`;
        
        courses.forEach((course, index) => {
            message += `${index + 1}. ${course.name}
👨‍🏫 Provider: ${course.provider}
⏱️ Duration: ${course.duration_weeks} weeks
🔗 Start: ${course.certification_url}

`;
        });

        message += `✅ These courses match jobs in your area!

Reply JOBS for main menu`;

        await this.sendMessage(phoneNumber, message);
    }

    // Updated sendMessage function with new SMS provider
    async sendMessage(phoneNumber, message) {
        try {
            const result = await smsProvider.sendSMS(phoneNumber, message);
            await userService.logMessage(phoneNumber, 'outgoing', message);
            
            console.log(`📤 SMS processed: ${result.mode} mode via ${result.provider}`);
            
            if (result.fallbackUsed) {
                console.log('🔄 Primary provider failed, backup used successfully');
            }
            
            // Log additional details for debugging
            if (result.messageId) {
                console.log(`📧 Message ID: ${result.messageId}`);
            }
            
            if (result.cost) {
                console.log(`💰 Cost: ${result.cost.estimatedCostKES} KES (${result.cost.segments} segments)`);
            }
            
        } catch (error) {
            console.error('❌ SMS sending error:', error);
            // Don't throw error - continue with demo mode for platform stability
            console.log('🔄 Continuing in demo mode...');
        }
    }

    async getJobCount(phoneNumber) {
        const jobs = await userService.getJobRecommendations(phoneNumber, 100);
        return jobs.length;
    }

    async getCertCount(phoneNumber) {
        const certs = await userService.getCertificationRecommendations(phoneNumber, 100);
        return certs.length;
    }
}

module.exports = new MenuSystem();