from supabase import create_client
import requests

SUPABASE_URL = "https://aqrlbobkgsrklyyuvcuf.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxcmxib2JrZ3Nya2x5eXV2Y3VmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0NzMxMDksImV4cCI6MjA4NjA0OTEwOX0.3ElshxBiStMxpnUdXGEhw8z5z20zluTbTQi6lDsiP-A"

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

print("=" * 70)
print("CREATING MISSING TABLES VIA BACKEND")
print("=" * 70)

# SQL to create missing tables
sql_commands = [
    """
    CREATE TABLE IF NOT EXISTS user_points (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
        total_points INTEGER DEFAULT 0,
        badge_level VARCHAR(50) DEFAULT 'Newbie',
        updated_at TIMESTAMP DEFAULT NOW()
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS course_reviews (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        review_text TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, course_id)
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS lesson_attachments (
        id SERIAL PRIMARY KEY,
        lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
        file_name VARCHAR(255),
        file_url TEXT,
        file_type VARCHAR(50),
        file_size INTEGER,
        uploaded_at TIMESTAMP DEFAULT NOW()
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS course_invitations (
        id SERIAL PRIMARY KEY,
        course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        invited_by INTEGER REFERENCES users(id),
        invited_at TIMESTAMP DEFAULT NOW(),
        status VARCHAR(50) DEFAULT 'pending',
        UNIQUE(course_id, user_id)
    );
    """,
    """
    ALTER TABLE lessons ADD COLUMN IF NOT EXISTS video_url TEXT;
    """,
    """
    ALTER TABLE lessons ADD COLUMN IF NOT EXISTS content_type VARCHAR(50) DEFAULT 'text';
    """,
    """
    ALTER TABLE lessons ADD COLUMN IF NOT EXISTS duration INTEGER DEFAULT 0;
    """,
    """
    ALTER TABLE courses ADD COLUMN IF NOT EXISTS access VARCHAR(50) DEFAULT 'open';
    """,
    """
    ALTER TABLE courses ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0.0;
    """,
    """
    ALTER TABLE courses ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0;
    """,
    """
    ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS completed_date TIMESTAMP;
    """,
    """
    ALTER TABLE user_points DISABLE ROW LEVEL SECURITY;
    """,
    """
    ALTER TABLE course_reviews DISABLE ROW LEVEL SECURITY;
    """,
    """
    ALTER TABLE lesson_attachments DISABLE ROW LEVEL SECURITY;
    """,
    """
    ALTER TABLE course_invitations DISABLE ROW LEVEL SECURITY;
    """
]

print("\n📝 SQL commands prepared. These need to be run in Supabase SQL Editor.")
print("\nGo to: https://supabase.com/dashboard/project/aqrlbobkgsrklyyuvcuf/sql")
print("\nCopy and paste COMPLETE_FEATURES_MIGRATION.sql")
print("\n" + "=" * 70)
