class DatabaseCache {
  constructor() {
    this.tablesCache = new Map();
    this.indexCache = new Map();
    this.relationCache = new Map();
  }

  // Tables cache methods
  setTables(databaseName, tables) {
    this.tablesCache.set(databaseName, {
      tables,
      timestamp: Date.now()
    });
  }

  getTables(databaseName) {
    return this.tablesCache.get(databaseName)?.tables;
  }

  hasTables(databaseName) {
    return this.tablesCache.has(databaseName);
  }

  // Index cache methods
  setTableIndex(tableName, indexData) {
    this.indexCache.set(tableName.toLowerCase(), {
      data: indexData,
      timestamp: Date.now()
    });
  }

  getTableIndex(tableName) {
    return this.indexCache.get(tableName.toLowerCase())?.data;
  }

  hasTableIndex(tableName) {
    return this.indexCache.has(tableName.toLowerCase());
  }

  // Relation cache methods
  setTableRelation(tableName, relationData) {
    this.relationCache.set(tableName.toLowerCase(), {
      data: relationData,
      timestamp: Date.now()
    });
  }

  getTableRelation(tableName) {
    return this.relationCache.get(tableName.toLowerCase())?.data;
  }

  hasTableRelation(tableName) {
    return this.relationCache.has(tableName.toLowerCase());
  }

  // Clear methods
  clearDatabase(databaseName) {
    this.tablesCache.delete(databaseName);
  }

  clearTableData(tableName) {
    const normalizedName = tableName.toLowerCase();
    this.indexCache.delete(normalizedName);
    this.relationCache.delete(normalizedName);
  }

  clearAll() {
    this.tablesCache.clear();
    this.indexCache.clear();
    this.relationCache.clear();
  }
}

module.exports = new DatabaseCache(); 