import os
import subprocess
import json
import sys
import importlib
import time
import threading
from pathlib import Path
from datetime import datetime

# Cool icons for different states and operations
ICONS = {
    'rocket': '🚀',
    'gear': '⚙️',
    'warning': '⚠️',
    'error': '❌',
    'success': '✅',
    'info': 'ℹ️',
    'file': '📄',
    'database': '🗄️',
    'backup': '💾',
    'node': '📦',
    'terminal': '💻',
    'web': '🌐',
    'question': '❓',
    'sparkles': '✨',
    'tools': '🛠️',
    'input': '📝',
}

DEFAULT_BASE_DIR = r"C:\git\ApplicationSuite\Source\Metadata"
RESOURCES_DIR = Path(__file__).parent / 'backend' / 'resources'

class Spinner:
    """A simple spinner class for showing loading animation."""
    def __init__(self, message="Processing"):
        self.spinner_chars = "⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏"
        self.message = message
        self.running = False
        self.spinner_thread = None

    def spin(self):
        while self.running:
            for char in self.spinner_chars:
                if not self.running:
                    break
                sys.stdout.write(f'\r{char} {self.message}...')
                sys.stdout.flush()
                time.sleep(0.1)

    def __enter__(self):
        self.running = True
        self.spinner_thread = threading.Thread(target=self.spin)
        self.spinner_thread.start()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.running = False
        self.spinner_thread.join()
        sys.stdout.write('\r✓ ' + self.message + ' completed!      \n')
        sys.stdout.flush()

def check_node_installation():
    """Check if Node.js is installed and install if not."""
    try:
        result = subprocess.run(['node', '--version'], 
                              capture_output=True, 
                              text=True)
        if result.returncode == 0:
            print(f"{ICONS['success']} Node.js {result.stdout.strip()} is already installed")
            return True
    except FileNotFoundError:
        print(f"\n{ICONS['error']} Node.js is not installed.")
        response = input(f"{ICONS['question']} Would you like to install Node.js now? (Y/n): ").strip().lower()
        if response in ['', 'y', 'yes']:
            return install_node()
        else:
            print(f"{ICONS['error']} Node.js is required to run the application. Exiting...")
            sys.exit(1)
    return False

def install_node():
    """Install Node.js using the appropriate method for Windows."""
    print(f"\n{ICONS['gear']} Installing Node.js...")
    try:
        # Download Node.js installer
        with Spinner(f"{ICONS['node']} Downloading Node.js installer"):
            subprocess.run([
                'powershell', 
                '-Command',
                "Invoke-WebRequest -Uri 'https://nodejs.org/dist/latest-v20.x/node-v20.11.1-x64.msi' -OutFile 'node_installer.msi'"
            ], check=True, capture_output=True)

        # Install Node.js
        with Spinner(f"{ICONS['node']} Installing Node.js"):
            subprocess.run(['msiexec', '/i', 'node_installer.msi', '/quiet', '/norestart'], 
                         check=True, capture_output=True)
        
        # Clean up installer
        os.remove('node_installer.msi')
        
        print(f"{ICONS['success']} Node.js installation completed!")
        
        # Update PATH environment variable
        os.environ['PATH'] = subprocess.run(
            ['powershell', '-Command', '[System.Environment]::GetEnvironmentVariable("PATH", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH", "User")'],
            capture_output=True, text=True
        ).stdout.strip()
        
        return True
    except subprocess.CalledProcessError as e:
        print(f"{ICONS['error']} Error installing Node.js: {e}")
        print(f"{ICONS['error']} Please install Node.js manually from https://nodejs.org")
        return False

def install_pyodbc():
    """Install pyodbc package using pip."""
    print(f"\n{ICONS['gear']} Installing pyodbc package...")
    try:
        with Spinner(f"{ICONS['tools']} Installing pyodbc"):
            subprocess.run([sys.executable, "-m", "pip", "install", "pyodbc"], 
                         check=True, 
                         capture_output=True, 
                         text=True)
        
        # Restart the script
        print(f"\n{ICONS['gear']} Restarting the script...")
        os.execv(sys.executable, [sys.executable] + sys.argv)
    except subprocess.CalledProcessError as e:
        print(f"{ICONS['error']} Error installing pyodbc:")
        print(e.stderr)
        sys.exit(1)

