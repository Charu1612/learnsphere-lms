-- ============================================================
-- LearnSphere Complete Database Schema
-- Project ID: aqrlbobkgsrklyyuvcuf
-- Created: February 7, 2026
-- ============================================================

-- ============================================================
-- ✅ ADMIN SIDE - Admin Management
-- ============================================================

CREATE TABLE IF NOT EXISTS admins (
    admin_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- ✅ INSTRUCTOR SIDE - Instructor Management
-- ============================================================

CREATE TABLE IF NOT EXISTS instructors (
    instructor_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- ✅ COURSE MANAGEMENT
-- ============================================================

CREATE TABLE IF NOT EXISTS courses (
    course_id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    cover_image_url TEXT,
    is_published BOOLEAN DEFAULT FALSE,
    website_slug VARCHAR(500) UNIQUE,
    visibility VARCHAR(50) DEFAULT 'everyone', -- everyone / signed_in
    access_rule VARCHAR(50) DEFAULT 'open', -- open / invitation / payment
    price DECIMAL(10, 2),
    views_count INTEGER DEFAULT 0,
    total_duration_minutes INTEGER DEFAULT 0,
    created_by_instructor_id INTEGER REFERENCES instructors(instructor_id) ON DELETE SET NULL,
    course_admin_id INTEGER REFERENCES admins(admin_id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- ✅ TAGS
-- ============================================================

CREATE TABLE IF NOT EXISTS course_tags (
    tag_id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS course_tag_map (
    course_id INTEGER REFERENCES courses(course_id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES course_tags(tag_id) ON DELETE CASCADE,
    PRIMARY KEY(course_id, tag_id)
);

-- ============================================================
-- ✅ LESSON / CONTENT MANAGEMENT
-- ============================================================

CREATE TABLE IF NOT EXISTS lessons (
    lesson_id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(course_id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(500) NOT NULL,
    lesson_type VARCHAR(50) NOT NULL, -- video / document / image / quiz
    video_url TEXT,
    duration_minutes INTEGER,
    file_url TEXT,
    image_url TEXT,
    allow_download BOOLEAN DEFAULT FALSE,
    description TEXT,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lesson_attachments (
    attachment_id SERIAL PRIMARY KEY,
    lesson_id INTEGER REFERENCES lessons(lesson_id) ON DELETE CASCADE NOT NULL,
    attachment_type VARCHAR(50) NOT NULL, -- file / link
    file_url TEXT,
    link_url TEXT,
    title VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- ✅ INVITATIONS (For invitation-based access)
-- ============================================================

CREATE TABLE IF NOT EXISTS course_invites (
    invite_id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(course_id) ON DELETE CASCADE NOT NULL,
    learner_email VARCHAR(255) NOT NULL,
    invited_by_type VARCHAR(50) NOT NULL, -- admin / instructor
    invited_by_id INTEGER,
    token VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- pending / accepted
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- ✅ LEARNER SIDE - Student Management
-- ============================================================

CREATE TABLE IF NOT EXISTS learners (
    learner_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    total_points INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- ✅ COURSE ENROLLMENT
-- ============================================================

CREATE TABLE IF NOT EXISTS enrollments (
    enrollment_id SERIAL PRIMARY KEY,
    learner_id INTEGER REFERENCES learners(learner_id) ON DELETE CASCADE NOT NULL,
    course_id INTEGER REFERENCES courses(course_id) ON DELETE CASCADE NOT NULL,
    enrolled_at TIMESTAMP DEFAULT NOW(),
    start_date TIMESTAMP,
    completed_date TIMESTAMP,
    status VARCHAR(50) DEFAULT 'yet_to_start', -- yet_to_start / in_progress / completed
    time_spent_seconds INTEGER DEFAULT 0,
    UNIQUE(learner_id, course_id)
);

-- ============================================================
-- ✅ LESSON PROGRESS TRACKING
-- ============================================================

CREATE TABLE IF NOT EXISTS lesson_progress (
    lesson_progress_id SERIAL PRIMARY KEY,
    learner_id INTEGER REFERENCES learners(learner_id) ON DELETE CASCADE NOT NULL,
    course_id INTEGER REFERENCES courses(course_id) ON DELETE CASCADE NOT NULL,
    lesson_id INTEGER REFERENCES lessons(lesson_id) ON DELETE CASCADE NOT NULL,
    status VARCHAR(50) DEFAULT 'not_started', -- not_started / in_progress / completed
    last_position_seconds INTEGER DEFAULT 0,
    completed_at TIMESTAMP,
    time_spent_seconds INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(learner_id, lesson_id)
);

-- ============================================================
-- ✅ COURSE PROGRESS (For fast progress bar)
-- ============================================================

CREATE TABLE IF NOT EXISTS course_progress (
    learner_id INTEGER REFERENCES learners(learner_id) ON DELETE CASCADE NOT NULL,
    course_id INTEGER REFERENCES courses(course_id) ON DELETE CASCADE NOT NULL,
    completion_percentage INTEGER DEFAULT 0,
    completed_lessons INTEGER DEFAULT 0,
    total_lessons INTEGER DEFAULT 0,
    last_lesson_id INTEGER REFERENCES lessons(lesson_id) ON DELETE SET NULL,
    updated_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY(learner_id, course_id)
);

-- ============================================================
-- ✅ QUIZZES
-- ============================================================

CREATE TABLE IF NOT EXISTS quizzes (
    quiz_id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(course_id) ON DELETE CASCADE NOT NULL,
    lesson_id INTEGER REFERENCES lessons(lesson_id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    points_try1 INTEGER DEFAULT 100,
    points_try2 INTEGER DEFAULT 80,
    points_try3 INTEGER DEFAULT 60,
    points_try4plus INTEGER DEFAULT 40,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quiz_questions (
    question_id SERIAL PRIMARY KEY,
    quiz_id INTEGER REFERENCES quizzes(quiz_id) ON DELETE CASCADE NOT NULL,
    question_text TEXT NOT NULL,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quiz_options (
    option_id SERIAL PRIMARY KEY,
    question_id INTEGER REFERENCES quiz_questions(question_id) ON DELETE CASCADE NOT NULL,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quiz_attempts (
    attempt_id SERIAL PRIMARY KEY,
    quiz_id INTEGER REFERENCES quizzes(quiz_id) ON DELETE CASCADE NOT NULL,
    learner_id INTEGER REFERENCES learners(learner_id) ON DELETE CASCADE NOT NULL,
    attempt_no INTEGER NOT NULL,
    score INTEGER,
    points_awarded INTEGER DEFAULT 0,
    started_at TIMESTAMP DEFAULT NOW(),
    submitted_at TIMESTAMP,
    UNIQUE(quiz_id, learner_id, attempt_no)
);

CREATE TABLE IF NOT EXISTS quiz_answers (
    answer_id SERIAL PRIMARY KEY,
    attempt_id INTEGER REFERENCES quiz_attempts(attempt_id) ON DELETE CASCADE NOT NULL,
    question_id INTEGER REFERENCES quiz_questions(question_id) ON DELETE CASCADE NOT NULL,
    selected_option_id INTEGER REFERENCES quiz_options(option_id) ON DELETE SET NULL,
    is_correct BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- ✅ POINTS & BADGES SYSTEM
-- ============================================================

CREATE TABLE IF NOT EXISTS points_ledger (
    ledger_id SERIAL PRIMARY KEY,
    learner_id INTEGER REFERENCES learners(learner_id) ON DELETE CASCADE NOT NULL,
    source_type VARCHAR(50) NOT NULL, -- quiz / bonus / course_completion
    source_id INTEGER,
    points INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS badges (
    badge_id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL, -- Newbie / Explorer / Achiever / etc
    description TEXT,
    min_points INTEGER NOT NULL,
    icon_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_badges (
    learner_id INTEGER REFERENCES learners(learner_id) ON DELETE CASCADE NOT NULL,
    badge_id INTEGER REFERENCES badges(badge_id) ON DELETE CASCADE NOT NULL,
    earned_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY(learner_id, badge_id)
);

-- ============================================================
-- ✅ RATINGS & REVIEWS
-- ============================================================

CREATE TABLE IF NOT EXISTS course_reviews (
    review_id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(course_id) ON DELETE CASCADE NOT NULL,
    learner_id INTEGER REFERENCES learners(learner_id) ON DELETE CASCADE NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(course_id, learner_id)
);

-- ============================================================
-- ✅ INDEXES FOR BETTER PERFORMANCE
-- ============================================================

CREATE INDEX idx_courses_instructor ON courses(created_by_instructor_id);
CREATE INDEX idx_courses_admin ON courses(course_admin_id);
CREATE INDEX idx_courses_slug ON courses(website_slug);
CREATE INDEX idx_lessons_course ON lessons(course_id);
CREATE INDEX idx_enrollments_learner ON enrollments(learner_id);
CREATE INDEX idx_enrollments_course ON enrollments(course_id);
CREATE INDEX idx_lesson_progress_learner ON lesson_progress(learner_id);
CREATE INDEX idx_lesson_progress_course ON lesson_progress(course_id);
CREATE INDEX idx_lesson_progress_lesson ON lesson_progress(lesson_id);
CREATE INDEX idx_quiz_attempts_learner ON quiz_attempts(learner_id);
CREATE INDEX idx_quiz_attempts_quiz ON quiz_attempts(quiz_id);
CREATE INDEX idx_quiz_questions_quiz ON quiz_questions(quiz_id);
CREATE INDEX idx_quiz_options_question ON quiz_options(question_id);
CREATE INDEX idx_points_ledger_learner ON points_ledger(learner_id);
CREATE INDEX idx_user_badges_learner ON user_badges(learner_id);
CREATE INDEX idx_course_reviews_learner ON course_reviews(learner_id);
CREATE INDEX idx_course_reviews_course ON course_reviews(course_id);
CREATE INDEX idx_course_invites_course ON course_invites(course_id);
CREATE INDEX idx_course_invites_email ON course_invites(learner_email);
CREATE INDEX idx_course_invites_token ON course_invites(token);

-- ============================================================
-- ✅ INSERT SAMPLE ADMIN & INSTRUCTOR DATA
-- ============================================================

-- Admin User (Password: admin123 - hashed with bcrypt)
INSERT INTO admins (name, email, password_hash) 
VALUES ('Admin User', 'admin@learnsphere.com', '$2b$12$abcdefghijklmnopqrstuvwxyz')
ON CONFLICT (email) DO NOTHING;

-- Sample Instructor (Password: instructor123 - hashed with bcrypt)
INSERT INTO instructors (name, email, password_hash, is_active) 
VALUES ('John Instructor', 'instructor@learnsphere.com', '$2b$12$abcdefghijklmnopqrstuvwxyz', TRUE)
ON CONFLICT (email) DO NOTHING;

-- Sample Badge
INSERT INTO badges (name, description, min_points, icon_url) 
VALUES 
    ('Newbie', 'Complete your first course', 0, 'https://example.com/badge-newbie.png'),
    ('Explorer', 'Enroll in 5 courses', 50, 'https://example.com/badge-explorer.png'),
    ('Achiever', 'Complete 10 courses', 200, 'https://example.com/badge-achiever.png'),
    ('Expert', 'Earn 1000 points', 1000, 'https://example.com/badge-expert.png')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- ✅ FINAL SETUP COMPLETE
-- ============================================================
-- Run this SQL file to create all tables
-- Then run the Python setup script to insert hashed passwords
