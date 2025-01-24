class DatabaseCache {
  constructor() {
    this.cache = new Map();
  }

  // Set tables for a database
  setTables(databaseName, tables) {
    this.cache.set(databaseName, {
      tables,
      timestamp: Date.now()
    });
  }

  // Get tables for a database
  getTables(databaseName) {
    return this.cache.get(databaseName)?.tables;
  }

  // Check if database tables are cached
  hasTables(databaseName) {
    return this.cache.has(databaseName);
  }

  // Clear cache for a specific database
  clearDatabase(databaseName) {
    this.cache.delete(databaseName);
  }

  // Clear entire cache
  clearAll() {
    this.cache.clear();
  }
}

module.exports = new DatabaseCache(); 