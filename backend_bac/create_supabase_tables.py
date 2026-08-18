import os
from dotenv import load_dotenv
from supabase import create_client

# Load environment variables
load_dotenv()

# Supabase Configuration
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')

def execute_schema():
    """Execute the schema SQL in Supabase"""
    try:
        # Initialize Supabase client
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("Supabase Connected Successfully!")

        # Read the schema SQL file
        with open('supabase_schema.sql', 'r') as file:
            schema_sql = file.read()

        # Split the SQL into individual statements
        statements = schema_sql.split(';')

        # Execute each statement
        for statement in statements:
            if statement.strip():
                try:
                    # Execute the SQL statement
                    result = supabase.rpc('exec_sql', {'query': statement}).execute()
                    print(f"Executed statement successfully")
                except Exception as e:
                    print(f"Error executing statement: {str(e)}")
                    print(f"Statement: {statement}")

        print("Schema execution completed!")

    except Exception as e:
        print(f"Error during schema execution: {str(e)}")

if __name__ == "__main__":
    execute_schema() 