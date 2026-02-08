"""
Generate 8 complete courses (5 free + 3 paid) with rich content:
- YouTube videos
- Quizzes with multiple questions
- Images
- Gamification elements
"""
from supabase import create_client, Client
import random

SUPABASE_URL = "https://aqrlbobkgsrklyyuvcuf.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxcmxib2JrZ3Nya2x5eXV2Y3VmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0NzMxMDksImV4cCI6MjA4NjA0OTEwOX0.3ElshxBiStMxpnUdXGEhw8z5z20zluTbTQi6lDsiP-A"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# YouTube video URLs (educational content)
YOUTUBE_VIDEOS = [
    "https://www.youtube.com/watch?v=rfscVS0vtbw",  # Python Tutorial
    "https://www.youtube.com/watch?v=8ext9G7xspg",  # JavaScript
    "https://www.youtube.com/watch?v=UB1O30fR-EE",  # HTML/CSS
    "https://www.youtube.com/watch?v=SqcY0GlETPk",  # React
    "https://www.youtube.com/watch?v=Oe421EPjeBE",  # Node.js
    "https://www.youtube.com/watch?v=HXV3zeQKqGY",  # SQL
    "https://www.youtube.com/watch?v=vLnPwxZdW4Y",  # Git
    "https://www.youtube.com/watch?v=RGOj5yH7evk",  # Docker
]

# Unsplash images (free to use)
COURSE_IMAGES = [
    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800",  # Programming
    "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800",  # Computer
    "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800",  # Code
    "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800",  # Laptop
    "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=800",  # Tech
    "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800",  # Team
    "https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=800",  # Workspace
    "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800",  # Business
]

LESSON_IMAGES = [
    "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=600",
    "https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=600",
    "https://images.unsplash.com/photo-1550439062-609e1531270e?w=600",
    "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600",
]

# Course data (5 FREE + 3 PAID)
COURSES = [
    # FREE COURSES
    {
        "title": "Python Programming for Beginners",
        "short_description": "Learn Python from scratch with hands-on projects and quizzes",
        "full_description": "Master Python programming with this comprehensive course. Perfect for beginners!",
        "access": "free",
        "price": 0,
        "visibility": "public",
        "published": True,
        "tags": "python, programming, beginner",
        "lessons_count": 15
    },
    {
        "title": "Web Development Fundamentals",
        "short_description": "HTML, CSS, and JavaScript basics for aspiring web developers",
        "full_description": "Build your first website with HTML, CSS, and JavaScript. No prior experience needed!",
        "access": "free",
        "price": 0,
        "visibility": "public",
        "published": True,
        "tags": "web, html, css, javascript",
        "lessons_count": 18
    },
    {
        "title": "Introduction to Data Science",
        "short_description": "Explore data analysis, visualization, and machine learning basics",
        "full_description": "Start your data science journey with Python, pandas, and visualization tools.",
        "access": "free",
        "price": 0,
        "visibility": "public",
        "published": True,
        "tags": "data science, python, analytics",
        "lessons_count": 16
    },
    {
        "title": "Git & GitHub Essentials",
        "short_description": "Version control mastery for developers",
        "full_description": "Learn Git commands, branching, merging, and collaboration on GitHub.",
        "access": "free",
        "price": 0,
        "visibility": "public",
        "published": True,
        "tags": "git, github, version control",
        "lessons_count": 12
    },
    {
        "title": "SQL Database Basics",
        "short_description": "Master database queries and design",
        "full_description": "Learn SQL from basics to advanced queries, joins, and database design.",
        "access": "free",
        "price": 0,
        "visibility": "public",
        "published": True,
        "tags": "sql, database, queries",
        "lessons_count": 14
    },
    # PAID COURSES
    {
        "title": "Advanced React & Redux Masterclass",
        "short_description": "Build production-ready React applications with Redux, Hooks, and best practices",
        "full_description": "Master React with advanced patterns, Redux state management, and real-world projects.",
        "access": "payment",
        "price": 49.99,
        "visibility": "public",
        "published": True,
        "tags": "react, redux, javascript, advanced",
        "lessons_count": 20
    },
    {
        "title": "Full-Stack JavaScript Developer",
        "short_description": "Node.js, Express, MongoDB, and React - Complete MERN stack",
        "full_description": "Become a full-stack developer with MERN stack. Build and deploy real applications.",
        "access": "payment",
        "price": 79.99,
        "visibility": "public",
        "published": True,
        "tags": "mern, nodejs, mongodb, fullstack",
        "lessons_count": 25
    },
    {
        "title": "Machine Learning & AI Bootcamp",
        "short_description": "Deep learning, neural networks, and AI applications",
        "full_description": "Master machine learning algorithms, deep learning, and build AI applications.",
        "access": "payment",
        "price": 99.99,
        "visibility": "public",
        "published": True,
        "tags": "machine learning, ai, deep learning",
        "lessons_count": 22
    }
]

def create_quiz_questions(topic, difficulty="beginner"):
    """Generate quiz questions based on topic"""
    questions = [
        {
            "question": f"What is the main purpose of {topic}?",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correct_answer": 0,
            "explanation": f"This is the correct answer about {topic}"
        },
        {
            "question": f"Which of the following is a key feature of {topic}?",
            "options": ["Feature 1", "Feature 2", "Feature 3", "Feature 4"],
            "correct_answer": 1,
            "explanation": "Feature 2 is the key feature"
        },
        {
            "question": f"How do you implement {topic} in a project?",
            "options": ["Method A", "Method B", "Method C", "Method D"],
            "correct_answer": 2,
            "explanation": "Method C is the recommended approach"
        },
        {
            "question": f"What is the best practice when using {topic}?",
            "options": ["Practice 1", "Practice 2", "Practice 3", "Practice 4"],
            "correct_answer": 0,
            "explanation": "Practice 1 is considered the best practice"
        },
        {
            "question": f"Which tool works best with {topic}?",
            "options": ["Tool A", "Tool B", "Tool C", "Tool D"],
            "correct_answer": 1,
            "explanation": "Tool B has the best integration"
        }
    ]
    return questions

