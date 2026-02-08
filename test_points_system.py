"""
Test script to verify points system is working correctly
"""
import requests

BASE_URL = "http://localhost:8000"

# Login as learner
session = requests.Session()
login_response = session.post(f"{BASE_URL}/api/auth/login", json={
    "email": "learner@test.com",
    "password": "password123"
})

if login_response.status_code == 200:
    print("✅ Login successful")
    login_data = login_response.json()
    token = login_data.get('access_token') or login_data.get('token')
    
    # Get achievements to check points
    achievements_response = session.get(
        f"{BASE_URL}/api/learner/achievements",
        headers={"Authorization": f"Bearer {token}"} if token else {}
    )
    
    if achievements_response.status_code == 200:
        data = achievements_response.json()
        print("\n📊 Points Summary:")
        print(f"   Total Points: {data['points']['total_points']}")
        print(f"   Courses Completed: {data['points']['courses_completed']}")
        print(f"   Lessons Completed: {data['points']['lessons_completed']}")
        print(f"   Badge Level: {data['points']['badge_level']}")
        print(f"\n🏆 Badges: {len(data['badges'])}")
        print(f"📜 Certificates: {len(data['certificates'])}")
        
        if data['certificates']:
            print("\n📜 Certificate Details:")
            for cert in data['certificates']:
                print(f"   - {cert['courses']['title']}")
                print(f"     Number: {cert['certificate_number']}")
                print(f"     Grade: {cert['grade']}")
    else:
        print(f"❌ Failed to get achievements: {achievements_response.status_code}")
        print(achievements_response.text)
else:
    print(f"❌ Login failed: {login_response.status_code}")
    print(login_response.text)
