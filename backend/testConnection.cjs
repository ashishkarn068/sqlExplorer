const sql = require('mssql/msnodesqlv8');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

async function testDatabaseConnections() {
  const config = {
    server: process.env.DB_SERVER,
    options: {
      encrypt: false,
      trustServerCertificate: true,
      trustedConnection: true,
      enableArithAbort: true,
      instanceName: 'SQLEXPRESS'
    }
  };

  try {
    // First test connection to master database
    console.log('\nTesting connection to master database...');
    const masterConfig = { ...config, database: 'master' };
    let pool = await sql.connect(masterConfig);
    console.log('✓ Successfully connected to master database');

    // Get all databases
    const result = await pool.request()
      .query('SELECT name FROM sys.databases WHERE database_id > 4');
    const databases = result.recordset.map(db => db.name);
    console.log('Available databases:', databases);
    await pool.close();

    // Test connection to each user database
    for (const dbName of databases) {
      console.log(`\nTesting connection to ${dbName}...`);
      const dbConfig = { ...config, database: dbName };
      pool = await sql.connect(dbConfig);
      console.log(`✓ Successfully connected to ${dbName}`);

      // Log all tables in the connected database
      const tablesResult = await pool.request()
        .query('SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = \'BASE TABLE\'');
      const tables = tablesResult.recordset.map(table => table.TABLE_NAME);
      console.log(`Tables in ${dbName}:`, tables);

      await pool.close();
    }

  } catch (err) {
    console.error('\n✗ Connection Error:', err);
  } finally {
    sql.close();
  }
}

console.log('Starting database connection tests...');
testDatabaseConnections().then(() => {
  console.log('\nConnection tests completed.');
}); 