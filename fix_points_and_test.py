"""
Fix points system and test a new lesson completion
"""
import os
from supabase import create_client
from datetime import datetime, timezone

# Initialize Supabase
SUPABASE_URL = "https://aqrlbobkgsrklyyuvcuf.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxcmxib2JrZ3Nya2x5eXV2Y3VmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzNzU5NzksImV4cCI6MjA4NTk1MTk3OX0.Yz-Yz0Yz0Yz0Yz0Yz0Yz0Yz0Yz0Yz0Yz0Yz0Yz0Yz0"
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

print("🔍 Checking user_points table structure...")

# Get existing points for user 19
try:
    points = supabase.table("user_points").select("*").eq("user_id", 19).execute()
    print(f"\n📊 Found {len(points.data)} point records for user 19")
    
    if points.data:
        print("\nSample record structure:")
        print(points.data[0])
        
        # Calculate total
        total = sum([p.get('points', 0) for p in points.data])
        print(f"\n💰 Total points: {total}")
    else:
        print("No points records found")
        
    # Add test points
    print("\n➕ Adding test points for lesson completion...")
    supabase.table("user_points").insert({
        "user_id": 19,
        "points": 10,
        "reason": "Test: Completed lesson",
        "earned_date": datetime.now(timezone.utc).isoformat()
    }).execute()
    
    print("✅ Test points added")
    
    # Check again
    points = supabase.table("user_points").select("*").eq("user_id", 19).execute()
    total = sum([p.get('points', 0) for p in points.data])
    print(f"💰 New total points: {total}")
    
except Exception as e:
    print(f"❌ Error: {e}")
    print("\nTrying to check table schema...")
    try:
        # Try to get any record to see structure
        all_points = supabase.table("user_points").select("*").limit(1).execute()
        if all_points.data:
            print("Sample record from table:")
            print(all_points.data[0])
    except Exception as e2:
        print(f"❌ Error getting schema: {e2}")
