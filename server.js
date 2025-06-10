// server.js
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware - Updated helmet config to allow inline scripts AND event handlers for development
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Allow inline scripts
            scriptSrcAttr: ["'unsafe-inline'"], // Allow inline event handlers (onclick, etc.)
            styleSrc: ["'self'", "'unsafe-inline'"],  // Allow inline styles
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"], // Allow AJAX requests to same origin
            fontSrc: ["'self'", "https:", "data:"],
        },
    },
}));

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files (for the dashboard)
app.use(express.static('public'));

// Handle favicon requests (prevents 404 error)
app.get('/favicon.ico', (req, res) => {
    res.status(204).send(); // No content
});

// API Routes
app.use('/api/sms', require('./routes/sms'));
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/users', require('./routes/users'));

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        service: 'SkillsMapper SMS Platform',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development'
    });
});

// Root route - serve dashboard
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API documentation endpoint
app.get('/api', (req, res) => {
    res.json({
        service: 'SkillsMapper SMS Platform API',
        version: '1.0.0',
        endpoints: {
            'GET /': 'Dashboard',
            'GET /health': 'Health check',
            'GET /api': 'This documentation',
            'POST /api/sms/webhook': 'SMS webhook for Safaricom',
            'POST /api/sms/send': 'Send SMS (testing)',
            'GET /api/sms/history/:phoneNumber': 'Get SMS history',
            'GET /api/sms/sessions': 'Get active SMS sessions',
            'GET /api/jobs': 'List all jobs',
            'GET /api/jobs/:id': 'Get job details',
            'GET /api/jobs/recommendations/:phoneNumber': 'Get job recommendations',
            'GET /api/jobs/stats/overview': 'Get job statistics',
            'POST /api/jobs': 'Create new job (admin)',
            'GET /api/users': 'List users (admin)',
            'GET /api/users/:phoneNumber': 'Get user profile',
            'GET /api/users/:phoneNumber/progress': 'Get user progress',
            'GET /api/users/:phoneNumber/certifications': 'Get user certifications',
            'DELETE /api/users/:phoneNumber': 'Delete user (GDPR)'
        },
        documentation: 'https://github.com/your-repo/skillsmapper-sms'
    });
});

// Development logging middleware
if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        if (req.url.startsWith('/api/')) {
            console.log(`📡 ${req.method} ${req.url} - ${new Date().toLocaleTimeString()}`);
        }
        next();
    });
}

// 404 handler for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({
        error: 'API Endpoint Not Found',
        message: `The endpoint ${req.method} ${req.url} does not exist`,
        suggestion: 'Visit /api for available endpoints',
        timestamp: new Date().toISOString()
    });
});

// 404 handler for all other routes
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: 'The requested resource does not exist',
        availableEndpoints: [
            'GET / - Dashboard',
            'GET /health - Health check',
            'GET /api - API documentation',
            'POST /api/sms/webhook - SMS webhook',
            'GET /api/jobs - List jobs',
            'GET /api/users - List users'
        ],
        timestamp: new Date().toISOString()
    });
});

// Global error handler
app.use((error, req, res, next) => {
    console.error('💥 Server error:', error);
    
    // Don't expose error details in production
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    res.status(500).json({
        error: 'Internal Server Error',
        message: isDevelopment ? error.message : 'Something went wrong on our end',
        stack: isDevelopment ? error.stack : undefined,
        timestamp: new Date().toISOString()
    });
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('\n🛑 SIGINT received, shutting down gracefully');
    process.exit(0);
});

// Start server
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    console.log('\n' + '='.repeat(60));
    console.log('🚀 SkillsMapper SMS Platform Started Successfully!');
    console.log('='.repeat(60));
    console.log(`📱 Dashboard:    http://localhost:${PORT}`);
    console.log(`⚡ Health Check: http://localhost:${PORT}/health`);
    console.log(`📚 API Docs:     http://localhost:${PORT}/api`);
    console.log(`📡 SMS Webhook:  http://localhost:${PORT}/api/sms/webhook`);
    console.log(`🔧 Environment:  ${process.env.NODE_ENV || 'development'}`);
    console.log('='.repeat(60));
    console.log('💡 Ready for hackathon demo!');
    console.log('='.repeat(60) + '\n');
});

// Export for testing
module.exports = { app, server };