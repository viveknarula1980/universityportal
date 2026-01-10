-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('student', 'faculty', 'admin')),
    student_id TEXT,
    department TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

-- Assignments Table
CREATE TABLE IF NOT EXISTS assignments (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    course TEXT NOT NULL,
    due_date INTEGER NOT NULL,
    created_at INTEGER NOT NULL
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
    created_at INTEGER NOT NULL,
    FOREIGN KEY (assignment_id) REFERENCES assignments(id),
    FOREIGN KEY (student_id) REFERENCES users(id)
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
    created_at INTEGER NOT NULL,
    FOREIGN KEY (student_id) REFERENCES users(id)
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

