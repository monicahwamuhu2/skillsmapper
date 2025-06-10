-- database/schema.sql

-- Users table (created from SMS interactions)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    phone_number VARCHAR(15) UNIQUE NOT NULL,
    education_level VARCHAR(50),
    location VARCHAR(100),
    interests TEXT[],
    current_step VARCHAR(50) DEFAULT 'welcome',
    profile_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SMS Sessions (track conversation state)
CREATE TABLE sms_sessions (
    id SERIAL PRIMARY KEY,
    phone_number VARCHAR(15) NOT NULL,
    session_data JSONB,
    current_menu VARCHAR(50),
    last_message TEXT,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Jobs database
CREATE TABLE jobs (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    location VARCHAR(100),
    salary_min INTEGER,
    salary_max INTEGER,
    description TEXT,
    required_skills TEXT[],
    education_requirement VARCHAR(50),
    experience_required INTEGER DEFAULT 0,
    application_url TEXT,
    source_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Free certifications/courses
CREATE TABLE certifications (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    provider VARCHAR(100) NOT NULL,
    duration_weeks INTEGER,
    skills_taught TEXT[],
    certification_url TEXT,
    difficulty_level VARCHAR(20),
    is_free BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User job recommendations
CREATE TABLE user_job_matches (
    id SERIAL PRIMARY KEY,
    user_phone VARCHAR(15) REFERENCES users(phone_number),
    job_id INTEGER REFERENCES jobs(id),
    match_score INTEGER,
    recommended_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    viewed BOOLEAN DEFAULT FALSE,
    applied BOOLEAN DEFAULT FALSE
);

-- User certification recommendations
CREATE TABLE user_cert_recommendations (
    id SERIAL PRIMARY KEY,
    user_phone VARCHAR(15) REFERENCES users(phone_number),
    certification_id INTEGER REFERENCES certifications(id),
    priority_score INTEGER,
    status VARCHAR(20) DEFAULT 'recommended', -- recommended, started, completed
    recommended_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SMS message log
CREATE TABLE sms_log (
    id SERIAL PRIMARY KEY,
    phone_number VARCHAR(15),
    message_type VARCHAR(20), -- incoming, outgoing
    message_content TEXT,
    status VARCHAR(20),
    safaricom_response JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_users_phone ON users(phone_number);
CREATE INDEX idx_jobs_skills ON jobs USING GIN(required_skills);
CREATE INDEX idx_jobs_location ON jobs(location);
CREATE INDEX idx_sms_sessions_phone ON sms_sessions(phone_number);
CREATE INDEX idx_user_matches_phone ON user_job_matches(user_phone);