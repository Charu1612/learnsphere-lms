"""
Find working Supabase connection
"""
import psycopg2

configs = [
    {
        'name': 'Direct Connection (Port 5432)',
        'config': {
            'host': 'db.aqrlbobkgsrklyyuvcuf.supabase.co',
            'port': 5432,
            'user': 'postgres',
            'password': 'LMk#6/U6KT98pFi',
            'database': 'postgres',
            'connect_timeout': 5
        }
    },
    {
        'name': 'Connection Pooler - Transaction Mode',
        'config': {
            'host': 'aws-0-ap-south-1.pooler.supabase.com',
            'port': 6543,
            'user': 'postgres.aqrlbobkgsrklyyuvcuf',
            'password': 'LMk#6/U6KT98pFi',
            'database': 'postgres',
            'connect_timeout': 5
        }
    },
    {
        'name': 'Connection Pooler - Session Mode',
        'config': {
            'host': 'aws-0-ap-south-1.pooler.supabase.com',
            'port': 5432,
            'user': 'postgres.aqrlbobkgsrklyyuvcuf',
            'password': 'LMk#6/U6KT98pFi',
            'database': 'postgres',
            'connect_timeout': 5
        }
    }
]

print("\n" + "="*60)
print("TESTING SUPABASE CONNECTIONS")
print("="*60)

working_config = None

for test in configs:
    print(f"\n{test['name']}...")
    print(f"  Host: {test['config']['host']}")
    print(f"  Port: {test['config']['port']}")
    print(f"  User: {test['config']['user']}")
    
    try:
        conn = psycopg2.connect(**test['config'])
        print("  ✓ CONNECTION SUCCESSFUL!")
        
        # Test query
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM users")
        count = cur.fetchone()[0]
        print(f"  ✓ Query works! Found {count} users")
        
        conn.close()
        working_config = test
        break
    except Exception as e:
        error_msg = str(e).split('\n')[0][:80]
        print(f"  ✗ Failed: {error_msg}")

print("\n" + "="*60)

if working_config:
    print("✓ FOUND WORKING CONNECTION!")
    print("="*60)
    print(f"\nUse this configuration:")
    print(f"  Host: {working_config['config']['host']}")
    print(f"  Port: {working_config['config']['port']}")
    print(f"  User: {working_config['config']['user']}")
    print(f"  Database: {working_config['config']['database']}")
else:
    print("✗ NO WORKING CONNECTION FOUND")
    print("="*60)
    print("\nPossible issues:")
    print("1. Firewall blocking all PostgreSQL ports")
    print("2. VPN/Proxy interfering")
    print("3. Supabase project paused")
    print("4. Wrong credentials")
    print("\nPlease check:")
    print("- Supabase Dashboard > Settings > Database")
    print("- Copy the connection string from there")
    print("- Check if project is active")

print("\n" + "="*60)
