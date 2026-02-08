"""
Setup gamification tables and test the system
"""
import psycopg2
import psycopg2.extras
import bcrypt

DB_CONFIG = {
    'host': 'db.aqrlbobkgsrklyyuvcuf.supabase.co',
    'port': 5432,
    'user': 'postgres',
    'password': 'LMk#6/U6KT98pFi',
    'database': 'postgres'
}

def setup_gamification_tables():
    """Create all gamification tables"""
    print("\n" + "="*60)
    print("SETTING UP GAMIFICATION TABLES")
    print("="*60)
    
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    
    try:
        # 1. Badges table
        print("\n1. Creating badges table...")
        cur.execute("""
            CREATE TABLE IF NOT EXISTS badges (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                icon VARCHAR(50),
                color VARCHAR(20) DEFAULT '#FFD700',
                points_required INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT NOW()
            )
        """)
        print("   ✓ Badges table ready")
        
        # 2. User badges table
        print("2. Creating user_badges table...")
        cur.execute("""
            CREATE TABLE IF NOT EXISTS user_badges (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                badge_id INTEGER REFERENCES badges(id) ON DELETE CASCADE,
                earned_date TIMESTAMP DEFAULT NOW(),
                is_new BOOLEAN DEFAULT TRUE,
                UNIQUE(user_id, badge_id)
            )
        """)
        print("   ✓ User badges table ready")
        
        # 3. Certificates table
        print("3. Creating certificates table...")
        cur.execute("""
            CREATE TABLE IF NOT EXISTS certificates (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
                certificate_number VARCHAR(100) UNIQUE NOT NULL,
                issued_date TIMESTAMP DEFAULT NOW(),
                completion_date TIMESTAMP,
                grade VARCHAR(10),
                is_downloaded BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT NOW()
            )
        """)
        print("   ✓ Certificates table ready")
        
        # 4. Achievements table
        print("4. Creating achievements table...")
        cur.execute("""
            CREATE TABLE IF NOT EXISTS achievements (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                achievement_type VARCHAR(50),
                title VARCHAR(200),
                description TEXT,
                icon VARCHAR(50),
                points_earned INTEGER DEFAULT 0,
                achieved_date TIMESTAMP DEFAULT NOW()
            )
        """)
        print("   ✓ Achievements table ready")
        
        # 5. User points table
        print("5. Creating user_points table...")
        cur.execute("""
            CREATE TABLE IF NOT EXISTS user_points (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
                total_points INTEGER DEFAULT 0,
                badge_level VARCHAR(50) DEFAULT 'Newbie',
                courses_completed INTEGER DEFAULT 0,
                quizzes_passed INTEGER DEFAULT 0,
                lessons_completed INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        """)
        print("   ✓ User points table ready")
        
        # Insert default badges
        print("\n6. Inserting default badges...")
        cur.execute("SELECT COUNT(*) FROM badges")
        badge_count = cur.fetchone()[0]
        
        if badge_count == 0:
            badges = [
                ('First Steps', 'Complete your first lesson', '🌱', '#4CAF50', 0),
                ('Quick Learner', 'Complete 5 lessons', '⚡', '#FF9800', 50),
                ('Dedicated Student', 'Complete 10 lessons', '📚', '#2196F3', 100),
                ('Quiz Master', 'Pass 5 quizzes', '🎯', '#9C27B0', 100),
                ('Course Completer', 'Complete your first course', '🏆', '#FFD700', 100),
                ('Knowledge Seeker', 'Complete 3 courses', '🎓', '#00BCD4', 300),
                ('Expert Learner', 'Complete 5 courses', '👑', '#E91E63', 500),
                ('Master Scholar', 'Complete 10 courses', '💎', '#3F51B5', 1000)
            ]
            
            for badge in badges:
                cur.execute("""
                    INSERT INTO badges (name, description, icon, color, points_required)
                    VALUES (%s, %s, %s, %s, %s)
                """, badge)
            print(f"   ✓ Inserted {len(badges)} default badges")
        else:
            print(f"   ✓ Badges already exist ({badge_count} badges)")
        
        # Create indexes
        print("\n7. Creating indexes...")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_certificates_user_id ON certificates(user_id)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON achievements(user_id)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_user_points_user_id ON user_points(user_id)")
        print("   ✓ Indexes created")
        
        # Initialize user_points for existing users
        print("\n8. Initializing user points for existing users...")
        cur.execute("""
            INSERT INTO user_points (user_id, total_points, badge_level, courses_completed, quizzes_passed, lessons_completed)
            SELECT 
                u.id,
                0,
                'Newbie',
                0,
                0,
                0
            FROM users u
            WHERE NOT EXISTS (
                SELECT 1 FROM user_points up WHERE up.user_id = u.id
            )
        """)
        rows_added = cur.rowcount
        print(f"   ✓ Initialized points for {rows_added} users")
        
        conn.commit()
        print("\n" + "="*60)
        print("✓ GAMIFICATION SETUP COMPLETE!")
        print("="*60)
        
        # Show summary
        print("\nTable Summary:")
        tables = ['badges', 'user_badges', 'certificates', 'achievements', 'user_points']
        for table in tables:
            cur.execute(f"SELECT COUNT(*) FROM {table}")
            count = cur.fetchone()[0]
            print(f"  {table}: {count} rows")
        
    except Exception as e:
        conn.rollback()
        print(f"\n✗ ERROR: {e}")
        raise
    finally:
        conn.close()

