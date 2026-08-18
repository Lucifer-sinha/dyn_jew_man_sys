import mysql.connector
from supabase import create_client
import os
from dotenv import load_dotenv
import json
from datetime import datetime

# Load environment variables
load_dotenv()

# MySQL Configuration
mysql_config = {
    "host": "localhost",
    "user": "root",
    
    "password": "8520",
    "database": "jewelry_db"
}

# Supabase Configuration
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')

def connect_mysql():
    """Connect to MySQL database"""
    try:
        conn = mysql.connector.connect(**mysql_config)
        print("MySQL Connected Successfully!")
        return conn
    except Exception as e:
        print(f"Error connecting to MySQL: {e}")
        return None

def connect_supabase():
    """Connect to Supabase"""
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("Supabase Connected Successfully!")
        return supabase
    except Exception as e:
        print(f"Error connecting to Supabase: {e}")
        return None

def get_mysql_tables(cursor):
    """Get all tables from MySQL database"""
    cursor.execute("SHOW TABLES")
    return [table[0] for table in cursor.fetchall()]

def get_table_data(cursor, table_name):
    """Get all data from a MySQL table"""
    cursor.execute(f"SELECT * FROM {table_name}")
    columns = [desc[0] for desc in cursor.description]
    rows = cursor.fetchall()
    return [dict(zip(columns, row)) for row in rows]

def convert_datetime(obj):
    """Convert datetime objects to ISO format string"""
    if isinstance(obj, datetime):
        return obj.isoformat()
    return obj

def migrate_data():
    """Migrate data from MySQL to Supabase"""
    # Connect to databases
    mysql_conn = connect_mysql()
    if not mysql_conn:
        return
    
    supabase = connect_supabase()
    if not supabase:
        return
    
    try:
        cursor = mysql_conn.cursor(dictionary=True)
        tables = get_mysql_tables(cursor)
        
        for table in tables:
            print(f"\nMigrating table: {table}")
            
            # Get data from MySQL
            data = get_table_data(cursor, table)
            
            # Convert datetime objects
            for row in data:
                for key, value in row.items():
                    row[key] = convert_datetime(value)
            
            # Insert data into Supabase
            if data:
                try:
                    # Delete existing data in Supabase table
                    supabase.table(table).delete().execute()
                    
                    # Insert new data
                    result = supabase.table(table).insert(data).execute()
                    print(f"Successfully migrated {len(data)} rows to {table}")
                except Exception as e:
                    print(f"Error migrating table {table}: {e}")
            
    except Exception as e:
        print(f"Error during migration: {e}")
    finally:
        mysql_conn.close()
        print("\nMigration completed!")

if __name__ == "__main__":
    migrate_data() 