import os
import psycopg2
import bcrypt

DATABASE_URL = os.environ.get("DATABASE_URL")

def init_db():
    # Always use Supabase direct connection
    conn = None
    try:
        conn = psycopg2.connect(
            host="db.aqrlbobkgsrklyyuvcuf.supabase.co",
            port=5432,
            user="postgres",
            password="LMk#6/U6KT98pFi",
            database="postgres"
        )
    except Exception as e:
        print(f"❌ Connection error: {e}")
        print("⚠️  Network cannot reach Supabase server")
        print("📋 Check if you need to whitelist your IP in Supabase settings")
        raise
    cur = conn.cursor()
    
    cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            full_name VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            role VARCHAR(50) DEFAULT 'learner',
            created_at TIMESTAMP DEFAULT NOW()
        );
        
        CREATE TABLE IF NOT EXISTS sessions (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            token VARCHAR(255) UNIQUE NOT NULL,
            expires_at TIMESTAMP NOT NULL,
            created_at TIMESTAMP DEFAULT NOW()
        );
        
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
        
        CREATE TABLE IF NOT EXISTS lessons (
            id SERIAL PRIMARY KEY,
            course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
            title VARCHAR(500) NOT NULL,
            lesson_type VARCHAR(50) DEFAULT 'document',
            content TEXT DEFAULT '',
            duration INTEGER DEFAULT 0,
            order_index INTEGER DEFAULT 0
        );
        
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
        
        CREATE TABLE IF NOT EXISTS lesson_progress (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            enrollment_id INTEGER REFERENCES enrollments(id) ON DELETE CASCADE,
            lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
            status VARCHAR(50) DEFAULT 'in_progress',
            completed_at TIMESTAMP,
            UNIQUE(user_id, lesson_id)
        );
        
        CREATE TABLE IF NOT EXISTS quizzes (
            id SERIAL PRIMARY KEY,
            lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
            title VARCHAR(500) NOT NULL,
            timer_seconds INTEGER DEFAULT 0,
            pass_score INTEGER DEFAULT 70
        );
        
        CREATE TABLE IF NOT EXISTS quiz_questions (
            id SERIAL PRIMARY KEY,
            quiz_id INTEGER REFERENCES quizzes(id) ON DELETE CASCADE,
            prompt TEXT NOT NULL,
            options JSONB NOT NULL,
            correct_index INTEGER NOT NULL
        );
        
        CREATE TABLE IF NOT EXISTS quiz_attempts (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            quiz_id INTEGER REFERENCES quizzes(id) ON DELETE CASCADE,
            score INTEGER DEFAULT 0,
            passed BOOLEAN DEFAULT false,
            submitted_at TIMESTAMP DEFAULT NOW()
        );
    """)
    
    conn.commit()
    print("Database tables created successfully!")
    
    # Seed admin user
    hashed = bcrypt.hashpw("admin123".encode(), bcrypt.gensalt()).decode()
    try:
        cur.execute(
            "INSERT INTO users (full_name, email, password_hash, role) VALUES (%s, %s, %s, %s) ON CONFLICT (email) DO NOTHING",
            ("Admin User", "admin@learnsphere.com", hashed, "admin")
        )
        conn.commit()
        print("Admin user seeded (admin@learnsphere.com / admin123)")
    except Exception as e:
        conn.rollback()
        print(f"Admin seed skipped: {e}")
    
    # Seed instructor
    hashed2 = bcrypt.hashpw("instructor123".encode(), bcrypt.gensalt()).decode()
    try:
        cur.execute(
            "INSERT INTO users (full_name, email, password_hash, role) VALUES (%s, %s, %s, %s) ON CONFLICT (email) DO NOTHING RETURNING id",
            ("Sarah Johnson", "instructor@learnsphere.com", hashed2, "instructor")
        )
        result = cur.fetchone()
        conn.commit()
        
        if result:
            instructor_id = result[0]
            print("Instructor user seeded (instructor@learnsphere.com / instructor123)")
            
            # Seed courses
            courses_data = [
                ("Introduction to Web Development", "Learn the fundamentals of HTML, CSS, and JavaScript", "This comprehensive course covers everything you need to know to start building modern websites. From basic HTML structure to responsive CSS layouts and interactive JavaScript functionality.", "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=600", "web,html,css,javascript", "public", "free", 0, True),
                ("Python for Beginners", "Master Python programming from scratch", "Start your programming journey with Python, one of the most popular and versatile languages. Learn variables, data types, control flow, functions, and object-oriented programming.", "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=600", "python,programming,beginner", "public", "free", 0, True),
                ("Data Science Essentials", "Explore data analysis and visualization techniques", "Dive into the world of data science. Learn to analyze datasets, create visualizations, and extract meaningful insights using popular tools and libraries.", "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600", "data,science,analytics", "public", "free", 0, True),
                ("UI/UX Design Fundamentals", "Create beautiful and user-friendly interfaces", "Learn the principles of great design. From color theory and typography to wireframing and prototyping, this course covers the essential skills for modern designers.", "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600", "design,ux,ui", "public", "free", 0, True),
                ("Machine Learning Basics", "Understand AI and machine learning concepts", "Get started with machine learning. Learn about supervised and unsupervised learning, neural networks, and how to build your first ML models.", "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=600", "ml,ai,machine-learning", "public", "free", 0, True),
                ("Mobile App Development", "Build cross-platform mobile applications", "Learn to create mobile apps that work on both iOS and Android. Cover React Native fundamentals, navigation, state management, and deployment.", "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600", "mobile,react-native,apps", "public", "free", 0, True),
            ]
            
            for cd in courses_data:
                cur.execute("""
                    INSERT INTO courses (instructor_id, title, short_description, full_description, image_url, tags, visibility, access, price, published)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT DO NOTHING RETURNING id
                """, (instructor_id, *cd))
                course_result = cur.fetchone()
                if course_result:
                    cid = course_result[0]
                    lessons_data = [
                        (f"Getting Started with {cd[0].split()[0]}", "document", f"<h2>Welcome to {cd[0]}</h2><p>In this lesson, you'll learn the basics and set up your environment.</p><p>We'll cover the fundamental concepts and prepare you for the hands-on exercises ahead.</p>", 15, 1),
                        (f"Core Concepts", "document", f"<h2>Core Concepts</h2><p>Now that you're set up, let's dive into the core concepts.</p><p>Understanding these fundamentals will give you a solid foundation for everything that follows.</p>", 20, 2),
                        (f"Hands-on Practice", "document", f"<h2>Hands-on Practice</h2><p>Time to put what you've learned into practice.</p><p>Follow along with the exercises and try the challenges at the end of each section.</p>", 25, 3),
                        (f"Knowledge Check", "quiz", "", 10, 4),
                    ]
                    for ld in lessons_data:
                        cur.execute("""
                            INSERT INTO lessons (course_id, title, lesson_type, content, duration, order_index)
                            VALUES (%s, %s, %s, %s, %s, %s) RETURNING id
                        """, (cid, *ld))
                        lesson_result = cur.fetchone()
                        if lesson_result and ld[1] == "quiz":
                            lid = lesson_result[0]
                            cur.execute("""
                                INSERT INTO quizzes (lesson_id, title, timer_seconds, pass_score)
                                VALUES (%s, %s, %s, %s) RETURNING id
                            """, (lid, f"{cd[0]} Quiz", 300, 70))
                            qid = cur.fetchone()[0]
                            questions = [
                                (f"What is the main purpose of {cd[0].split()[-1]}?", ["To create documents", "To solve specific problems in this domain", "To play games", "To browse the internet"], 1),
                                ("Which of the following is a best practice?", ["Skip documentation", "Write clean, readable code", "Never test your code", "Use random variable names"], 1),
                                ("What should you do when stuck?", ["Give up immediately", "Delete everything", "Review fundamentals and seek help", "Ignore the problem"], 2),
                            ]
                            for qd in questions:
                                import json
                                cur.execute("""
                                    INSERT INTO quiz_questions (quiz_id, prompt, options, correct_index)
                                    VALUES (%s, %s, %s, %s)
                                """, (qid, qd[0], json.dumps(qd[1]), qd[2]))
            
            conn.commit()
            print("Sample courses with lessons and quizzes seeded!")
        else:
            print("Instructor already exists, skipping course seed")
    except Exception as e:
        conn.rollback()
        print(f"Seed error: {e}")
    
    conn.close()

if __name__ == "__main__":
    init_db()
