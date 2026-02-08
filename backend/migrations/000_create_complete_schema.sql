-- ============================================================
-- LearnSphere Complete Database Schema
-- Separate tables for Admin, Instructor, and Learner
-- ============================================================

-- ============================================================
-- ADMIN SIDE
-- ============================================================

-- 1. Admin Login & Admin Users
CREATE TABLE IF NOT EXISTS admins (
    admin_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Manage Instructors (Admin control)
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

-- 3. Course Creation & Publish Control
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
    approval_status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. Tags
CREATE TABLE IF NOT EXISTS course_tags (
    tag_id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 5. Lesson / Content Management (Video/Doc/Image/Quiz)
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

-- 4b. Course-Tag mapping (created after both courses and tags exist)
CREATE TABLE IF NOT EXISTS course_tag_map (
    course_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    PRIMARY KEY(course_id, tag_id),
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES course_tags(tag_id) ON DELETE CASCADE
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

-- 6. Invitations (for "On Invitation" access)
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
-- INSTRUCTOR SIDE (Uses same tables but filtered by instructor_id)
-- ============================================================

-- Instructors use: courses, lessons, lesson_attachments, quizzes, etc.
-- Filtered by: created_by_instructor_id = their instructor_id

-- ============================================================
-- USER SIDE (Learner / Student)
-- ============================================================

-- 1. Learner Login
CREATE TABLE IF NOT EXISTS learners (
    learner_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    total_points INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Course Enrollment & Status
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

-- 3. Lesson Progress (per lesson tracking)
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

-- 4. Course Progress (for fast progress bar)
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

-- 5. Quizzes + Attempts + Points
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

-- 6. Points + Badges
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

-- 7. Ratings & Reviews
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
-- NEW FEATURES: Notifications & Feedback
-- ============================================================

-- Notifications (for all user types)
CREATE TABLE IF NOT EXISTS notifications (
    notification_id SERIAL PRIMARY KEY,
    user_type VARCHAR(50) NOT NULL, -- admin / instructor / learner
    user_id INTEGER NOT NULL, -- admin_id / instructor_id / learner_id
    type VARCHAR(50) NOT NULL, -- approval / course_feedback / admin_message / system
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    related_course_id INTEGER REFERENCES courses(course_id) ON DELETE SET NULL,
    related_lesson_id INTEGER REFERENCES lessons(lesson_id) ON DELETE SET NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Course Feedback (Admin to Instructor)
CREATE TABLE IF NOT EXISTS course_feedback (
    feedback_id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(course_id) ON DELETE CASCADE NOT NULL,
    admin_id INTEGER REFERENCES admins(admin_id) ON DELETE CASCADE NOT NULL,
    feedback_text TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- pending / addressed / resolved
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Lesson Files (for video/audio/image uploads)
CREATE TABLE IF NOT EXISTS lesson_files (
    file_id SERIAL PRIMARY KEY,
    lesson_id INTEGER REFERENCES lessons(lesson_id) ON DELETE CASCADE NOT NULL,
    file_type VARCHAR(50) NOT NULL, -- video / audio / image / document
    file_url TEXT NOT NULL,
    file_name VARCHAR(255),
    file_size INTEGER,
    mime_type VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Sessions (for authentication - shared across all user types)
CREATE TABLE IF NOT EXISTS sessions (
    session_id SERIAL PRIMARY KEY,
    user_type VARCHAR(50) NOT NULL, -- admin / instructor / learner
    user_id INTEGER NOT NULL, -- admin_id / instructor_id / learner_id
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- INDEXES FOR BETTER PERFORMANCE
-- ============================================================

-- Admin indexes
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);

-- Instructor indexes
CREATE INDEX IF NOT EXISTS idx_instructors_email ON instructors(email);
CREATE INDEX IF NOT EXISTS idx_instructors_active ON instructors(is_active);
CREATE INDEX IF NOT EXISTS idx_instructors_approved ON instructors(is_approved);

-- Course indexes
CREATE INDEX IF NOT EXISTS idx_courses_instructor ON courses(created_by_instructor_id);
CREATE INDEX IF NOT EXISTS idx_courses_admin ON courses(course_admin_id);
CREATE INDEX IF NOT EXISTS idx_courses_published ON courses(is_published);
CREATE INDEX IF NOT EXISTS idx_courses_slug ON courses(website_slug);

-- Lesson indexes
CREATE INDEX IF NOT EXISTS idx_lessons_course ON lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_lesson_attachments_lesson ON lesson_attachments(lesson_id);

-- Learner indexes
CREATE INDEX IF NOT EXISTS idx_learners_email ON learners(email);

-- Enrollment indexes
CREATE INDEX IF NOT EXISTS idx_enrollments_learner ON enrollments(learner_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments(status);

-- Progress indexes
CREATE INDEX IF NOT EXISTS idx_lesson_progress_learner ON lesson_progress(learner_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_course ON lesson_progress(course_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson ON lesson_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_course_progress_learner ON course_progress(learner_id);

-- Quiz indexes
CREATE INDEX IF NOT EXISTS idx_quizzes_course ON quizzes(course_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_lesson ON quizzes(lesson_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz ON quiz_questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_options_question ON quiz_options(question_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_learner ON quiz_attempts(learner_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz ON quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_answers_attempt ON quiz_answers(attempt_id);

-- Points and badges indexes
CREATE INDEX IF NOT EXISTS idx_points_ledger_learner ON points_ledger(learner_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_learner ON user_badges(learner_id);

-- Review indexes
CREATE INDEX IF NOT EXISTS idx_course_reviews_course ON course_reviews(course_id);
CREATE INDEX IF NOT EXISTS idx_course_reviews_learner ON course_reviews(learner_id);

-- Notification indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_type, user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_type, user_id, is_read);

-- Feedback indexes
CREATE INDEX IF NOT EXISTS idx_course_feedback_course ON course_feedback(course_id);
CREATE INDEX IF NOT EXISTS idx_course_feedback_admin ON course_feedback(admin_id);

-- File indexes
CREATE INDEX IF NOT EXISTS idx_lesson_files_lesson ON lesson_files(lesson_id);

-- Session indexes
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_type, user_id);

-- Invite indexes
CREATE INDEX IF NOT EXISTS idx_course_invites_course ON course_invites(course_id);
CREATE INDEX IF NOT EXISTS idx_course_invites_email ON course_invites(learner_email);
CREATE INDEX IF NOT EXISTS idx_course_invites_token ON course_invites(token);

-- ============================================================
-- INSERT SAMPLE DATA
-- ============================================================

-- Insert default admin user (password: admin123)
INSERT INTO admins (name, email, password_hash) 
VALUES ('Admin User', 'admin@learnsphere.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5aeWG/xck4aRu')
ON CONFLICT (email) DO NOTHING;

-- Insert sample instructor (password: instructor123)
INSERT INTO instructors (name, email, password_hash, is_active, is_approved) 
VALUES ('Sarah Johnson', 'instructor@learnsphere.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5aeWG/xck4aRu', TRUE, TRUE)
ON CONFLICT (email) DO NOTHING;

-- Insert sample learner (password: learner123)
INSERT INTO learners (name, email, password_hash, total_points) 
VALUES ('John Doe', 'learner@learnsphere.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5aeWG/xck4aRu', 0)
ON CONFLICT (email) DO NOTHING;

-- Insert badges
INSERT INTO badges (name, description, min_points, icon_url) 
VALUES 
    ('Newbie', 'Complete your first course', 20, 'https://example.com/badge-newbie.png'),
    ('Explorer', 'Enroll in 5 courses', 40, 'https://example.com/badge-explorer.png'),
    ('Achiever', 'Complete 10 courses', 60, 'https://example.com/badge-achiever.png'),
    ('Specialist', 'Earn 80 points', 80, 'https://example.com/badge-specialist.png'),
    ('Expert', 'Earn 100 points', 100, 'https://example.com/badge-expert.png'),
    ('Master', 'Earn 120 points', 120, 'https://example.com/badge-master.png')
ON CONFLICT (name) DO NOTHING;

-- Insert sample courses
INSERT INTO courses (created_by_instructor_id, title, description, cover_image_url, is_published, visibility, access_rule, total_duration_minutes)
SELECT 
    instructor_id,
    'Introduction to Web Development',
    'Learn HTML, CSS, and JavaScript from scratch. This comprehensive course covers everything you need to know to start building modern websites.',
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
    'Master Python programming from scratch. Start your programming journey with Python, one of the most popular and versatile languages.',
    'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=600',
    TRUE,
    'everyone',
    'open',
    90
FROM instructors
WHERE email = 'instructor@learnsphere.com'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Insert sample lessons
INSERT INTO lessons (course_id, title, lesson_type, description, duration_minutes, order_index)
SELECT 
    course_id,
    'Getting Started with Web Development',
    'document',
    '<h2>Welcome!</h2><p>In this lesson, you will learn the basics of web development and set up your environment.</p>',
    15,
    1
FROM courses
WHERE title = 'Introduction to Web Development'
LIMIT 1;

INSERT INTO lessons (course_id, title, lesson_type, description, duration_minutes, order_index)
SELECT 
    course_id,
    'HTML Fundamentals',
    'document',
    '<h2>HTML Basics</h2><p>Learn the structure of HTML documents and essential tags.</p>',
    20,
    2
FROM courses
WHERE title = 'Introduction to Web Development'
LIMIT 1;

INSERT INTO lessons (course_id, title, lesson_type, description, duration_minutes, order_index)
SELECT 
    course_id,
    'CSS Styling',
    'document',
    '<h2>CSS Fundamentals</h2><p>Learn how to style your web pages with CSS.</p>',
    25,
    3
FROM courses
WHERE title = 'Introduction to Web Development'
LIMIT 1;

-- Success message
SELECT 
    'Database schema created successfully!' as status,
    (SELECT COUNT(*) FROM admins) as admin_count,
    (SELECT COUNT(*) FROM instructors) as instructor_count,
    (SELECT COUNT(*) FROM learners) as learner_count,
    (SELECT COUNT(*) FROM courses) as course_count,
    (SELECT COUNT(*) FROM lessons) as lesson_count;
