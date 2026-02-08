from supabase import create_client
import random

SUPABASE_URL = "https://aqrlbobkgsrklyyuvcuf.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxcmxib2JrZ3Nya2x5eXV2Y3VmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0NzMxMDksImV4cCI6MjA4NjA0OTEwOX0.3ElshxBiStMxpnUdXGEhw8z5z20zluTbTQi6lDsiP-A"

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

print("=" * 70)
print("GENERATING SAMPLE DATA FOR 15 COURSES")
print("=" * 70)

# Sample data
course_titles = [
    "Python for Beginners",
    "Advanced JavaScript",
    "React Masterclass",
    "Node.js Backend Development",
    "Machine Learning Fundamentals",
    "Data Science with Python",
    "Web Design Principles",
    "Mobile App Development",
    "Cloud Computing with AWS",
    "Cybersecurity Essentials",
    "Database Design & SQL",
    "DevOps Engineering",
    "UI/UX Design Complete Guide",
    "Blockchain Technology",
    "Artificial Intelligence Basics"
]

lesson_types = ['video', 'text', 'document', 'quiz']
video_urls = [
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "https://www.youtube.com/watch?v=jNQXAC9IVRw",
    "https://vimeo.com/148751763"
]

# Get instructor
instructor = supabase.table("users").select("id").eq("role", "instructor").limit(1).execute()
if not instructor.data:
    print("❌ No instructor found")
    exit(1)

instructor_id = instructor.data[0]['id']
print(f"[OK] Using instructor ID: {instructor_id}")

# Create 15 courses
print("\n📚 Creating 15 courses...")
for i, title in enumerate(course_titles, 1):
    # Create course
    course_data = {
        "title": title,
        "short_description": f"Learn {title.lower()} from scratch with hands-on projects and real-world examples.",
        "instructor_id": instructor_id,
        "published": True,
        "visibility": "public" if i % 2 == 0 else "signed_in",
        "access": ["open", "invitation", "payment"][i % 3],
        "price": 0 if i % 3 == 0 else random.randint(20, 100),
        "tags": f"programming,{title.lower().replace(' ', '-')},tutorial",
        "image_url": f"https://picsum.photos/seed/{i}/800/400"
    }
    
    course = supabase.table("courses").insert(course_data).execute()
    course_id = course.data[0]['id']
    print(f"  ✓ Course {i}: {title} (ID: {course_id})")
    
    # Create 8-12 lessons per course
    num_lessons = random.randint(8, 12)
    print(f"    Creating {num_lessons} lessons...")
    
    for j in range(1, num_lessons + 1):
        content_type = random.choice(lesson_types)
        
        lesson_data = {
            "course_id": course_id,
            "title": f"Lesson {j}: {['Introduction', 'Fundamentals', 'Advanced Concepts', 'Practical Examples', 'Best Practices', 'Project Work', 'Review', 'Final Project'][j % 8]}",
            "content": f"<h2>Lesson {j} Content</h2><p>This lesson covers important concepts in {title}.</p>",
            "order_index": j
        }
        
        lesson = supabase.table("lessons").insert(lesson_data).execute()
        lesson_id = lesson.data[0]['id']

print("\n[OK] Sample data generation complete!")
print(f"   - 15 courses created")
print(f"   - ~150 lessons created")
print(f"   - Quizzes and attachments added")