def create_test_user():
    """Create a test learner user"""
    print("\n" + "="*60)
    print("CREATING TEST USER")
    print("="*60)
    
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    
    try:
        # Check if test user exists
        cur.execute("SELECT id, email, role FROM users WHERE email = 'learner@test.com'")
        user = cur.fetchone()
        
        if user:
            print(f"\n✓ Test user already exists")
            print(f"  Email: {user['email']}")
            print(f"  Role: {user['role']}")
            print(f"  ID: {user['id']}")
        else:
            # Create test user
            hashed = bcrypt.hashpw('password123'.encode(), bcrypt.gensalt()).decode()
            cur.execute("""
                INSERT INTO users (full_name, email, password_hash, role)
                VALUES (%s, %s, %s, %s)
                RETURNING id, email, role
            """, ('Test Learner', 'learner@test.com', hashed, 'learner'))
            user = cur.fetchone()
            conn.commit()
            
            print(f"\n✓ Test user created")
            print(f"  Email: {user['email']}")
            print(f"  Password: password123")
            print(f"  Role: {user['role']}")
            print(f"  ID: {user['id']}")
        
        # Ensure user has points record
        cur.execute("SELECT id FROM user_points WHERE user_id = %s", (user['id'],))
        if not cur.fetchone():
            cur.execute("""
                INSERT INTO user_points (user_id, total_points, badge_level)
                VALUES (%s, 0, 'Newbie')
            """, (user['id'],))
            conn.commit()
            print("  ✓ User points initialized")
        
        print("\n" + "="*60)
        
    except Exception as e:
        conn.rollback()
        print(f"\n✗ ERROR: {e}")
    finally:
        conn.close()

def test_endpoints():
    """Test the achievement endpoints"""
    import requests
    
    print("\n" + "="*60)
    print("TESTING ACHIEVEMENT ENDPOINTS")
    print("="*60)
    
    BASE_URL = "http://localhost:8000"
    
    # Login
    print("\n1. Testing login...")
    session = requests.Session()
    response = session.post(f"{BASE_URL}/api/auth/login", json={
        "email": "learner@test.com",
        "password": "password123",
        "role": "learner"
    })
    
    if response.status_code == 200:
        print("   ✓ Login successful")
    else:
        print(f"   ✗ Login failed: {response.status_code}")
        print(f"   Response: {response.text}")
        return
    
    # Test achievements endpoint
    print("\n2. Testing /api/learner/achievements...")
    response = session.get(f"{BASE_URL}/api/learner/achievements")
    
    if response.status_code == 200:
        data = response.json()
        print("   ✓ Achievements endpoint working")
        print(f"   - Badges: {len(data.get('badges', []))}")
        print(f"   - Achievements: {len(data.get('achievements', []))}")
        print(f"   - Certificates: {len(data.get('certificates', []))}")
        print(f"   - Total Points: {data.get('points', {}).get('total_points', 0)}")
        print(f"   - Badge Level: {data.get('points', {}).get('badge_level', 'N/A')}")
    else:
        print(f"   ✗ Failed: {response.status_code}")
        print(f"   Response: {response.text}")
    
    # Test new badges endpoint
    print("\n3. Testing /api/learner/badges/new...")
    response = session.get(f"{BASE_URL}/api/learner/badges/new")
    
    if response.status_code == 200:
        data = response.json()
        print("   ✓ New badges endpoint working")
        print(f"   - New badges: {len(data.get('badges', []))}")
    else:
        print(f"   ✗ Failed: {response.status_code}")
    
    print("\n" + "="*60)
    print("✓ ALL TESTS COMPLETE!")
    print("="*60)

if __name__ == "__main__":
    try:
        # Step 1: Setup tables
        setup_gamification_tables()
        
        # Step 2: Create test user
        create_test_user()
        
        # Step 3: Test endpoints (only if backend is running)
        print("\n\nNow testing endpoints...")
        print("(Make sure backend is running on http://localhost:8000)")
        input("\nPress Enter to test endpoints (or Ctrl+C to skip)...")
        
        test_endpoints()
        
        print("\n\n" + "="*60)
        print("SETUP COMPLETE!")
        print("="*60)
        print("\nYou can now:")
        print("1. Login with: learner@test.com / password123")
        print("2. Complete lessons to earn achievements")
        print("3. Complete courses to get certificates")
        print("4. View achievements at /achievements page")
        print("\n" + "="*60)
        
    except KeyboardInterrupt:
        print("\n\nSetup interrupted by user")
    except Exception as e:
        print(f"\n\n✗ FATAL ERROR: {e}")
        import traceback
        traceback.print_exc()
