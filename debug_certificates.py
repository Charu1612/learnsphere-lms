import requests

print("Testing certificates API...")

# Login
login_response = requests.post('http://localhost:8000/api/auth/login', json={
    "email": "learner@test.com",
    "password": "password123"
})

if login_response.status_code == 200:
    print("✅ Login successful")
    cookies = login_response.cookies
    
    # Get achievements
    achievements_response = requests.get('http://localhost:8000/api/learner/achievements', cookies=cookies)
    
    if achievements_response.status_code == 200:
        data = achievements_response.json()
        print(f"\n📊 API Response:")
        print(f"  Certificates in response: {len(data.get('certificates', []))}")
        
        if data.get('certificates'):
            print(f"\n  Certificate details:")
            for cert in data['certificates']:
                print(f"    - ID: {cert.get('id')}")
                print(f"      Number: {cert.get('certificate_number')}")
                print(f"      Course: {cert.get('courses', {})}")
        else:
            print(f"\n  ❌ Certificates array is empty!")
            print(f"  Full response: {data}")
    else:
        print(f"❌ API failed: {achievements_response.status_code}")
        print(achievements_response.text)
else:
    print(f"❌ Login failed: {login_response.status_code}")