# Try to import pyodbc, install if not found
try:
    import pyodbc
except ImportError:
    print(f"\n{ICONS['error']} pyodbc package not found.")
    response = input(f"{ICONS['question']} Would you like to install it now? (Y/n): ").strip().lower()
    if response in ['', 'y', 'yes']:
        install_pyodbc()
    else:
        print(f"{ICONS['error']} pyodbc is required for database connection. Exiting...")
        sys.exit(1)

def test_db_connection(server, database, driver):
    """Test the database connection with the provided credentials."""
    connection_string = f"Driver={{{driver}}};Server={server};Database={database};Trusted_Connection=yes;"
    try:
        with Spinner(f"{ICONS['database']} Testing database connection"):
            conn = pyodbc.connect(connection_string, timeout=5)
            cursor = conn.cursor()
            cursor.execute("SELECT @@version")
            version = cursor.fetchone()[0]
            cursor.close()
            conn.close()
        print(f"{ICONS['success']} SQL Server version: {version.split('\\n')[0]}")
        return True
    except pyodbc.Error as e:
        print(f"\n{ICONS['error']} Error connecting to database:")
        print(f"{ICONS['error']} Error message: {str(e)}")
        return False

def get_user_input():
    """Get database configuration from user."""
    print(f"\n{ICONS['info']} SQL Explorer currently supports AxDbRain database system.")
    print(f"{ICONS['info']} Default database will be 'AxDbRain' if no value is provided.")
    
    config = {}
    
    # Get SQL Server name
    while True:
        server_name = input(f"\n{ICONS['input']} Enter your SQL Server name: ").strip()
        if server_name:
            config['server_name'] = server_name
            break
        print(f"{ICONS['error']} Server name cannot be empty. Please try again.")
    
    # Get database name (default: AxDbRain)
    db_name = input(f"\n{ICONS['input']} Enter database name (press Enter for 'AxDbRain'): ").strip()
    config['db_name'] = db_name if db_name else 'AxDbRain'
    print(f"{ICONS['info']} Using database: {config['db_name']}")
    
    # Set the SQL Server driver
    config['db_driver'] = 'ODBC Driver 17 for SQL Server'
    print(f"\n{ICONS['info']} Using SQL Server driver: {config['db_driver']}")
    
    # Set base directory
    config['base_dir'] = str(Path(__file__).parent)
    
    return config

def create_env_file(config):
    """Create .env file with database configuration."""
    try:
        # Create .env file in the backend directory
        env_path = Path(__file__).parent / 'backend' / '.env'
        
        env_content = (
            f"DB_SERVER={config['server_name']}\n"
            f"DB_NAME={config['db_name']}\n"
            f"DB_DRIVER={config['db_driver']}\n"
            "PORT=3001\n"
        )
        
        print(f"\n{ICONS['file']} Creating .env file in backend directory...")
        with open(env_path, 'w') as f:
            f.write(env_content)
        print(f"{ICONS['success']} Successfully created .env file")
        
    except Exception as e:
        print(f"{ICONS['error']} Error creating .env file: {e}")
        raise

def get_user_confirmation(file_type):
    """Get user confirmation before generating a specific JSON file."""
    messages = {
        'index': (
            f"\n{ICONS['file']} Generate tableIndex.json?"
            f"\n{ICONS['info']} This will refresh the entire index metadata for all tables."
            f"\n{ICONS['backup']} Existing index metadata will be backed up if present."
        ),
        'relations': (
            f"\n{ICONS['file']} Generate tableRelations.json?"
            f"\n{ICONS['info']} This will recreate the entire relationship metadata between tables."
            f"\n{ICONS['backup']} Existing relationship metadata will be backed up if present."
        )
    }
    
    while True:
        print(messages[file_type])
        response = input(f"\n{ICONS['question']} Generate file? (Y/n): ").strip().lower()
        if response in ['y', 'yes', '']:
            return True
        elif response in ['n', 'no']:
            return False
        print(f"{ICONS['warning']} Please answer 'y' or 'n'")

