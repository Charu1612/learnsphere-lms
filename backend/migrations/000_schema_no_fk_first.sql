-- ============================================================
-- LearnSphere Complete Database Schema
-- Step 1: Create all tables WITHOUT foreign keys
-- Step 2: Add foreign keys after all tables exist
-- ============================================================

-- ============================================================
-- STEP 1: CREATE ALL TABLES (No Foreign Keys)
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
    approved_by INTEGER,
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Courses table
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
    created_by_instructor_id INTEGER,
    course_admin_id INTEGER,
    approval_status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tags table
CREATE TABLE IF NOT EXISTS course_tags (
    tag_id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Course-Tag mapping
CREATE TABLE IF NOT EXISTS course_tag_map (
    course_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    PRIMARY KEY(course_id, tag_id)
);

-- Lessons table
CREATE TABLE IF NOT EXISTS lessons (
    lesson_id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL,
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

-- Lesson attachments
CREATE TABLE IF NOT EXISTS lesson_attachments (
    attachment_id SERIAL PRIMARY KEY,
    lesson_id INTEGER NOT NULL,
    attachment_type VARCHAR(50) NOT NULL,
    file_url TEXT,
    link_url TEXT,
    title VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Course invites
CREATE TABLE IF NOT EXISTS course_invites (
    invite_id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL,
    learner_email VARCHAR(255) NOT NULL,
    invited_by_type VARCHAR(50) NOT NULL,
    invited_by_id INTEGER,
    token VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    expires_at TIMESTAMP,
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

-- Enrollments
CREATE TABLE IF NOT EXISTS enrollments (
    enrollment_id SERIAL PRIMARY KEY,
    learner_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    enrolled_at TIMESTAMP DEFAULT NOW(),
    start_date TIMESTAMP,
    completed_date TIMESTAMP,
    status VARCHAR(50) DEFAULT 'yet_to_start',
    time_spent_seconds INTEGER DEFAULT 0,
    UNIQUE(learner_id, course_id)
);

-- Lesson progress
CREATE TABLE IF NOT EXISTS lesson_progress (
    lesson_progress_id SERIAL PRIMARY KEY,
    learner_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    lesson_id INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'not_started',
    last_position_seconds INTEGER DEFAULT 0,
    completed_at TIMESTAMP,
    time_spent_seconds INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(learner_id, lesson_id)
);

-- Course progress
CREATE TABLE IF NOT EXISTS course_progress (
    learner_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    completion_percentage INTEGER DEFAULT 0,
    completed_lessons INTEGER DEFAULT 0,
    total_lessons INTEGER DEFAULT 0,
    last_lesson_id INTEGER,
    updated_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY(learner_id, course_id)
);

-- Quizzes
CREATE TABLE IF NOT EXISTS quizzes (
    quiz_id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL,
    lesson_id INTEGER,
    title VARCHAR(500) NOT NULL,
    points_try1 INTEGER DEFAULT 100,
    points_try2 INTEGER DEFAULT 80,
    points_try3 INTEGER DEFAULT 60,
    points_try4plus INTEGER DEFAULT 40,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Quiz questions
CREATE TABLE IF NOT EXISTS quiz_questions (
    question_id SERIAL PRIMARY KEY,
    quiz_id INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Quiz options
CREATE TABLE IF NOT EXISTS quiz_options (
    option_id SERIAL PRIMARY KEY,
    question_id INTEGER NOT NULL,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Quiz attempts
CREATE TABLE IF NOT EXISTS quiz_attempts (
    attempt_id SERIAL PRIMARY KEY,
    quiz_id INTEGER NOT NULL,
    learner_id INTEGER NOT NULL,
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
    attempt_id INTEGER NOT NULL,
    question_id INTEGER NOT NULL,
    selected_option_id INTEGER,
    is_correct BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Points ledger
CREATE TABLE IF NOT EXISTS points_ledger (
    ledger_id SERIAL PRIMARY KEY,
    learner_id INTEGER NOT NULL,
    source_type VARCHAR(50) NOT NULL,
    source_id INTEGER,
    points INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Badges
CREATE TABLE IF NOT EXISTS badges (
    badge_id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    min_points INTEGER NOT NULL,
    icon_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- User badges
CREATE TABLE IF NOT EXISTS user_badges (
    learner_id INTEGER NOT NULL,
    badge_id INTEGER NOT NULL,
    earned_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY(learner_id, badge_id)
);

-- Course reviews
CREATE TABLE IF NOT EXISTS course_reviews (
    review_id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL,
    learner_id INTEGER NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(course_id, learner_id)
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    notification_id SERIAL PRIMARY KEY,
    user_type VARCHAR(50) NOT NULL,
    user_id INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    related_course_id INTEGER,
    related_lesson_id INTEGER,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Course feedback
CREATE TABLE IF NOT EXISTS course_feedback (
    feedback_id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL,
    admin_id INTEGER NOT NULL,
    feedback_text TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Lesson files
CREATE TABLE IF NOT EXISTS lesson_files (
    file_id SERIAL PRIMARY KEY,
    lesson_id INTEGER NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_url TEXT NOT NULL,
    file_name VARCHAR(255),
    file_size INTEGER,
    mime_type VARCHAR(100),
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
-- STEP 2: ADD FOREIGN KEY CONSTRAINTS
-- ============================================================

-- Instructors foreign keys
ALTER TABLE instructors 
ADD CONSTRAINT fk_instructors_approved_by 
FOREIGN KEY (approved_by) REFERENCES admins(admin_id);

-- Courses foreign keys
ALTER TABLE courses 
ADD CONSTRAINT fk_courses_instructor 
FOREIGN KEY (created_by_instructor_id) REFERENCES instructors(instructor_id) ON DELETE SET NULL;

ALTER TABLE courses 
ADD CONSTRAINT fk_courses_admin 
FOREIGN KEY (course_admin_id) REFERENCES admins(admin_id) ON DELETE SET NULL;

-- Course tag map foreign keys
ALTER TABLE course_tag_map 
ADD CONSTRAINT fk_course_tag_map_course 
FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE;

ALTER TABLE course_tag_map 
ADD CONSTRAINT fk_course_tag_map_tag 
FOREIGN KEY (tag_id) REFERENCES course_tags(tag_id) ON DELETE CASCADE;

-- Lessons foreign keys
ALTER TABLE lessons 
ADD CONSTRAINT fk_lessons_course 
FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE;

-- Lesson attachments foreign keys
ALTER TABLE lesson_attachments 
ADD CONSTRAINT fk_lesson_attachments_lesson 
FOREIGN KEY (lesson_id) REFERENCES lessons(lesson_id) ON DELETE CASCADE;

-- Course invites foreign keys
ALTER TABLE course_invites 
ADD CONSTRAINT fk_course_invites_course 
FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE;

-- Enrollments foreign keys
ALTER TABLE enrollments 
ADD CONSTRAINT fk_enrollments_learner 
FOREIGN KEY (learner_id) REFERENCES learners(learner_id) ON DELETE CASCADE;

ALTER TABLE enrollments 
ADD CONSTRAINT fk_enrollments_course 
FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE;

-- Lesson progress foreign keys
ALTER TABLE lesson_progress 
ADD CONSTRAINT fk_lesson_progress_learner 
FOREIGN KEY (learner_id) REFERENCES learners(learner_id) ON DELETE CASCADE;

ALTER TABLE lesson_progress 
ADD CONSTRAINT fk_lesson_progress_course 
FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE;

ALTER TABLE lesson_progress 
ADD CONSTRAINT fk_lesson_progress_lesson 
FOREIGN KEY (lesson_id) REFERENCES lessons(lesson_id) ON DELETE CASCADE;

-- Course progress foreign keys
ALTER TABLE course_progress 
ADD CONSTRAINT fk_course_progress_learner 
FOREIGN KEY (learner_id) REFERENCES learners(learner_id) ON DELETE CASCADE;

ALTER TABLE course_progress 
ADD CONSTRAINT fk_course_progress_course 
FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE;

ALTER TABLE course_progress 
ADD CONSTRAINT fk_course_progress_last_lesson 
FOREIGN KEY (last_lesson_id) REFERENCES lessons(lesson_id) ON DELETE SET NULL;

-- Quizzes foreign keys
ALTER TABLE quizzes 
ADD CONSTRAINT fk_quizzes_course 
FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE;

ALTER TABLE quizzes 
ADD CONSTRAINT fk_quizzes_lesson 
FOREIGN KEY (lesson_id) REFERENCES lessons(lesson_id) ON DELETE CASCADE;

-- Quiz questions foreign keys
ALTER TABLE quiz_questions 
ADD CONSTRAINT fk_quiz_questions_quiz 
FOREIGN KEY (quiz_id) REFERENCES quizzes(quiz_id) ON DELETE CASCADE;

-- Quiz options foreign keys
ALTER TABLE quiz_options 
ADD CONSTRAINT fk_quiz_options_question 
FOREIGN KEY (question_id) REFERENCES quiz_questions(question_id) ON DELETE CASCADE;

-- Quiz attempts foreign keys
ALTER TABLE quiz_attempts 
ADD CONSTRAINT fk_quiz_attempts_quiz 
FOREIGN KEY (quiz_id) REFERENCES quizzes(quiz_id) ON DELETE CASCADE;

ALTER TABLE quiz_attempts 
ADD CONSTRAINT fk_quiz_attempts_learner 
FOREIGN KEY (learner_id) REFERENCES learners(learner_id) ON DELETE CASCADE;

-- Quiz answers foreign keys
ALTER TABLE quiz_answers 
ADD CONSTRAINT fk_quiz_answers_attempt 
FOREIGN KEY (attempt_id) REFERENCES quiz_attempts(attempt_id) ON DELETE CASCADE;

ALTER TABLE quiz_answers 
ADD CONSTRAINT fk_quiz_answers_question 
FOREIGN KEY (question_id) REFERENCES quiz_questions(question_id) ON DELETE CASCADE;

ALTER TABLE quiz_answers 
ADD CONSTRAINT fk_quiz_answers_option 
FOREIGN KEY (selected_option_id) REFERENCES quiz_options(option_id) ON DELETE SET NULL;

-- Points ledger foreign keys
ALTER TABLE points_ledger 
ADD CONSTRAINT fk_points_ledger_learner 
FOREIGN KEY (learner_id) REFERENCES learners(learner_id) ON DELETE CASCADE;

-- User badges foreign keys
ALTER TABLE user_badges 
ADD CONSTRAINT fk_user_badges_learner 
FOREIGN KEY (learner_id) REFERENCES learners(learner_id) ON DELETE CASCADE;

ALTER TABLE user_badges 
ADD CONSTRAINT fk_user_badges_badge 
FOREIGN KEY (badge_id) REFERENCES badges(badge_id) ON DELETE CASCADE;

-- Course reviews foreign keys
ALTER TABLE course_reviews 
ADD CONSTRAINT fk_course_reviews_course 
FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE;

ALTER TABLE course_reviews 
ADD CONSTRAINT fk_course_reviews_learner 
FOREIGN KEY (learner_id) REFERENCES learners(learner_id) ON DELETE CASCADE;

-- Notifications foreign keys
ALTER TABLE notifications 
ADD CONSTRAINT fk_notifications_course 
FOREIGN KEY (related_course_id) REFERENCES courses(course_id) ON DELETE SET NULL;

ALTER TABLE notifications 
ADD CONSTRAINT fk_notifications_lesson 
FOREIGN KEY (related_lesson_id) REFERENCES lessons(lesson_id) ON DELETE SET NULL;

-- Course feedback foreign keys
ALTER TABLE course_feedback 
ADD CONSTRAINT fk_course_feedback_course 
FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE;

ALTER TABLE course_feedback 
ADD CONSTRAINT fk_course_feedback_admin 
FOREIGN KEY (admin_id) REFERENCES admins(admin_id) ON DELETE CASCADE;

-- Lesson files foreign keys
ALTER TABLE lesson_files 
ADD CONSTRAINT fk_lesson_files_lesson 
FOREIGN KEY (lesson_id) REFERENCES lessons(lesson_id) ON DELETE CASCADE;

-- ============================================================
-- STEP 3: CREATE INDEXES
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
-- STEP 4: INSERT SAMPLE DATA
-- ============================================================

-- Insert admin
INSERT INTO admins (name, email, password_hash) 
VALUES ('Admin User', 'admin@learnsphere.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5aeWG/xck4aRu')
ON CONFLICT (email) DO NOTHING;

-- Insert instructor
INSERT INTO instructors (name, email, password_hash, is_active, is_approved) 
VALUES ('Sarah Johnson', 'instructor@learnsphere.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5aeWG/xck4aRu', TRUE, TRUE)
ON CONFLICT (email) DO NOTHING;

-- Insert learner
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
LIMIT 1;

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
LIMIT 1;

-- Insert sample lessons
INSERT INTO lessons (course_id, title, lesson_type, description, duration_minutes, order_index)
SELECT 
    course_id,
    'Getting Started',
    'document',
    '<h2>Welcome!</h2><p>Learn the basics.</p>',
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
    '<h2>HTML Basics</h2><p>Learn HTML structure.</p>',
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
    '<h2>CSS Fundamentals</h2><p>Learn CSS styling.</p>',
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
