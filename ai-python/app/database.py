import psycopg2
import os
import logging
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

def get_db_connection():
    """Get connection to Neon PostgreSQL database with pgvector"""
    try:
        conn = psycopg2.connect(
            host=os.getenv('DB_HOST'),
            database=os.getenv('DB_NAME'),
            user=os.getenv('DB_USER'),
            password=os.getenv('DB_PASSWORD'),
            port=os.getenv('DB_PORT', 5432),
            sslmode=os.getenv('SSLMODE', 'require')
            # options=f"-c endpoint={os.getenv('ENDPOINT')}"
        )
    
        # Enable vector operations
        with conn.cursor() as cursor:
            cursor.execute("CREATE EXTENSION IF NOT EXISTS vector")
            conn.commit()
            
        logger.info("Database connection established with pgvector support")
        return conn
        
    except Exception as e:
        logger.error(f"Database connection error: {str(e)}")
        raise

def test_connection():
    """Test database connection and pgvector extension"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check pgvector extension
        cursor.execute("SELECT EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'vector')")
        has_vector = cursor.fetchone()[0]
        
        # Test vector operations
        cursor.execute("SELECT '[1,2,3]'::vector")
        vector_test = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        logger.info("Database test successful - pgvector is working")
        return True
        
    except Exception as e:
        logger.error(f"Database test failed: {str(e)}")
        return False
    
def list_tables():
    """List all tables in the database"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Query to get table names
        cursor.execute("""
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name;
        """)
        
        tables = cursor.fetchall()
        if tables:
            print("Tables in the database:")
            for table in tables:
                print(table[0])  # Table names are in the first column
        else:
            print("No tables found.")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        logger.error(f"Failed to list tables: {str(e)}")


if __name__ == "__main__":
    success = test_connection()
    print("HOST: ",os.getenv("DB_HOST"))
    if success:
        print("✅ Connected to Neon PostgreSQL with pgvector working!")
        list_tables()
    else:
        print("❌ Connection test failed.")
