"""
Quick setup script for gamification system
"""
from supabase import create_client, Client

SUPABASE_URL = "https://aqrlbobkgsrklyyuvcuf.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxcmxib2JrZ3Nya2x5eXV2Y3VmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0NzMxMDksImV4cCI6MjA4NjA0OTEwOX0.3ElshxBiStMxpnUdXGEhw8z5z20zluTbTQi6lDsiP-A"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

print("=" * 70)
print("🎮 Gamification System Setup")
print("=" * 70)

# Check if tables exist
print("\n1️⃣  Checking gamification tables...")
tables_to_check = ['certificates', 'badges', 'user_badges', 'achievements']
missing_tables = []

for table in tables_to_check:
    try:
        supabase.table(table).select("id").limit(1).execute()
        print(f"   ✅ {table} exists")
    except:
        print(f"   ❌ {table} missing")
        missing_tables.append(table)

if missing_tables:
    print("\n⚠️  Missing tables detected!")
    print("📋 Please run the SQL migration:")
    print("   1. Open Supabase Dashboard: https://supabase.com/dashboard")
    print("   2. Go to SQL Editor")
    print("   3. Copy contents of ADD_GAMIFICATION_SYSTEM.sql")
    print("   4. Paste and click 'Run'")
    print("   5. Come back and run this script again")
    exit(1)

# Check if badges are populated
print("\n2️⃣  Checking badges...")
badges_result = supabase.table("badges").select("*").execute()
if badges_result.data and len(badges_result.data) > 0:
    print(f"   ✅ {len(badges_result.data)} badges found")
else:
    print("   ⚠️  No badges found - they should be created by SQL migration")

# Check if courses exist
print("\n3️⃣  Checking courses...")
courses_result = supabase.table("courses").select("id, title, access, price").execute()
if courses_result.data:
    free_courses = [c for c in courses_result.data if c.get('access') == 'free']
    paid_courses = [c for c in courses_result.data if c.get('access') == 'payment']
    print(f"   ✅ {len(free_courses)} FREE courses")
    print(f"   ✅ {len(paid_courses)} PAID courses")
    
    if len(free_courses) < 5 or len(paid_courses) < 3:
        print("\n   💡 Want to generate rich sample courses?")
        print("   Run: python generate_rich_courses.py")
else:
    print("   ⚠️  No courses found")
    print("\n   💡 Generate sample courses:")
    print("   Run: python generate_rich_courses.py")

# Check user points table
print("\n4️⃣  Checking user points...")
try:
    points_result = supabase.table("user_points").select("*").execute()
    print(f"   ✅ {len(points_result.data)} users have points records")
except:
    print("   ⚠️  User points table needs setup")

print("\n" + "=" * 70)
print("✅ Setup Check Complete!")
print("=" * 70)
print("\n📋 Next Steps:")
print("   1. If tables are missing, run SQL migration")
print("   2. Generate sample courses: python generate_rich_courses.py")
print("   3. Restart backend: cd backend && python main_new.py")
print("   4. Test course completion and certificate generation")
print("=" * 70)
