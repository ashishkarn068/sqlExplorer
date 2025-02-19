import os
import subprocess
import json
import sys
import importlib
from pathlib import Path
from datetime import datetime

DEFAULT_BASE_DIR = r"C:\git\ApplicationSuite\Source\Metadata"

def install_pyodbc():
    """Install pyodbc package using pip."""
    print("\nInstalling pyodbc package...")
    try:
        subprocess.run([sys.executable, "-m", "pip", "install", "pyodbc"], 
                      check=True, 
                      capture_output=True, 
                      text=True)
        print("✓ Successfully installed pyodbc")
        
        # Restart the script
        print("\nRestarting the script...")
        os.execv(sys.executable, [sys.executable] + sys.argv)
    except subprocess.CalledProcessError as e:
        print("Error installing pyodbc:")
        print(e.stderr)
        sys.exit(1)

# Try to import pyodbc, install if not found
try:
    import pyodbc
except ImportError:
    print("\npyodbc package not found.")
    response = input("Would you like to install it now? (Y/n): ").strip().lower()
    if response in ['', 'y', 'yes']:
        install_pyodbc()
    else:
        print("pyodbc is required for database connection. Exiting...")
        sys.exit(1)

def test_db_connection(server, database, driver):
    """Test the database connection with the provided credentials."""
    connection_string = f"Driver={{{driver}}};Server={server};Database={database};Trusted_Connection=yes;"
    try:
        print("\nTesting database connection...")
        conn = pyodbc.connect(connection_string, timeout=5)
        cursor = conn.cursor()
        cursor.execute("SELECT @@version")
        version = cursor.fetchone()[0]
        cursor.close()
        conn.close()
        print("✓ Database connection successful!")
        print(f"✓ SQL Server version: {version.split('\\n')[0]}")
        return True
    except pyodbc.Error as e:
        print(f"\nError connecting to database:")
        print(f"Error message: {str(e)}")
        return False

def get_user_input():
    print("\n=== SQL Explorer Project Initialization ===\n")
    
    # Get base directory path
    while True:
        base_dir = input(f"Enter the base directory path of ApplicationSuite\\Source\\Metadata\n(Press Enter to use default: {DEFAULT_BASE_DIR}): ").strip()
        
        # Use default if no input
        if not base_dir:
            base_dir = DEFAULT_BASE_DIR
            print(f"Using default path: {base_dir}")
        
        if os.path.exists(base_dir):
            break
        print(f"Error: Directory does not exist: {base_dir}")
        print("Please enter a valid path or press Enter to use the default path.")
    
    # Get database server name
    while True:
        server_name = input("\nEnter the SQL Server name (e.g., localhost\\SQLEXPRESS): ").strip()
        if server_name:
            break
        print("Error: Server name cannot be empty.")
    
    # Get database name
    while True:
        db_name = input("\nEnter the database name: ").strip()
        if db_name:
            break
        print("Error: Database name cannot be empty.")
    
    # Default driver
    db_driver = "ODBC Driver 17 for SQL Server"
    print(f"\nUsing default SQL Server driver: {db_driver}")
    
    return {
        'base_dir': base_dir,
        'server_name': server_name,
        'db_name': db_name,
        'db_driver': db_driver
    }

def create_env_file(config):
    env_content = f"""DB_SERVER='{config['server_name']}'
DB_NAME='{config['db_name']}'
DB_DRIVER='{config['db_driver']}'
PORT=3001"""
    
    env_path = Path(__file__).parent / 'backend' / '.env'
    try:
        # Create backend directory if it doesn't exist
        env_path.parent.mkdir(exist_ok=True)
        
        with open(env_path, 'w') as f:
            f.write(env_content)
        print(f"\n✓ Created .env file at {env_path}")
    except Exception as e:
        print(f"\nError creating .env file: {e}")
        raise

def backup_existing_files():
    """Backup existing JSON files if they exist."""
    files_to_backup = ['tableIndex.json', 'tableRelations.json']
    backup_time = datetime.now().strftime('%Y%m%d_%H%M%S')
    
    for filename in files_to_backup:
        file_path = Path(__file__).parent / filename
        if file_path.exists():
            backup_path = file_path.with_name(f"{file_path.stem}_{backup_time}{file_path.suffix}")
            try:
                file_path.rename(backup_path)
                print(f"✓ Backed up existing {filename} to {backup_path.name}")
            except Exception as e:
                print(f"Warning: Could not backup {filename}: {e}")

def run_script(script_name, base_dir):
    script_path = Path(__file__).parent / 'scripts' / script_name
    if not script_path.exists():
        raise FileNotFoundError(f"Script not found: {script_path}")
    
    try:
        result = subprocess.run(
            ['python', str(script_path), base_dir], 
            check=True,
            capture_output=True,
            text=True
        )
        print(f"\n{result.stdout.strip()}")
        print(f"✓ Successfully ran {script_name}")
    except subprocess.CalledProcessError as e:
        print(f"\nError running {script_name}:")
        print(f"Exit code: {e.returncode}")
        print(f"Error output: {e.stderr.strip()}")
        raise

def print_next_steps():
    print("\n=== Next Steps ===")
    print("\n1. Install Node.js:")
    print("   - Visit https://nodejs.org")
    print("   - Download and install the latest LTS version")
    print("\n2. Start the development server:")
    print("   - Open a terminal in the project root directory")
    print("   - Run: npm run dev")
    print("\n3. Start the backend server:")
    print("   - Open another terminal")
    print("   - Navigate to the backend directory: cd backend")
    print("   - Run: npm start")
    print("\nOnce both servers are running, open your browser to: http://localhost:3000")
    print("\nHappy coding! 🚀")

def main():
    try:
        # Get user input
        config = get_user_input()
        
        print("\nInitializing project...")
        
        # Test database connection
        if not test_db_connection(config['server_name'], config['db_name'], config['db_driver']):
            print("\nDatabase connection failed. Please check your settings and try again.")
            return 1
        
        # Create .env file
        create_env_file(config)
        
        # Backup existing JSON files
        backup_existing_files()
        
        # Run the scripts to generate JSON files
        print("\nGenerating table indexes and relations...")
        run_script('extract_table_indexes.py', config['base_dir'])
        run_script('extract_table_relations.py', config['base_dir'])
        
        print("\n=== Project initialization completed successfully! ===")
        
        # Print next steps
        print_next_steps()
        
    except Exception as e:
        print(f"\nError during initialization: {e}")
        print("Project initialization failed. Please try again.")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())
