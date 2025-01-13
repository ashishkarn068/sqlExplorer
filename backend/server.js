const express = require('express');
const sql = require('mssql/msnodesqlv8');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Update database configuration to match working test config
const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  options: {
    encrypt: false,  // Changed from true
    trustServerCertificate: true,
    trustedConnection: true,
    enableArithAbort: true,
    instanceName: 'SQLEXPRESS'
  }
};

// API endpoint to get databases
app.get('/api/databases', async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const result = await pool.request()
      .query(`
        SELECT 
          name,
          database_id as id 
        FROM sys.databases 
        WHERE database_id > 4 
          AND state_desc = 'ONLINE'
        ORDER BY name
      `);
    console.log('Available databases:', result.recordset);
    res.json(result.recordset);
  } catch (err) {
    console.error('Database Error:', err);
    res.status(500).json({ error: err.message });
  } finally {
    await sql.close();
  }
});

// API endpoint to get tables for a database
app.get('/api/tables/:database', async (req, res) => {
  try {
    const dbConfig = {
      ...config,
      database: req.params.database
    };

    const pool = await sql.connect(dbConfig);
    
    const result = await pool.request().query(`
      SELECT 
        t.TABLE_NAME as name,
        c.COLUMN_NAME as column_name,
        c.DATA_TYPE as data_type
      FROM INFORMATION_SCHEMA.TABLES t
      JOIN INFORMATION_SCHEMA.COLUMNS c 
        ON t.TABLE_NAME = c.TABLE_NAME
      WHERE t.TABLE_TYPE = 'BASE TABLE'
        AND t.TABLE_CATALOG = '${req.params.database}'
      ORDER BY t.TABLE_NAME, c.ORDINAL_POSITION
    `);

    // Transform the data
    const tables = [];
    let currentTable = null;

    for (const row of result.recordset) {
      if (!currentTable || currentTable.name !== row.name) {
        if (currentTable) {
          tables.push(currentTable);
        }
        currentTable = {
          name: row.name,
          columns: []
        };
      }
      currentTable.columns.push({
        name: row.column_name,
        type: row.data_type
      });
    }

    if (currentTable) {
      tables.push(currentTable);
    }

    res.json(tables);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: err.message });
  } finally {
    await sql.close();
  }
});

// API endpoint to execute queries
app.post('/api/query', async (req, res) => {
  const { database, rawQuery, tableName, whereColumn, whereValue, orderByColumn, orderDirection } = req.body;
  
  try {
    console.log('Executing query with params:', { database, rawQuery, tableName });
    
    const pool = await sql.connect({
      ...config,
      database: database
    });

    let query;
    let request = pool.request();

    if (rawQuery) {
      // Use the raw SQL query if provided
      query = rawQuery;
      console.log('Executing raw SQL:', query);
    } else {
      // Build query from filters
      query = `SELECT * FROM [${tableName}]`;
      
      if (whereColumn && whereValue) {
        query += ` WHERE [${whereColumn}] = @whereValue`;
        request.input('whereValue', whereValue);
      }
      
      if (orderByColumn) {
        query += ` ORDER BY [${orderByColumn}] ${orderDirection || 'ASC'}`;
      }
      console.log('Executing built SQL:', query);
    }

    const result = await request.query(query);
    
    // Ensure we're sending an array
    const rows = Array.isArray(result.recordset) ? result.recordset : [];
    
    // Add row IDs if they don't exist
    const rowsWithIds = rows.map((row, index) => ({
      id: index,
      ...row
    }));

    console.log(`Query returned ${rowsWithIds.length} rows`);
    res.json(rowsWithIds);
    
  } catch (err) {
    console.error('Query execution error:', err);
    res.status(500).json({ 
      error: err.message,
      details: 'Error executing query'
    });
  } finally {
    await sql.close();
  }
});

// Update test connection endpoint
app.get('/api/test-connection/:database', async (req, res) => {
  const { database } = req.params;
  
  try {
    const pool = new sql.ConnectionPool({
      ...config,
      database: database,
    });

    await pool.connect();
    console.log(`Successfully connected to database: ${database}`);
    await pool.close();
    
    res.json({ success: true, message: 'Connection successful' });
  } catch (error) {
    console.error('SQL Server Connection Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Connection failed', 
      error: error.message 
    });
  }
});

const PORT = process.env.PORT || 1433;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 