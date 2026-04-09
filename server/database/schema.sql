-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('student', 'faculty', 'admin', 'super_admin')),
    student_id TEXT,
    department TEXT,
    google_id TEXT UNIQUE,
    is_verified BOOLEAN DEFAULT 0,
    university_id TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (university_id) REFERENCES university_settings(id)
);

-- OTP Codes Table
CREATE TABLE IF NOT EXISTS otp_codes (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL
);

-- Assignments Table
CREATE TABLE IF NOT EXISTS assignments (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    course TEXT NOT NULL,
    stream TEXT,
    due_date INTEGER NOT NULL,
    university_id TEXT,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (university_id) REFERENCES university_settings(id)
);

-- Submissions Table
CREATE TABLE IF NOT EXISTS submissions (
    id TEXT PRIMARY KEY,
    assignment_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_hash TEXT NOT NULL,
    ai_usage_type TEXT NOT NULL CHECK(ai_usage_type IN ('none', 'partial', 'full')),
    ai_token_count INTEGER DEFAULT 0,
    blockchain_hash TEXT,
    timestamp INTEGER NOT NULL,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'graded', 'late')),
    grade TEXT,
    university_id TEXT,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (assignment_id) REFERENCES assignments(id),
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (university_id) REFERENCES university_settings(id)
);

-- Certificates Table
CREATE TABLE IF NOT EXISTS certificates (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    student_name TEXT NOT NULL,
    degree_name TEXT NOT NULL,
    degree_type TEXT NOT NULL,
    issue_date INTEGER NOT NULL,
    blockchain_hash TEXT,
    revocation_status INTEGER DEFAULT 0,
    university_signature TEXT,
    qr_code_url TEXT,
    university_id TEXT,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (university_id) REFERENCES university_settings(id)
);

-- AI Usage Table
CREATE TABLE IF NOT EXISTS ai_usage (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    tokens_used INTEGER NOT NULL,
    context_window INTEGER NOT NULL,
    semester TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- AI Limits Table
CREATE TABLE IF NOT EXISTS ai_limits (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    tokens_per_semester INTEGER NOT NULL,
    context_window INTEGER NOT NULL,
    semester TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    action TEXT NOT NULL,
    target_type TEXT,
    target_id TEXT,
    blockchain_hash TEXT,
    details TEXT,
    timestamp INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Blockchain Records Table
CREATE TABLE IF NOT EXISTS blockchain_records (
    id TEXT PRIMARY KEY,
    record_type TEXT NOT NULL CHECK(record_type IN ('submission', 'certificate', 'audit')),
    record_id TEXT NOT NULL,
    blockchain_hash TEXT NOT NULL UNIQUE,
    transaction_data TEXT NOT NULL,
    block_number INTEGER,
    timestamp INTEGER NOT NULL,
    created_at INTEGER NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_submissions_student ON submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_certificates_student ON certificates(student_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_hash ON blockchain_records(blockchain_hash);
CREATE INDEX IF NOT EXISTS idx_ai_usage_user ON ai_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_users_department ON users(department);

-- Departments Table
CREATE TABLE IF NOT EXISTS departments (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    university_id TEXT,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (university_id) REFERENCES university_settings(id)
);

-- Settings Table
CREATE TABLE IF NOT EXISTS university_settings (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE,
    university_name TEXT,
    primary_color TEXT,
    logo_url TEXT,
    updated_at INTEGER NOT NULL
);

-- Innovation Hub: Projects
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    stream_tags TEXT, -- Comma separated for matching
    creator_id TEXT NOT NULL,
    university_id TEXT,
    status TEXT DEFAULT 'open',
    created_at INTEGER NOT NULL,
    FOREIGN KEY (creator_id) REFERENCES users(id),
    FOREIGN KEY (university_id) REFERENCES university_settings(id)
);

-- Project Members
CREATE TABLE IF NOT EXISTS project_members (
    project_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT,
    joined_at INTEGER NOT NULL,
    PRIMARY KEY (project_id, user_id),
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Public Portfolio Settings
CREATE TABLE IF NOT EXISTS public_profiles (
    user_id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    bio TEXT,
    is_public BOOLEAN DEFAULT 0,
    portfolio_data TEXT, -- JSON settings (which assignments to show)
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

