# Project Documentation

## Project Overview
SQLExplorer is a modern SQL Server management and query tool built with React, TypeScript, and Node.js. It provides a user-friendly interface for managing SQL Server databases, executing queries, and visualizing results.

## Features
- Connect to SQL Server databases using Windows Authentication
- Browse databases and tables
- Visual query builder
- Raw SQL query editor with syntax highlighting
- Real-time query results
- Modern, responsive UI

## Tech Stack
- **Frontend**: React, TypeScript, Material-UI, CodeMirror, Lucide icons
- **Backend**: Node.js, Express, MSSQL with Windows Authentication

## Installation Instructions
1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Set up environment variables**:
   - Create a `.env` file in the `backend` directory with the following content:
     ```
     DB_SERVER=your_sql_server
     DB_NAME=your_database_name
     PORT=3001
     ```
4. **Start the backend server**:
   ```bash
   cd backend
   node server.js
   ```
5. **Start the frontend development server**:
   ```bash
   npm run dev
   ```

## Project Structure
- **src/**: Contains the frontend React application
  - **components/**: React components for the UI
  - **types/**: TypeScript type definitions
  - **index.css**: Global styles
  - **main.tsx**: Entry point for the React application
- **backend/**: Contains the Node.js server
  - **server.js**: Main server file
  - **cache.js**: Caching logic for database tables
  - **resources/**: JSON files for table indexes and relations

## API Endpoints
- **GET /api/databases**: Retrieve a list of available databases
- **GET /api/tables/:database**: Retrieve tables for a specific database
- **POST /api/query**: Execute a SQL query
- **GET /api/indexed-columns/:tableName**: Get indexed columns for a table
- **GET /api/table-index/:tableName**: Get table index information
- **GET /api/table-relation/:tableName**: Get table relation information

## Usage
- **Connect to a Database**: Use the database selector in the header to connect to a SQL Server database.
- **Build a Query**: Use the Query Builder to select a table, add filters, and sort results.
- **Execute SQL**: Use the SQL Command section to write and execute raw SQL queries.
- **View Results**: Query results are displayed in a data grid with options to copy values and view related data.

## Troubleshooting
- **EPERM Error**: If you encounter an EPERM error when starting the frontend, try deleting the `.vite` folder manually and restarting the development server.
- **Connection Issues**: Ensure your SQL Server is running and accessible from your machine. Check the `.env` file for correct server and database names.
- **UI Issues**: If the UI doesn't load correctly, try clearing your browser cache or restarting the development server.

For further assistance, please refer to the project's README or contact the project maintainers. 