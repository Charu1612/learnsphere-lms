-- ============================================================
-- LearnSphere Complete Database Schema
-- Tables created in dependency order with inline foreign keys
-- ============================================================

-- ============================================================
-- STEP 1: BASE TABLES (No dependencies)
-- ============================================================

-- Admin table
CREATE TABLE IF NOT EXISTS admins (
    admin_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Instructors table
CREATE TABLE IF NOT EXISTS instructors (
    instructor_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_approved BOOLEAN DEFAULT FALSE,
    approved_by INTEGER REFERENCES admins(admin_id),
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Learners table
CREATE TABLE IF NOT EXISTS learners (
    learner_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    total_points INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tags table
CREATE TABLE IF NOT EXISTS course_tags (
    tag_id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Badges table
CREATE TABLE IF NOT EXISTS badges (
    badge_id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    min_points INTEGER NOT NULL,
    icon_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- STEP 2: COURSES TABLE (Depends on instructors and admins)
-- ============================================================

CREATE TABLE IF NOT EXISTS courses (
    course_id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    cover_image_url TEXT,
    is_published BOOLEAN DEFAULT FALSE,
    website_slug VARCHAR(500) UNIQUE,
    visibility VARCHAR(50) DEFAULT 'everyone',
    access_rule VARCHAR(50) DEFAULT 'open',
    price DECIMAL(10, 2),
    views_count INTEGER DEFAULT 0,
    total_duration_minutes INTEGER DEFAULT 0,
    created_by_instructor_id INTEGER REFERENCES instructors(instructor_id) ON DELETE SET NULL,
    course_admin_id INTEGER REFERENCES admins(admin_id) ON DELETE SET NULL,
    approval_status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- STEP 3: COURSE-RELATED TABLES
-- ============================================================

-- Course-Tag mapping
CREATE TABLE IF NOT EXISTS course_tag_map (
    course_id INTEGER NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES course_tags(tag_id) ON DELETE CASCADE,
    PRIMARY KEY(course_id, tag_id)
);

-- Course invites
CREATE TABLE IF NOT EXISTS course_invites (
    invite_id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
    learner_email VARCHAR(255) NOT NULL,
    invited_by_type VARCHAR(50) NOT NULL,
    invited_by_id INTEGER,
    token VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Course feedback
CREATE TABLE IF NOT EXISTS course_feedback (
    feedback_id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
    admin_id INTEGER NOT NULL REFERENCES admins(admin_id) ON DELETE CASCADE,
    feedback_text TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Course reviews
CREATE TABLE IF NOT EXISTS course_reviews (
    review_id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
    learner_id INTEGER NOT NULL REFERENCES learners(learner_id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(course_id, learner_id)
);

-- Enrollments
CREATE TABLE IF NOT EXISTS enrollments (
    enrollment_id SERIAL PRIMARY KEY,
    learner_id INTEGER NOT NULL REFERENCES learners(learner_id) ON DELETE CASCADE,
    course_id INTEGER NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP DEFAULT NOW(),
    start_date TIMESTAMP,
    completed_date TIMESTAMP,
    status VARCHAR(50) DEFAULT 'yet_to_start',
    time_spent_seconds INTEGER DEFAULT 0,
    UNIQUE(learner_id, course_id)
);

-- ============================================================
-- STEP 4: LESSONS TABLE (Depends on courses)
-- ============================================================

CREATE TABLE IF NOT EXISTS lessons (
    lesson_id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    lesson_type VARCHAR(50) NOT NULL,
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

-- ============================================================
-- STEP 5: LESSON-RELATED TABLES
-- ============================================================

-- Lesson attachments
CREATE TABLE IF NOT EXISTS lesson_attachments (
    attachment_id SERIAL PRIMARY KEY,
    lesson_id INTEGER NOT NULL REFERENCES lessons(lesson_id) ON DELETE CASCADE,
    attachment_type VARCHAR(50) NOT NULL,
    file_url TEXT,
    link_url TEXT,
    title VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Lesson files
CREATE TABLE IF NOT EXISTS lesson_files (
    file_id SERIAL PRIMARY KEY,
    lesson_id INTEGER NOT NULL REFERENCES lessons(lesson_id) ON DELETE CASCADE,
    file_type VARCHAR(50) NOT NULL,
    file_url TEXT NOT NULL,
    file_name VARCHAR(255),
    file_size INTEGER,
    mime_type VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Lesson progress
CREATE TABLE IF NOT EXISTS lesson_progress (
    lesson_progress_id SERIAL PRIMARY KEY,
    learner_id INTEGER NOT NULL REFERENCES learners(learner_id) ON DELETE CASCADE,
    course_id INTEGER NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
    lesson_id INTEGER NOT NULL REFERENCES lessons(lesson_id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'not_started',
    last_position_seconds INTEGER DEFAULT 0,
    completed_at TIMESTAMP,
    time_spent_seconds INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(learner_id, lesson_id)
);

-- ============================================================
-- STEP 6: COURSE PROGRESS (Depends on lessons)
-- ============================================================

CREATE TABLE IF NOT EXISTS course_progress (
    learner_id INTEGER NOT NULL REFERENCES learners(learner_id) ON DELETE CASCADE,
    course_id INTEGER NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
    completion_percentage INTEGER DEFAULT 0,
    completed_lessons INTEGER DEFAULT 0,
    total_lessons INTEGER DEFAULT 0,
    last_lesson_id INTEGER REFERENCES lessons(lesson_id) ON DELETE SET NULL,
    updated_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY(learner_id, course_id)
);

-- ============================================================
-- STEP 7: QUIZZES (Depends on courses and lessons)
-- ============================================================

CREATE TABLE IF NOT EXISTS quizzes (
    quiz_id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
    lesson_id INTEGER REFERENCES lessons(lesson_id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    points_try1 INTEGER DEFAULT 100,
    points_try2 INTEGER DEFAULT 80,
    points_try3 INTEGER DEFAULT 60,
    points_try4plus INTEGER DEFAULT 40,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- STEP 8: QUIZ-RELATED TABLES
-- ============================================================

-- Quiz questions
CREATE TABLE IF NOT EXISTS quiz_questions (
    question_id SERIAL PRIMARY KEY,
    quiz_id INTEGER NOT NULL REFERENCES quizzes(quiz_id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Quiz options
CREATE TABLE IF NOT EXISTS quiz_options (
    option_id SERIAL PRIMARY KEY,
    question_id INTEGER NOT NULL REFERENCES quiz_questions(question_id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Quiz attempts
CREATE TABLE IF NOT EXISTS quiz_attempts (
    attempt_id SERIAL PRIMARY KEY,
    quiz_id INTEGER NOT NULL REFERENCES quizzes(quiz_id) ON DELETE CASCADE,
    learner_id INTEGER NOT NULL REFERENCES learners(learner_id) ON DELETE CASCADE,
    attempt_no INTEGER NOT NULL,
    score INTEGER,
    points_awarded INTEGER DEFAULT 0,
    started_at TIMESTAMP DEFAULT NOW(),
    submitted_at TIMESTAMP,
    UNIQUE(quiz_id, learner_id, attempt_no)
);

-- Quiz answers
CREATE TABLE IF NOT EXISTS quiz_answers (
    answer_id SERIAL PRIMARY KEY,
    attempt_id INTEGER NOT NULL REFERENCES quiz_attempts(attempt_id) ON DELETE CASCADE,
    question_id INTEGER NOT NULL REFERENCES quiz_questions(question_id) ON DELETE CASCADE,
    selected_option_id INTEGER REFERENCES quiz_options(option_id) ON DELETE SET NULL,
    is_correct BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- STEP 9: POINTS AND BADGES
-- ============================================================

-- Points ledger
CREATE TABLE IF NOT EXISTS points_ledger (
    ledger_id SERIAL PRIMARY KEY,
    learner_id INTEGER NOT NULL REFERENCES learners(learner_id) ON DELETE CASCADE,
    source_type VARCHAR(50) NOT NULL,
    source_id INTEGER,
    points INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- User badges
CREATE TABLE IF NOT EXISTS user_badges (
    learner_id INTEGER NOT NULL REFERENCES learners(learner_id) ON DELETE CASCADE,
    badge_id INTEGER NOT NULL REFERENCES badges(badge_id) ON DELETE CASCADE,
    earned_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY(learner_id, badge_id)
);

-- ============================================================
-- STEP 10: NOTIFICATIONS AND SESSIONS
-- ============================================================

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    notification_id SERIAL PRIMARY KEY,
    user_type VARCHAR(50) NOT NULL,
    user_id INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    related_course_id INTEGER REFERENCES courses(course_id) ON DELETE SET NULL,
    related_lesson_id INTEGER REFERENCES lessons(lesson_id) ON DELETE SET NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Sessions
CREATE TABLE IF NOT EXISTS sessions (
    session_id SERIAL PRIMARY KEY,
    user_type VARCHAR(50) NOT NULL,
    user_id INTEGER NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- STEP 11: CREATE INDEXES FOR PERFORMANCE
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);
CREATE INDEX IF NOT EXISTS idx_instructors_email ON instructors(email);
CREATE INDEX IF NOT EXISTS idx_instructors_active ON instructors(is_active);
CREATE INDEX IF NOT EXISTS idx_instructors_approved ON instructors(is_approved);
CREATE INDEX IF NOT EXISTS idx_courses_instructor ON courses(created_by_instructor_id);
CREATE INDEX IF NOT EXISTS idx_courses_admin ON courses(course_admin_id);
CREATE INDEX IF NOT EXISTS idx_courses_published ON courses(is_published);
CREATE INDEX IF NOT EXISTS idx_courses_slug ON courses(website_slug);
CREATE INDEX IF NOT EXISTS idx_lessons_course ON lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_lesson_attachments_lesson ON lesson_attachments(lesson_id);
CREATE INDEX IF NOT EXISTS idx_learners_email ON learners(email);
CREATE INDEX IF NOT EXISTS idx_enrollments_learner ON enrollments(learner_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments(status);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_learner ON lesson_progress(learner_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_course ON lesson_progress(course_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson ON lesson_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_course_progress_learner ON course_progress(learner_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_course ON quizzes(course_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_lesson ON quizzes(lesson_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz ON quiz_questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_options_question ON quiz_options(question_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_learner ON quiz_attempts(learner_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz ON quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_answers_attempt ON quiz_answers(attempt_id);
CREATE INDEX IF NOT EXISTS idx_points_ledger_learner ON points_ledger(learner_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_learner ON user_badges(learner_id);
CREATE INDEX IF NOT EXISTS idx_course_reviews_course ON course_reviews(course_id);
CREATE INDEX IF NOT EXISTS idx_course_reviews_learner ON course_reviews(learner_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_type, user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_type, user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_course_feedback_course ON course_feedback(course_id);
CREATE INDEX IF NOT EXISTS idx_course_feedback_admin ON course_feedback(admin_id);
CREATE INDEX IF NOT EXISTS idx_lesson_files_lesson ON lesson_files(lesson_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_type, user_id);
CREATE INDEX IF NOT EXISTS idx_course_invites_course ON course_invites(course_id);
CREATE INDEX IF NOT EXISTS idx_course_invites_email ON course_invites(learner_email);
CREATE INDEX IF NOT EXISTS idx_course_invites_token ON course_invites(token);

-- ============================================================
-- STEP 12: INSERT SAMPLE DATA
-- ============================================================

-- Insert admin (password: admin123)
INSERT INTO admins (name, email, password_hash) 
VALUES ('Admin User', 'admin@learnsphere.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5aeWG/xck4aRu')
ON CONFLICT (email) DO NOTHING;

-- Insert instructor (password: instructor123)
INSERT INTO instructors (name, email, password_hash, is_active, is_approved) 
VALUES ('Sarah Johnson', 'instructor@learnsphere.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5aeWG/xck4aRu', TRUE, TRUE)
ON CONFLICT (email) DO NOTHING;

-- Insert learner (password: learner123)
INSERT INTO learners (name, email, password_hash, total_points) 
VALUES ('John Doe', 'learner@learnsphere.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5aeWG/xck4aRu', 0)
ON CONFLICT (email) DO NOTHING;

-- Insert badges
INSERT INTO badges (name, description, min_points) 
VALUES 
    ('Newbie', 'Complete your first course', 20),
    ('Explorer', 'Enroll in 5 courses', 40),
    ('Achiever', 'Complete 10 courses', 60),
    ('Specialist', 'Earn 80 points', 80),
    ('Expert', 'Earn 100 points', 100),
    ('Master', 'Earn 120 points', 120)
ON CONFLICT (name) DO NOTHING;

-- Insert sample courses
INSERT INTO courses (created_by_instructor_id, title, description, cover_image_url, is_published, visibility, access_rule, total_duration_minutes)
SELECT 
    instructor_id,
    'Introduction to Web Development',
    'Learn HTML, CSS, and JavaScript from scratch',
    'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=600',
    TRUE,
    'everyone',
    'open',
    60
FROM instructors
WHERE email = 'instructor@learnsphere.com'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO courses (created_by_instructor_id, title, description, cover_image_url, is_published, visibility, access_rule, total_duration_minutes)
SELECT 
    instructor_id,
    'Python for Beginners',
    'Master Python programming from scratch',
    'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=600',
    TRUE,
    'everyone',
    'open',
    90
FROM instructors
WHERE email = 'instructor@learnsphere.com'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Insert sample lessons for Web Development course
INSERT INTO lessons (course_id, title, lesson_type, description, duration_minutes, order_index)
SELECT 
    course_id,
    'Getting Started',
    'document',
    '<h2>Welcome!</h2><p>Learn the basics of web development.</p>',
    15,
    1
FROM courses
WHERE title = 'Introduction to Web Development'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, lesson_type, description, duration_minutes, order_index)
SELECT 
    course_id,
    'HTML Fundamentals',
    'document',
    '<h2>HTML Basics</h2><p>Learn HTML structure and elements.</p>',
    20,
    2
FROM courses
WHERE title = 'Introduction to Web Development'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, lesson_type, description, duration_minutes, order_index)
SELECT 
    course_id,
    'CSS Styling',
    'document',
    '<h2>CSS Fundamentals</h2><p>Learn CSS styling and layouts.</p>',
    25,
    3
FROM courses
WHERE title = 'Introduction to Web Development'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Success message
SELECT 
    'Database schema created successfully!' as status,
    (SELECT COUNT(*) FROM admins) as admin_count,
    (SELECT COUNT(*) FROM instructors) as instructor_count,
    (SELECT COUNT(*) FROM learners) as learner_count,
    (SELECT COUNT(*) FROM courses) as course_count,
    (SELECT COUNT(*) FROM lessons) as lesson_count,
    (SELECT COUNT(*) FROM badges) as badge_count;
