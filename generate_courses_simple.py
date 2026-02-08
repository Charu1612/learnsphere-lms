"""
Generate 8 courses with lessons - Simplified version
"""
from supabase import create_client, Client
import random

SUPABASE_URL = "https://aqrlbobkgsrklyyuvcuf.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxcmxib2JrZ3Nya2x5eXV2Y3VmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0NzMxMDksImV4cCI6MjA4NjA0OTEwOX0.3ElshxBiStMxpnUdXGEhw8z5z20zluTbTQi6lDsiP-A"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

print("=" * 70)
print("🎓 Generating Courses")
print("=" * 70)

# Get instructor
instructor_result = supabase.table("users").select("id").eq("role", "instructor").limit(1).execute()
if not instructor_result.data:
    print("❌ No instructor found")
    exit(1)

instructor_id = instructor_result.data[0]['id']
print(f"✅ Using instructor ID: {instructor_id}")

# Course data
courses = [
    # FREE COURSES
    {"title": "Python Programming for Beginners", "desc": "Learn Python from scratch", "access": "free", "price": 0, "lessons": 15},
    {"title": "Web Development Fundamentals", "desc": "HTML, CSS, and JavaScript basics", "access": "free", "price": 0, "lessons": 18},
    {"title": "Introduction to Data Science", "desc": "Data analysis and visualization", "access": "free", "price": 0, "lessons": 16},
    {"title": "Git & GitHub Essentials", "desc": "Version control mastery", "access": "free", "price": 0, "lessons": 12},
    {"title": "SQL Database Basics", "desc": "Master database queries", "access": "free", "price": 0, "lessons": 14},
    # PAID COURSES
    {"title": "Advanced React & Redux", "desc": "Build production-ready React apps", "access": "payment", "price": 49.99, "lessons": 20},
    {"title": "Full-Stack JavaScript", "desc": "MERN stack complete guide", "access": "payment", "price": 79.99, "lessons": 25},
    {"title": "Machine Learning Bootcamp", "desc": "Deep learning and AI", "access": "payment", "price": 99.99, "lessons": 22}
]

print("\n📚 Creating courses...")
for idx, course_data in enumerate(courses, 1):
    print(f"\n[{idx}/8] {course_data['title']}")
    
    # Create course
    course_insert = {
        "instructor_id": instructor_id,
        "title": course_data['title'],
        "short_description": course_data['desc'],
        "full_description": course_data['desc'],
        "image_url": f"https://images.unsplash.com/photo-{1516321318423 + idx}?w=800",
        "tags": "programming, learning",
        "visibility": "public",
        "access": course_data['access'],
        "price": course_data['price'],
        "published": True
    }
    
    try:
        course_result = supabase.table("courses").insert(course_insert).execute()
        course_id = course_result.data[0]['id']
        print(f"   ✅ Course created (ID: {course_id})")
        
        # Create lessons
        for lesson_idx in range(1, course_data['lessons'] + 1):
            lesson_type = "video" if lesson_idx % 3 != 0 else "text"
            
            lesson_data = {
                "course_id": course_id,
                "title": f"Lesson {lesson_idx}: {course_data['title'].split()[0]} Basics",
                "content": f"<h2>Lesson {lesson_idx}</h2><p>Learn about {course_data['title']}. This lesson covers fundamental concepts and practical examples.</p>" + (f"<iframe width='560' height='315' src='https://www.youtube.com/embed/rfscVS0vtbw' frameborder='0' allowfullscreen></iframe>" if lesson_type == "video" else ""),
                "duration": random.randint(5, 20),
                "order_index": lesson_idx,
                "lesson_type": lesson_type,
                "content_type": lesson_type
            }
            
            supabase.table("lessons").insert(lesson_data).execute()
        
        print(f"   ✅ {course_data['lessons']} lessons added")
        price_text = 'FREE' if course_data['access'] == 'free' else f"${course_data['price']}"
        print(f"   💰 {price_text}")
        
    except Exception as e:
        print(f"   ❌ Error: {e}")

print("\n" + "=" * 70)
print("✅ Course Generation Complete!")
print("=" * 70)
print("\n📊 Summary:")
print("   • 5 FREE courses created")
print("   • 3 PAID courses created")
print("   • Total lessons: ~140+")
print("\n🎉 Ready! Refresh your browser to see all courses!")
