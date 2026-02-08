-- Migration: Add Notifications, Approvals, and Enhanced Features
-- Date: February 8, 2026

-- 1. Add instructor approval fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS approved_by INTEGER REFERENCES users(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;

-- Auto-approve existing instructors and admins
UPDATE users SET is_approved = TRUE WHERE role IN ('admin', 'instructor');

-- 2. Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'admin_message', 'course_feedback', 'approval', 'system'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    related_course_id INTEGER REFERENCES courses(id) ON DELETE SET NULL,
    related_lesson_id INTEGER REFERENCES lessons(id) ON DELETE SET NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, is_read);

-- 3. Create course feedback table
CREATE TABLE IF NOT EXISTS course_feedback (
    id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    admin_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    feedback_text TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'addressed', 'resolved'
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_course_feedback_course ON course_feedback(course_id);
CREATE INDEX IF NOT EXISTS idx_course_feedback_status ON course_feedback(status);

-- 4. Create lesson files table for media uploads
CREATE TABLE IF NOT EXISTS lesson_files (
    id SERIAL PRIMARY KEY,
    lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
    file_type VARCHAR(50) NOT NULL, -- 'video', 'audio', 'image', 'document'
    file_url TEXT NOT NULL,
    file_name VARCHAR(255),
    file_size INTEGER,
    mime_type VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lesson_files_lesson ON lesson_files(lesson_id);

-- 5. Add course approval status
ALTER TABLE courses ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50) DEFAULT 'draft';
-- Values: 'draft', 'pending_review', 'approved', 'needs_changes'

-- 6. Add last_login to users for activity tracking
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;

-- Insert sample notification for testing
INSERT INTO notifications (user_id, type, title, message, is_read)
SELECT id, 'system', 'Welcome to LearnSphere!', 'Your account has been created successfully.', FALSE
FROM users
WHERE role = 'instructor'
ON CONFLICT DO NOTHING;

COMMENT ON TABLE notifications IS 'Stores all user notifications including admin messages and system alerts';
COMMENT ON TABLE course_feedback IS 'Admin feedback and instructions for course improvements';
COMMENT ON TABLE lesson_files IS 'Media files attached to lessons (videos, audio, images)';
