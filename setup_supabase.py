#!/usr/bin/env python3
import os
import urllib.parse
import subprocess
import sys

# Supabase credentials
password = 'LMk#6/U6KT98pFi'
encoded_password = urllib.parse.quote(password, safe='')
project_id = 'aqrlbobkgsrklyyuvcuf'

# Build connection string
database_url = f"postgresql://postgres:{encoded_password}@db.{project_id}.supabase.co:5432/postgres"

# Set environment variable
os.environ['DATABASE_URL'] = database_url

print("🔗 Initializing Supabase database...")
print(f"Connection: postgresql://postgres:***@db.fcainalprbiooowcroeo.supabase.co:5432/postgres")

# Run init_db
from backend.init_db import init_db
try:
    init_db()
    print("\n✅ Database initialized successfully!")
    print("\n📚 Admin Credentials:")
    print("   Email: admin@learnsphere.com")
    print("   Password: admin123")
    print("   Role: admin")
    
    print("\n👨‍🏫 Instructor Credentials:")
    print("   Email: instructor@learnsphere.com")
    print("   Password: instructor123")
    print("   Role: instructor")
    
except Exception as e:
    print(f"\n❌ Error: {e}")
    sys.exit(1)
