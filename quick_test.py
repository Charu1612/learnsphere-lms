"""Quick Backend Test"""
import requests

BASE_URL = "http://localhost:8000"

print("Testing backend...")

# Test 1: Server
try:
    r = requests.get(f"{BASE_URL}/", timeout=5)
    print(f"✅ Server: {r.json()}")
except Exception as e:
    print(f"❌ Server: {e}")
    exit(1)

# Test 2: Admin Login
try:
    r = requests.post(f"{BASE_URL}/api/auth/login", 
                     json={"email":"admin@learnsphere.com","password":"admin123","role":"admin"},
                     timeout=5)
    if r.status_code == 200:
        print(f"✅ Admin Login: Success")
        cookies = r.cookies
        
        # Test 3: Get Users
        r2 = requests.get(f"{BASE_URL}/api/admin/users/all", cookies=cookies, timeout=5)
        if r2.status_code == 200:
            print(f"✅ Get Users: {len(r2.json()['users'])} users")
        
        # Test 4: Get Courses
        r3 = requests.get(f"{BASE_URL}/api/admin/courses/all", cookies=cookies, timeout=5)
        if r3.status_code == 200:
            print(f"✅ Get Courses: {len(r3.json()['courses'])} courses")
    else:
        print(f"❌ Admin Login: {r.status_code}")
except Exception as e:
    print(f"❌ Error: {e}")

print("\n🎉 Backend is working! Ready for frontend.")
