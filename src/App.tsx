import { useState, useEffect } from 'react';
import { Box, IconButton, CssBaseline, Typography, FormControl, Select, MenuItem, CircularProgress, Tabs, Tab } from '@mui/material';
import { Menu, Database as DatabaseIcon, X as CloseIcon } from 'lucide-react';
import LeftPanel from './components/LeftPanel';
import QueryBuilder from './components/QueryBuilder';
import ResultsGrid from './components/ResultsGrid';
import { Database, Table, QueryParams } from './types/database';

function App() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedDatabase, setSelectedDatabase] = useState('');
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [databases, setDatabases] = useState<Database[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [columns, setColumns] = useState<any[]>([]);
  const [isLoadingTables, setIsLoadingTables] = useState(false);
  const [indexedColumns, setIndexedColumns] = useState<string[]>([]);
  const [tableData, setTableData] = useState<{ indexes: Array<{ indexName: string; columns: string[] }> }>({ indexes: [] });
  const [activeTableName, setActiveTableName] = useState<string>('');
  const [relatedResults, setRelatedResults] = useState<any[]>([]);
  const [relatedColumns, setRelatedColumns] = useState<any[]>([]);
  const [relatedIndexedColumns, setRelatedIndexedColumns] = useState<string[]>([]);
  const [relatedTableData, setRelatedTableData] = useState<{ indexes: Array<{ indexName: string; columns: string[] }> }>({ indexes: [] });
  const [activeTab, setActiveTab] = useState(0);
  const [relatedTableName, setRelatedTableName] = useState('');

  useEffect(() => {
    const fetchDatabases = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/databases');
        const data = await response.json();
        setDatabases(data);
      } catch (error) {
        console.error('Error fetching databases:', error);
      }
    };
    fetchDatabases();
  }, []);

  const handleDatabaseChange = async (database: string) => {
    setSelectedDatabase(database);
    setSelectedTable(null);
    setResults([]);
    setTables([]);
    setIsLoadingTables(true);
    
    try {
      const response = await fetch(`http://localhost:3001/api/tables/${database}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        setTables(data);
      } else {
        console.error('Received invalid table data:', data);
        setTables([]);
      }
    } catch (error) {
      console.error('Error fetching tables:', error);
      setTables([]);
    } finally {
      setIsLoadingTables(false);
    }
  };

  const clearResults = () => {
    setResults([]);
    setColumns([]);
  };

  const clearRelatedResults = () => {
    setRelatedResults([]);
    setRelatedColumns([]);
  };

  const handleQuerySubmit = async (params: QueryParams) => {
    clearResults();
    clearRelatedResults();
    setLoading(true);
    setActiveTableName('');
    
    try {
      console.log('Submitting query:', params);
      // Ensure we're only handling QueryBuilder queries
      if (params.rawQuery) {
        throw new Error('Raw SQL queries should be executed from SQL Command section');
      }

      const response = await fetch('http://localhost:3001/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          database: selectedDatabase,
          ...params,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.error) {
        console.error('Query error:', data.error);
        alert(data.error);
        return;
      }

      // Extract column information from the first row
      if (data.length > 0) {
        const gridColumns = Object.keys(data[0])
          .filter(key => key !== 'id')
          .map(key => ({
            field: key,
            headerName: key,
            flex: 1,
          }));
        setColumns(gridColumns);
      }

      setResults(data);
      // Set table name from QueryBuilder
      setActiveTableName(params.tableName ? params.tableName.toUpperCase() : '');
    } catch (error) {
      console.error('Error executing query:', error);
      alert('Error executing query. Check console for details.');
      setActiveTableName('');
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    if (!selectedDatabase) {
      return;
    }
    
    try {
      const response = await fetch(`http://localhost:3001/api/test-connection/${selectedDatabase}`);
      const data = await response.json();
      
      if (!data.success) {
        console.error('Connection Error:', data.error);
        alert(`Connection failed: ${data.error}`);
        return;
      }
      
      alert(data.message);
    } catch (error) {
      console.error('Connection Error:', error);
      alert('Connection test failed: Unable to reach server');
    }
  };

  const handleDatabaseClick = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/databases');
      const data = await response.json();
      setDatabases(data);
    } catch (error) {
      console.error('Error fetching databases:', error);
    }
  };

  useEffect(() => {
    if (activeTableName) {
      const fetchIndexedColumns = async () => {
        const response = await fetch(`http://localhost:3001/api/indexed-columns/${activeTableName}`);
        const data = await response.json();
        setIndexedColumns(data);
        
        // Set table data with index information
        const tableIndexResponse = await fetch(`http://localhost:3001/api/table-index/${activeTableName}`);
        const tableIndexData = await tableIndexResponse.json();
        setTableData(tableIndexData);
      };
      fetchIndexedColumns();
    }
  }, [activeTableName]);

  const handleSqlQuerySubmit = async (query: string) => {
    clearResults();
    clearRelatedResults();
    setLoading(true);
    setActiveTableName('');
    
    try {
      const response = await fetch('http://localhost:3001/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          database: selectedDatabase,
          rawQuery: query
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.error) {
        console.error('Query error:', data.error);
        alert(data.error);
        return;
      }

      // Extract column information from the first row
      if (data.length > 0) {
        const gridColumns = Object.keys(data[0])
          .filter(key => key !== 'id')
          .map(key => ({
            field: key,
            headerName: key,
            flex: 1,
          }));
        setColumns(gridColumns);
      }

      setResults(data);

      // Try to extract table name from SQL query
      const tableMatch = query.match(/FROM\s+\[?(\w+)\]?/i);
      setActiveTableName(tableMatch ? tableMatch[1].toUpperCase() : '');
    } catch (error) {
      console.error('Error executing SQL query:', error);
      alert('Error executing SQL query. Check console for details.');
      setActiveTableName('');
    } finally {
      setLoading(false);
    }
  };

  const handleRelatedTableClick = async (targetTable: string, columnValue: any, constraints: Array<{ field: string; relatedField: string }> = []) => {
    setLoading(true);
    setRelatedTableName(targetTable);
    
    try {
      // Fetch indexed columns and table data for the related table
      const [indexedColumnsResponse, tableIndexResponse] = await Promise.all([
        fetch(`http://localhost:3001/api/indexed-columns/${targetTable}`),
        fetch(`http://localhost:3001/api/table-index/${targetTable}`)
      ]);

      const [indexedColumnsData, tableIndexData] = await Promise.all([
        indexedColumnsResponse.json(),
        tableIndexResponse.json()
      ]);

      // Set the indexed columns and table data for the related table
      setRelatedIndexedColumns(indexedColumnsData);
      setRelatedTableData(tableIndexData);

      // Construct the WHERE clause using the relatedField from constraints
      const whereClauses = constraints.map(({ relatedField }) => {
        return `[${relatedField}] = '${columnValue}'`;
      }).join(' AND ');

      const query = `SELECT * FROM [${targetTable}] WHERE ${whereClauses}`;
      console.log('Executing SQL Query:', query);

      const response = await fetch('http://localhost:3001/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          database: selectedDatabase,
          rawQuery: query
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.error) {
        console.error('Query error:', data.error);
        alert(data.error);
        return;
      }

      // Extract column information from the first row
      if (data.length > 0) {
        const gridColumns = Object.keys(data[0])
          .filter(key => key !== 'id')
          .map(key => ({
            field: key,
            headerName: key,
            flex: 1,
          }));
        setRelatedColumns(gridColumns);
      }

      setRelatedResults(data);
      setActiveTab(1); // Switch to related results tab
    } catch (error) {
      console.error('Error executing related table query:', error);
      alert('Error executing related table query. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <CssBaseline />
      
      {/* Loading Overlay */}
      {isLoadingTables && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 2
          }}
        >
          <CircularProgress sx={{ color: 'white' }} />
          <Typography sx={{ color: 'white' }}>
            Loading tables...
          </Typography>
        </Box>
      )}

      {/* Header with Toggle */}
      <Box sx={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '48px',
        bgcolor: '#1e293b',
        borderBottom: '1px solid #334155',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 2,
        zIndex: 1200
      }}>
        {/* Left side */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton 
            onClick={() => setDrawerOpen(!drawerOpen)}
            sx={{ 
              mr: 2,
              color: '#94a3b8',
              '&:hover': {
                color: '#e2e8f0'
              }
            }}
          >
            <Menu size={20} />
          </IconButton>
          <DatabaseIcon size={20} className="text-blue-400" color='white' />
          <Typography 
            variant="subtitle1" 
            sx={{ 
              ml: 1, 
              fontWeight: 600, 
              fontSize: 14,
              color: '#ffffff'
            }}
          >
            SQL Explorer
          </Typography>
        </Box>

        {/* Right side - Database Selector */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '300px' }}>
          <FormControl size="small" fullWidth>
            <Select
              value={selectedDatabase}
              onChange={(e) => handleDatabaseChange(e.target.value)}
              onClick={handleDatabaseClick}
              size="small"
              displayEmpty
              sx={{
                fontSize: 13,
                color: '#f1f5f9',
                bgcolor: '#1e293b',
                '& .MuiSelect-select': {
                  color: '#f1f5f9'
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#334155'
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#475569'
                },
                '& .MuiSelect-icon': {
                  color: '#94a3b8'
                },
                '& .MuiMenuItem-root': {
                  fontSize: 13,
                  color: '#1f2937'
                }
              }}
            >
              <MenuItem value="" disabled sx={{ fontSize: 13, color: '#94a3b8' }}>
                Choose a database
              </MenuItem>
              {databases.map((db) => (
                <MenuItem 
                  key={db.id} 
                  value={db.name}
                  sx={{
                    fontSize: 13,
                    color: '#1f2937'
                  }}
                >
                  {db.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <IconButton
            onClick={testConnection}
            disabled={!selectedDatabase}
            sx={{ 
              color: '#94a3b8',
              '&:hover': {
                color: '#e2e8f0'
              }
            }}
          >
            <DatabaseIcon size={18} />
          </IconButton>
        </Box>
      </Box>

      {/* Left Panel */}
      <Box sx={{ 
        width: drawerOpen ? '15.525vw' : 0,
        flexShrink: 0,
        transition: 'width 0.2s',
        mt: '48px'
      }}>
        <LeftPanel
          open={drawerOpen}
        />
      </Box>

      {/* Main Content */}
      <Box sx={{ flexGrow: 1, p: 0, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        {/* Query Builder Section */}
        <Box sx={{ 
          borderBottom: '1px solid #e2e8f0',
          bgcolor: '#f8fafc',
          flex: '0 0 auto',
          minWidth: 0,
          overflow: 'auto'
        }}>
          <QueryBuilder
            tables={tables}
            selectedTable={selectedTable}
            onTableChange={setSelectedTable}
            onQuerySubmit={handleQuerySubmit}
            onSqlQuerySubmit={handleSqlQuerySubmit}
            isLoading={loading}
          />
        </Box>

        {/* Results Section */}
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange} 
            sx={{ 
              borderBottom: 1, 
              borderColor: '#e2e8f0',
              minHeight: 36,
              bgcolor: '#f8fafc',
              '& .MuiTabs-indicator': {
                backgroundColor: '#3b82f6',
                height: '4px'
              }
            }}
          >
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <span>{activeTableName || "Query Results"}</span>
                </Box>
              }
              sx={{ 
                fontSize: 12,
                minHeight: 36,
                textTransform: 'none',
                px: 3,
                py: 0,
                color: '#64748b',
                '&.Mui-selected': {
                  color: '#3b82f6',
                  fontWeight: 500
                },
                '&:hover': {
                  color: '#3b82f6',
                  opacity: 1
                }
              }} 
            />
            {relatedResults.length > 0 && (
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <span>{relatedTableName || "Related Results"}</span>
                    <IconButton 
                      size="small" 
                      onClick={(e) => {
                        e.stopPropagation();
                        clearRelatedResults();
                        setActiveTab(0);
                      }}
                      sx={{ 
                        p: 0.2,
                        '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' }
                      }}
                    >
                      <CloseIcon size={10} />
                    </IconButton>
                  </Box>
                }
                sx={{ 
                  fontSize: 12,
                  minHeight: 36,
                  textTransform: 'none',
                  px: 3,
                  py: 0,
                  color: '#64748b',
                  '&.Mui-selected': {
                    color: '#3b82f6',
                    fontWeight: 500
                  },
                  '&:hover': {
                    color: '#3b82f6',
                    opacity: 1
                  }
                }} 
              />
            )}
          </Tabs>

          <Box hidden={activeTab !== 0} sx={{ flexGrow: 1, overflow: 'auto', minHeight: 0 }}>
            <ResultsGrid
              rows={results}
              columns={columns}
              loading={loading}
              indexedColumns={indexedColumns}
              tableName={activeTableName}
              tableData={tableData}
              onRelatedTableClick={handleRelatedTableClick}
            />
          </Box>

          <Box hidden={activeTab !== 1} sx={{ flexGrow: 1, overflow: 'auto', minHeight: 0 }}>
            {relatedResults.length > 0 && (
              <ResultsGrid
                rows={relatedResults}
                columns={relatedColumns}
                loading={loading}
                indexedColumns={relatedIndexedColumns}
                tableName={relatedTableName}
                tableData={relatedTableData}
                onRelatedTableClick={handleRelatedTableClick}
              />
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default App;