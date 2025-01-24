const express = require('express');
const sql = require('mssql/msnodesqlv8');
const cors = require('cors');
const DatabaseCache = require('./cache');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

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

// Load tableIndex.json and store in cache
const loadTableIndexToCache = () => {
  const filePath = path.join(__dirname, 'resources', 'tableIndex.json');
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading tableIndex.json:', err);
      return;
    }
    try {
      const tableIndexData = JSON.parse(data);
      DatabaseCache.setTables('tableIndex', tableIndexData);
      console.log('Table index data cached successfully.');
      console.log('Available tables in cache:', tableIndexData.map(table => table.tableName));
    } catch (parseErr) {
      console.error('Error parsing tableIndex.json:', parseErr);
    }
  });
};

// Call the function to load table index data into cache
loadTableIndexToCache();

// Load tableRelation.json and store in cache
const loadTableRelationToCache = () => {
  const filePath = path.join(__dirname, 'resources', 'tableRelations.json');
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading tableRelations.json:', err);
      return;
    }
    try {
      const tableRelationData = JSON.parse(data);
      DatabaseCache.setTables('tableRelation', tableRelationData);
      console.log('Table relation data cached successfully.');
    } catch (parseErr) {
      console.error('Error parsing tableRelations.json:', parseErr);
    }
  });
};

// Call the function to load table relation data into cache
loadTableRelationToCache();

// Ensure case-insensitive comparisons
const caseInsensitiveFind = (array, key, value) => {
  return array.find(item => item[key].toLowerCase() === value.toLowerCase());
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
  }
});

