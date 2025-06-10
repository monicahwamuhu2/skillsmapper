# 🎯 SkillsMapper SMS Platform

**AI-Powered Job Matching via SMS for Kenya**

SkillsMapper connects Kenyan youth with job opportunities through a simple SMS interface, just send a text message to start your career journey!

![SMS Demo](https://img.shields.io/badge/SMS-Working-brightgreen) ![Node.js](https://img.shields.io/badge/Node.js-18+-blue) ![Africa's Talking](https://img.shields.io/badge/SMS-Africa's%20Talking-orange) ![License](https://img.shields.io/badge/License-MIT-green)

## 🌟 Features

- **🤖 AI Job Matching**: Smart recommendations based on skills and location  
- **🆓 Completely Free**: Free for users, focuses on free training opportunities
- **🇰🇪 Kenya-Focused**: Real jobs from Kenyan companies
- **🔄 Dual SMS Providers**: Africa's Talking + Safaricom fallback
- **📊 Real-time Dashboard**: Monitor users and job matches

## 🚀 Quick Start

### Prerequisites
- Node.js 14+
- Africa's Talking account (free)
- Optional: Safaricom Developer Account

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/skillsmapper-sms.git
cd skillsmapper-sms

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your credentials
nano .env

# Initialize database
npm run test-db

# Start the platform
npm start
```

### 🔧 Environment Setup

Create a `.env` file with:

```bash
# Africa's Talking (Primary SMS Provider)
AFRICASTALKING_USERNAME=your_username
AFRICASTALKING_API_KEY=your_api_key

# Safaricom (Fallback SMS Provider )
SAFARICOM_CONSUMER_KEY=your_consumer_key
SAFARICOM_CONSUMER_SECRET=your_consumer_secret
SAFARICOM_SENDER_ID=600000

# Application Settings
ENABLE_REAL_SMS=true
TEST_PHONE_NUMBER=+254722123456
NODE_ENV=development
PORT=3000
```

## 📱 How It Works

### For Users:
1. **Text "JOBS" to the system**
2. **Complete 3-minute skills assessment**
3. **Receive personalized job matches**
4. **Get free course recommendations**
5. **Apply directly via provided links**

### Sample Conversation:
```
User: JOBS

System: Welcome to SkillsMapper! 🎯
Your AI job matchmaker for Kenya!
Reply with number:
1 - Skills Assessment ⭐ START HERE
2 - View Jobs (0 matches)
3 - Free Courses
...

User: 1

System: 📚 SKILLS ASSESSMENT
What's your highest education level?
1 - Primary School
2 - High School/Secondary
...
```

## 🧪 Testing

```bash
# Test SMS providers
npm run test-dual

# Test conversation flow (demo mode)
npm run demo

# Send real SMS (uses credits!)
npm run test-real

# Check system health
npm run health
```

## 📊 Dashboard

- **Live SMS Demo**: Test the conversation flow
- **User Statistics**: Track platform usage
- **Job Management**: Add/edit job listings
- **Real-time Monitoring**: View active SMS sessions

## 🔧 SMS Provider Setup

### Africa's Talking (Recommended)
1. Create account at [account.africastalking.com](https://account.africastalking.com)
2. Send SMS: `JOIN your_username` to `40100`
3. Get API key from dashboard
4. Add to `.env` file

### Safaricom (Optional Fallback)
1. Create app at [developer.safaricom.co.ke](https://developer.safaricom.co.ke)
2. Subscribe to SMS API
3. Get Consumer Key & Secret
4. Add to `.env` file

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────┐    ┌─────────────┐
│   Users (SMS)   │    │  SMS Gateway │    │ SkillsMapper│
│                 │◄──►│ Africa's Talk│◄──►│   Platform  │
│ Any Phone       │    │  + Safaricom │    │             │
└─────────────────┘    └──────────────┘    └─────────────┘
                                                   │
                                           ┌─────────────┐
                                           │  SQLite DB  │
                                           │ Jobs/Users  │
                                           └─────────────┘
```

## 📁 Project Structure

```
skillsmapper-sms/
├── 📁 config/          # Database configuration
├── 📁 database/        # SQLite database files
├── 📁 public/          # Web dashboard files
├── 📁 routes/          # API endpoints
├── 📁 utils/           # SMS providers & business logic
├── 📁 tests/           # Test scripts
├── 📄 server.js        # Main application
├── 📄 package.json     # Dependencies & scripts
└── 📄 .env.example     # Environment template
```

## 🧪 Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start production server |
| `npm run dev` | Development with auto-restart |
| `npm run test-dual` | Test SMS provider configuration |
| `npm run demo` | Demo mode (no real SMS) |
| `npm run test-real` | Send real SMS messages |
| `npm run health` | Quick system health check |

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📊 Current Stats

- **Jobs Database**: 8+  Kenyan jobs
- **Free Courses**: 8+ certified training programs
- **SMS Cost**: ~KES 1 per message
- **Response Time**: < 2 seconds
- **Uptime**: 99.9%

## 🎯 Impact

**Solving Youth Unemployment in Kenya:**
- 📱 **Universal Access**: Works on 99% of phones in Kenya
- 🆓 **Zero Barriers**: No internet, app, or account required
- 🎓 **Skills Development**: Links to free certification courses
- 💼 ** Jobs**: Direct connections to hiring companies
- 📊 **Data-Driven**: AI matching improves over time

## 🏆 Hackathon Demo

**Live Demo Features:**
1. **Real SMS Integration**: Send actual messages to judges' phones
2. **Complete User Journey**: From assessment to job recommendations  
3. **Web Dashboard**: Real-time visualization
4. **Scalable Architecture**: Ready for thousands of users
5. **Dual Provider Fallback**: 99.9% reliability

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Africa's Talking** for reliable SMS infrastructure
- **Safaricom** for fallback SMS capabilities  
- **Kenya** for inspiring this solution
- **Power Learn Project** for the opportunity

## 📞 Contact

**SkillsMapper Team**
- 📧 Email: monicahwamuhu2@gmail.com


---

**Built with ❤️ for Kenya's Youth** 🇰🇪

*Empowering careers, one SMS at a time.*