print("=" * 70)
print("🎓 Generating Rich Course Content")
print("=" * 70)

# Get instructor
instructor_result = supabase.table("users").select("id").eq("role", "instructor").limit(1).execute()
if not instructor_result.data:
    print("❌ No instructor found. Please create an instructor account first.")
    exit(1)

instructor_id = instructor_result.data[0]['id']
print(f"✅ Using instructor ID: {instructor_id}")

# Delete existing courses by this instructor (optional - for clean slate)
print("\n🗑️  Cleaning up old courses...")
try:
    supabase.table("courses").delete().eq("instructor_id", instructor_id).execute()
    print("✅ Old courses deleted")
except:
    print("⚠️  No old courses to delete")

# Create courses
print("\n📚 Creating courses...")
for idx, course_data in enumerate(COURSES, 1):
    print(f"\n[{idx}/8] Creating: {course_data['title']}")
    
    # Create course
    course_insert = {
        "instructor_id": instructor_id,
        "title": course_data['title'],
        "short_description": course_data['short_description'],
        "full_description": course_data['full_description'],
        "image_url": COURSE_IMAGES[idx % len(COURSE_IMAGES)],
        "tags": course_data['tags'],
        "visibility": course_data['visibility'],
        "access": course_data['access'],
        "price": course_data['price'],
        "published": course_data['published']
    }
    
    course_result = supabase.table("courses").insert(course_insert).execute()
    course_id = course_result.data[0]['id']
    print(f"   ✅ Course created (ID: {course_id})")
    
    # Create lessons
    lessons_count = course_data['lessons_count']
    print(f"   📝 Adding {lessons_count} lessons...")
    
    for lesson_idx in range(1, lessons_count + 1):
        # Determine lesson type (mix of video, text, image, quiz)
        if lesson_idx % 5 == 0:
            lesson_type = "quiz"
        elif lesson_idx % 4 == 0:
            lesson_type = "image"
        elif lesson_idx % 3 == 0:
            lesson_type = "text"
        else:
            lesson_type = "video"
        
        lesson_data = {
            "course_id": course_id,
            "title": f"Lesson {lesson_idx}: {course_data['title'].split()[0]} Fundamentals",
            "description": f"Learn about {course_data['title'].split()[0]} concepts in this lesson",
            "content_type": lesson_type,
            "order_index": lesson_idx,
            "duration": random.randint(5, 20)
        }
        
        # Add content based on type
        if lesson_type == "video":
            lesson_data["video_url"] = YOUTUBE_VIDEOS[lesson_idx % len(YOUTUBE_VIDEOS)]
            lesson_data["content"] = f"<h2>Video Lesson {lesson_idx}</h2><p>Watch the video to learn more.</p>"
        elif lesson_type == "text":
            lesson_data["content"] = f"""
            <h2>Lesson {lesson_idx}: Deep Dive</h2>
            <p>This lesson covers important concepts about {course_data['title']}.</p>
            <h3>Key Points:</h3>
            <ul>
                <li>Understanding the basics</li>
                <li>Practical applications</li>
                <li>Best practices</li>
                <li>Common pitfalls to avoid</li>
            </ul>
            <p>Make sure to practice these concepts!</p>
            """
        elif lesson_type == "image":
            lesson_data["video_url"] = LESSON_IMAGES[lesson_idx % len(LESSON_IMAGES)]
            lesson_data["content"] = f"<h2>Visual Guide</h2><p>Study the diagram above carefully.</p>"
        elif lesson_type == "quiz":
            lesson_data["content"] = "Quiz time! Test your knowledge."
        
        lesson_result = supabase.table("lessons").insert(lesson_data).execute()
        lesson_id = lesson_result.data[0]['id']
        
        # Create quiz if lesson is quiz type
        if lesson_type == "quiz":
            quiz_data = {
                "course_id": course_id,
                "lesson_id": lesson_id,
                "title": f"Quiz {lesson_idx // 5 + 1}",
                "description": f"Test your knowledge of {course_data['title']}",
                "questions": create_quiz_questions(course_data['title'].split()[0]),
                "passing_score": 60,
                "time_limit": 15,
                "max_attempts": 3,
                "attempt_rewards": {
                    "attempt_1": 100,
                    "attempt_2": 75,
                    "attempt_3": 50,
                    "attempt_4": 25
                }
            }
            supabase.table("quizzes").insert(quiz_data).execute()
    
    print(f"   ✅ {lessons_count} lessons added")
    price_text = 'FREE' if course_data['access'] == 'free' else f"${course_data['price']}"
    print(f"   💰 Price: {price_text}")

print("\n" + "=" * 70)
print("✅ Course Generation Complete!")
print("=" * 70)
print("\n📊 Summary:")
print("   • 5 FREE courses created")
print("   • 3 PAID courses created")
print("   • Total lessons: ~140+")
print("   • Quizzes included in each course")
print("   • YouTube videos embedded")
print("   • Images and rich content added")
print("\n🎉 Ready to learn!")