// API endpoint to get tables for a database
app.get('/api/tables/:database', async (req, res) => {
  const dbName = req.params.database;
  console.log('Fetching tables for database:', dbName);
  
  try {
    // Check cache first
    const cachedTables = DatabaseCache.getTables(dbName);
    if (cachedTables) {
      console.log('Returning cached tables for:', dbName);
      return res.json(cachedTables);
    }

    // If not in cache, fetch from database
    const dbConfig = {
      ...config,
      database: dbName
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
        AND t.TABLE_CATALOG = '${dbName}'
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

    // Store in cache
    DatabaseCache.setTables(dbName, tables);
    console.log(`Cached ${tables.length} tables for database:`, dbName);

    res.json(tables);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// API endpoint to execute queries
app.post('/api/query', async (req, res) => {
  const { database, rawQuery, tableName, orderByColumn, orderDirection = 'ASC', pageSize = 25, page = 0 } = req.body;

  try {
    const pool = await sql.connect({
      ...config,
      database: database
    });
    let query;
    let countQuery;

    if (rawQuery) {
      // For raw SQL queries
      const offset = page * pageSize;
      // Extract the base query without any existing ORDER BY or OFFSET
      let baseQuery = rawQuery.replace(/\bORDER\s+BY\s+[^;]+/i, '').trim();
      baseQuery = baseQuery.replace(/\bOFFSET\s+\d+\s+ROWS\s+FETCH\s+NEXT\s+\d+\s+ROWS\s+ONLY\s*/i, '').trim();
      
      // Add ORDER BY if not present (required for OFFSET-FETCH)
      if (!baseQuery.toLowerCase().includes('order by')) {
        baseQuery += ' ORDER BY (SELECT NULL)';
      }

      query = `${baseQuery} OFFSET ${offset} ROWS FETCH NEXT ${pageSize} ROWS ONLY`;
      // Count query to get total rows
      countQuery = `SELECT COUNT(*) as total FROM (${baseQuery}) as subquery`;
    } else {
      // For built queries
      const offset = page * pageSize;
      query = `SELECT * FROM [${tableName}]`;
      if (orderByColumn) {
        query += ` ORDER BY [${orderByColumn}] ${orderDirection}`;
      } else {
        query += ` ORDER BY (SELECT NULL)`; // Default order when none specified
      }
      query += ` OFFSET ${offset} ROWS FETCH NEXT ${pageSize} ROWS ONLY`;
      
      // Count query for total rows
      countQuery = `SELECT COUNT(*) as total FROM [${tableName}]`;
    }

    console.log('Executing query:', query);
    console.log('Executing count query:', countQuery);

    // Execute both queries in parallel
    const [result, countResult] = await Promise.all([
      pool.request().query(query),
      pool.request().query(countQuery)
    ]);

    const totalRows = countResult.recordset[0].total;
    const rowsWithIds = result.recordset.map((row, index) => ({
      ...row,
      id: page * pageSize + index // Ensure IDs are unique across pages
    }));

    res.json({
      rows: rowsWithIds,
      totalRows,
      page,
      pageSize
    });
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({ error: error.message });
  }
});

// API endpoint to get indexed columns for a table
app.get('/api/indexed-columns/:tableName', (req, res) => {
  const tableName = req.params.tableName;
  console.log('Fetching indexed columns for table:', tableName);

  // Check cache first
  const cachedIndexData = DatabaseCache.getTableIndex(tableName);
  if (cachedIndexData) {
    console.log('Returning cached index data for:', tableName);
    return res.json(cachedIndexData.indexes.flatMap(index => index.columns));
  }

  // If not in cache, read from file
  const filePath = path.join(__dirname, 'resources', 'tableIndex.json');
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading tableIndex.json:', err);
      return res.status(404).json({ error: 'Table index data not found' });
    }
    try {
      const tableIndexData = JSON.parse(data);
      const tableData = tableIndexData.find(table => table.tableName.toLowerCase() === tableName.toLowerCase());
      
      if (!tableData) {
        console.error('Table not found in index data');
        return res.status(404).json({ error: 'Table not found in index data' });
      }

      // Store in cache
      DatabaseCache.setTableIndex(tableName, tableData);
      console.log('Cached index data for table:', tableName);

      // Return indexed columns
      const indexedColumns = tableData.indexes.flatMap(index => index.columns);
      res.json(indexedColumns);
    } catch (parseErr) {
      console.error('Error parsing tableIndex.json:', parseErr);
      res.status(500).json({ error: 'Error parsing table index data' });
    }
  });
});

// API endpoint to get table index information
app.get('/api/table-index/:tableName', async (req, res) => {
  const { tableName } = req.params;

  // Check cache first
  const cachedIndexData = DatabaseCache.getTableIndex(tableName);
  if (cachedIndexData) {
    console.log('Returning cached index data for:', tableName);
    return res.json(cachedIndexData);
  }

  // If not in cache, read from file
  const filePath = path.join(__dirname, 'resources', 'tableIndex.json');
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.log(`No index information found for table: ${tableName}`);
      return res.json({ indexes: [] });
    }
    try {
      const tableIndexData = JSON.parse(data);
      const tableData = tableIndexData.find(table => table.tableName.toLowerCase() === tableName.toLowerCase());
      
      if (!tableData) {
        console.log(`No index information found for table: ${tableName}`);
        return res.json({ indexes: [] });
      }

      // Store in cache
      DatabaseCache.setTableIndex(tableName, tableData);
      console.log('Cached index data for table:', tableName);
      
      res.json(tableData);
    } catch (parseErr) {
      console.error('Error parsing tableIndex.json:', parseErr);
      res.json({ indexes: [] });
    }
  });
});

// API endpoint to get table relation information
app.get('/api/table-relation/:tableName', async (req, res) => {
  const { tableName } = req.params;

  // Check cache first
  const cachedRelationData = DatabaseCache.getTableRelation(tableName);
  if (cachedRelationData) {
    console.log('Returning cached relation data for:', tableName);
    return res.json(cachedRelationData);
  }

  // If not in cache, read from file
  const filePath = path.join(__dirname, 'resources', 'tableRelations.json');
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.log(`No relation information found for table: ${tableName}`);
      return res.json({ relations: [] });
    }
    try {
      const tableRelationData = JSON.parse(data);
      const tableData = tableRelationData.find(table => table.tableName.toLowerCase() === tableName.toLowerCase());
      
      if (!tableData) {
        console.log(`No relation information found for table: ${tableName}`);
        return res.json({ relations: [] });
      }

      // Store in cache
      DatabaseCache.setTableRelation(tableName, tableData);
      console.log('Cached relation data for table:', tableName);
      
      res.json(tableData);
    } catch (parseErr) {
      console.error('Error parsing tableRelations.json:', parseErr);
      res.json({ relations: [] });
    }
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});