# 🔍 SQL Quick

A modern SQL Server management and query tool built with React, TypeScript, and Node.js. Designed specifically for AxDbRain database system, it provides an intuitive interface for database exploration and query management.

## ✨ Features

- 🔐 Connect to SQL Server databases using Windows Authentication
- 📊 Browse databases and tables with their relationships
- 🎯 Visual query builder with drag-and-drop interface
- ⚡ Raw SQL query editor with syntax highlighting
- 📈 Real-time query results in a modern data grid
- 🔍 Smart table indexing information
- 🔄 Auto-generated table relationships
- 🎨 Modern, responsive Material UI design
- 🌐 Cross-platform compatibility

## 🛠️ Tech Stack

### Frontend
- ⚛️ React with TypeScript
- 🎨 Material-UI for modern components
- 📝 CodeMirror for SQL editing
- 🎯 Lucide icons for beautiful UI
- 📊 Data Grid for result visualization

### Backend
- 🚀 Node.js with Express
- 🔒 Windows Authentication for SQL Server
- 📦 MSSQL driver for database connectivity
- 🔄 Real-time data processing

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- 🟢 Node.js (v14 or higher)
- 📦 npm (comes with Node.js)
- 🔵 SQL Server (with Windows Authentication)
- 🔌 ODBC Driver 17 for SQL Server
- 🗄️ Access to AxDbRain database system

## 🚀 Installation

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd sqlExplorer
   ```

2. **Install Frontend Dependencies**
   ```bash
   npm install
   ```

3. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   ```

4. **Initialize the Project**
   ```bash
   python initialize_project.py
   ```
   This script will:
   - ✅ Verify Node.js installation
   - 🔐 Configure database connection
   - 📝 Create necessary environment files
   - 📊 Generate table metadata
   - 🔄 Set up table relationships

## 🎮 Usage

1. **Start the Development Server**
   ```bash
   # In the root directory
   npm run dev
   ```

2. **Start the Backend Server**
   ```bash
   # In a new terminal, navigate to backend directory
   cd backend
   npm start
   ```

3. **Access the Application**
   - 🌐 Open your browser to `http://localhost:3000`
   - 🔐 The application will automatically use Windows Authentication
   - 📊 Select your database and start exploring!

## 🔧 Configuration

### Environment Variables
The following variables are configured in `backend/.env`:
- `DB_SERVER`: Your SQL Server instance name
- `DB_NAME`: Database name (defaults to AxDbRain)
- `DB_DRIVER`: SQL Server driver (default: ODBC Driver 17)
- `PORT`: Backend server port (default: 3001)

## 📱 Features in Detail

### 1. Database Explorer
- 🌳 Hierarchical view of databases and tables
- 📊 Table structure information
- 🔍 Index information display
- 🔄 Relationship visualization

### 2. Query Builder
- 🎯 Drag-and-drop interface
- 📝 Visual query construction
- 🔍 Smart filtering options
- 🔄 Real-time query preview

### 3. SQL Editor
- 📝 Syntax highlighting
- 🎯 Auto-completion
- 📊 Result grid with sorting and filtering
- 📤 Export capabilities

## 🤝 Contributing

We welcome contributions! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support, please:
1. Check the existing documentation
2. Review known issues in the repository
3. Open a new issue if needed

## 🔄 Updates

Stay tuned for updates and new features. We're constantly improving SQLExplorer to make database management easier and more efficient!
