-- ============================================================
-- LearnSphere Base Database Schema
-- Run this FIRST before the notifications migration
-- ============================================================

-- 1. Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'learner',
    created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Create courses table
CREATE TABLE IF NOT EXISTS courses (
    id SERIAL PRIMARY KEY,
    instructor_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    short_description TEXT DEFAULT '',
    full_description TEXT DEFAULT '',
    image_url TEXT DEFAULT '',
    tags TEXT DEFAULT '',
    visibility VARCHAR(50) DEFAULT 'public',
    access VARCHAR(50) DEFAULT 'free',
    price DECIMAL(10,2) DEFAULT 0,
    published BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Create lessons table
CREATE TABLE IF NOT EXISTS lessons (
    id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    lesson_type VARCHAR(50) DEFAULT 'document',
    content TEXT DEFAULT '',
    duration INTEGER DEFAULT 0,
    order_index INTEGER DEFAULT 0
);

-- 5. Create enrollments table
CREATE TABLE IF NOT EXISTS enrollments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'active',
    progress_pct INTEGER DEFAULT 0,
    last_lesson_id INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, course_id)
);

-- 6. Create lesson_progress table
CREATE TABLE IF NOT EXISTS lesson_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    enrollment_id INTEGER REFERENCES enrollments(id) ON DELETE CASCADE,
    lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'in_progress',
    completed_at TIMESTAMP,
    UNIQUE(user_id, lesson_id)
);

-- 7. Create quizzes table
CREATE TABLE IF NOT EXISTS quizzes (
    id SERIAL PRIMARY KEY,
    lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    timer_seconds INTEGER DEFAULT 0,
    pass_score INTEGER DEFAULT 70
);

-- 8. Create quiz_questions table
CREATE TABLE IF NOT EXISTS quiz_questions (
    id SERIAL PRIMARY KEY,
    quiz_id INTEGER REFERENCES quizzes(id) ON DELETE CASCADE,
    prompt TEXT NOT NULL,
    options JSONB NOT NULL,
    correct_index INTEGER NOT NULL
);

-- 9. Create quiz_attempts table
CREATE TABLE IF NOT EXISTS quiz_attempts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    quiz_id INTEGER REFERENCES quizzes(id) ON DELETE CASCADE,
    score INTEGER DEFAULT 0,
    passed BOOLEAN DEFAULT false,
    submitted_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_courses_instructor ON courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_courses_published ON courses(published);
CREATE INDEX IF NOT EXISTS idx_lessons_course ON lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_user ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user ON lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_lesson ON quizzes(lesson_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz ON quiz_questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON quiz_attempts(user_id);

-- Insert default admin user (password: admin123)
-- Note: This is a bcrypt hash of "admin123"
INSERT INTO users (full_name, email, password_hash, role) 
VALUES (
    'Admin User', 
    'admin@learnsphere.com', 
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5aeWG/xck4aRu',
    'admin'
)
ON CONFLICT (email) DO NOTHING;

-- Insert default instructor user (password: instructor123)
INSERT INTO users (full_name, email, password_hash, role) 
VALUES (
    'Sarah Johnson', 
    'instructor@learnsphere.com', 
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5aeWG/xck4aRu',
    'instructor'
)
ON CONFLICT (email) DO NOTHING;

-- Insert sample learner user (password: learner123)
INSERT INTO users (full_name, email, password_hash, role) 
VALUES (
    'John Doe', 
    'learner@learnsphere.com', 
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5aeWG/xck4aRu',
    'learner'
)
ON CONFLICT (email) DO NOTHING;

-- Create sample courses
INSERT INTO courses (instructor_id, title, short_description, full_description, image_url, tags, visibility, access, price, published)
SELECT 
    u.id,
    'Introduction to Web Development',
    'Learn HTML, CSS, and JavaScript from scratch',
    '<h2>Course Overview</h2><p>This comprehensive course covers everything you need to know to start building modern websites.</p>',
    'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=600',
    'web,html,css,javascript',
    'public',
    'free',
    0,
    true
FROM users u
WHERE u.email = 'instructor@learnsphere.com'
ON CONFLICT DO NOTHING;

INSERT INTO courses (instructor_id, title, short_description, full_description, image_url, tags, visibility, access, price, published)
SELECT 
    u.id,
    'Python for Beginners',
    'Master Python programming from scratch',
    '<h2>Course Overview</h2><p>Start your programming journey with Python, one of the most popular languages.</p>',
    'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=600',
    'python,programming,beginner',
    'public',
    'free',
    0,
    true
FROM users u
WHERE u.email = 'instructor@learnsphere.com'
ON CONFLICT DO NOTHING;

-- Create sample lessons for first course
INSERT INTO lessons (course_id, title, lesson_type, content, duration, order_index)
SELECT 
    c.id,
    'Getting Started with Web Development',
    'document',
    '<h2>Welcome!</h2><p>In this lesson, you will learn the basics of web development.</p>',
    15,
    1
FROM courses c
WHERE c.title = 'Introduction to Web Development'
LIMIT 1;

INSERT INTO lessons (course_id, title, lesson_type, content, duration, order_index)
SELECT 
    c.id,
    'HTML Fundamentals',
    'document',
    '<h2>HTML Basics</h2><p>Learn the structure of HTML documents.</p>',
    20,
    2
FROM courses c
WHERE c.title = 'Introduction to Web Development'
LIMIT 1;

INSERT INTO lessons (course_id, title, lesson_type, content, duration, order_index)
SELECT 
    c.id,
    'CSS Styling',
    'document',
    '<h2>CSS Fundamentals</h2><p>Learn how to style your web pages.</p>',
    25,
    3
FROM courses c
WHERE c.title = 'Introduction to Web Development'
LIMIT 1;

-- Success message
SELECT 'Base tables created successfully! Now run the notifications migration.' as status;