def backup_existing_files(files_to_backup):
    """Backup existing JSON files if they exist."""
    if not files_to_backup:
        return
        
    RESOURCES_DIR.mkdir(parents=True, exist_ok=True)
    backup_time = datetime.now().strftime('%Y%m%d_%H%M%S')
    
    for filename in files_to_backup:
        file_path = RESOURCES_DIR / filename
        if file_path.exists():
            backup_path = file_path.with_name(f"{file_path.stem}_{backup_time}{file_path.suffix}")
            try:
                file_path.rename(backup_path)
                print(f"{ICONS['backup']} Backed up existing {filename} to {backup_path.name}")
            except Exception as e:
                print(f"{ICONS['warning']} Could not backup {filename}: {e}")

def run_script(script_name, base_dir):
    """Run a Python script and move its output to the resources directory."""
    script_path = Path(__file__).parent / 'scripts' / script_name
    if not script_path.exists():
        raise FileNotFoundError(f"Script not found: {script_path}")
    
    try:
        with Spinner(f"{ICONS['tools']} Running {script_name}"):
            result = subprocess.run(
                ['python', str(script_path), base_dir], 
                check=True,
                capture_output=True,
                text=True
            )
        
        # Move generated files to resources directory
        output_file = 'tableIndex.json' if 'index' in script_name else 'tableRelations.json'
        source = Path(__file__).parent / output_file
        if source.exists():
            target = RESOURCES_DIR / output_file
            source.rename(target)
                
        print(f"\n{result.stdout.strip()}")
    except subprocess.CalledProcessError as e:
        print(f"\n{ICONS['error']} Error running {script_name}:")
        print(f"{ICONS['error']} Exit code: {e.returncode}")
        print(f"{ICONS['error']} Error output: {e.stderr.strip()}")
        raise

def print_next_steps():
    print(f"\n{ICONS['sparkles']} === Next Steps === {ICONS['sparkles']}")
    print(f"\n1. {ICONS['node']} Install dependencies:")
    print("   - In the project root directory, run: npm install")
    print("   - Then navigate to backend directory: cd backend")
    print("   - Install backend dependencies: npm install")
    print(f"\n2. {ICONS['terminal']} Start the development server:")
    print("   - Return to root directory: cd ..")
    print("   - Run: npm run dev")
    print(f"\n3. {ICONS['terminal']} Start the backend server:")
    print("   - Open another terminal")
    print("   - Navigate to the backend directory: cd backend")
    print("   - Run: npm start")
    print(f"\n{ICONS['web']} Once both servers are running, open your browser to: http://localhost:3000")
    print(f"\n{ICONS['rocket']} Happy coding!")

def main():
    try:
        print(f"\n{ICONS['sparkles']} === SQL Explorer Project Initialization === {ICONS['sparkles']}\n")
        
        # Check Node.js installation
        with Spinner(f"Checking Node.js {ICONS['node']} installation"):
            check_node_installation()
        
        # Get user input
        config = get_user_input()
        
        print(f"\n{ICONS['gear']} Initializing project...")
        
        # Test database connection
        if not test_db_connection(config['server_name'], config['db_name'], config['db_driver']):
            print(f"\n{ICONS['error']} Database connection failed. Please check your settings and try again.")
            return 1
        
        # Create .env file
        create_env_file(config)
        
        # Ensure resources directory exists
        RESOURCES_DIR.mkdir(parents=True, exist_ok=True)
        
        # Track which files to generate
        files_to_generate = []
        
        # Ask for tableIndex.json generation
        if get_user_confirmation('index'):
            files_to_generate.append(('extract_table_indexes.py', 'tableIndex.json'))
            
        # Ask for tableRelations.json generation
        if get_user_confirmation('relations'):
            files_to_generate.append(('extract_table_relations.py', 'tableRelations.json'))
            
        if not files_to_generate:
            print(f"\n{ICONS['info']} No files selected for generation. Skipping metadata extraction.")
        else:
            # Backup existing files that will be generated
            files_to_backup = [f[1] for f in files_to_generate]
            backup_existing_files(files_to_backup)
            
            # Generate selected files
            print(f"\n{ICONS['tools']} Generating selected metadata files...")
            for script_name, _ in files_to_generate:
                run_script(script_name, config['base_dir'])
        
        print(f"\n{ICONS['sparkles']} === Project initialization completed successfully! === {ICONS['sparkles']}")
        
        # Print next steps
        print_next_steps()
        
    except Exception as e:
        print(f"\n{ICONS['error']} Error during initialization: {e}")
        print(f"{ICONS['error']} Project initialization failed. Please try again.")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())
