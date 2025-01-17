import { useState, useEffect } from 'react';
import { Box, IconButton, CssBaseline, Typography, FormControl, Select, MenuItem, CircularProgress } from '@mui/material';
import { Menu, Database as DatabaseIcon } from 'lucide-react';
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

  const handleQuerySubmit = async (params: QueryParams) => {
    clearResults();
    setLoading(true);
    
    try {
      console.log('Submitting query:', params);
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
    } catch (error) {
      console.error('Error executing query:', error);
      alert('Error executing query. Check console for details.');
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
    if (selectedTable) {
      const fetchIndexedColumns = async () => {
        const response = await fetch(`http://localhost:3001/api/indexed-columns/${selectedTable.name}`);
        const data = await response.json();
        setIndexedColumns(data);
        
        // Set table data with index information
        const tableIndexResponse = await fetch(`http://localhost:3001/api/table-index/${selectedTable.name}`);
        const tableIndexData = await tableIndexResponse.json();
        setTableData(tableIndexData);
      };
      fetchIndexedColumns();
    }
  }, [selectedTable]);

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
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
              displayEmpty
              sx={{
                color: '#f1f5f9',
                bgcolor: '#1e293b',
                fontSize: 14,
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#334155',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#475569',
                },
                '& .MuiSelect-icon': {
                  color: '#94a3b8',
                }
              }}
            >
              <MenuItem value="" disabled sx={{ fontSize: 14 }}>
                Choose a database
              </MenuItem>
              {databases.map((db) => (
                <MenuItem 
                  key={db.id} 
                  value={db.name}
                  sx={{
                    fontSize: 14,
                    color: '#f1f5f9'
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
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        flexGrow: 1,
        height: '100vh',
        marginLeft: 0,
        transition: 'margin-left 0.2s',
        mt: '48px',
        overflow: 'hidden'
      }}>
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
            isLoading={loading}
          />
        </Box>

        {/* Results Section */}
        <Box sx={{ 
          flex: 1,
          overflow: 'auto',
          py: 1,
          minWidth: 0
        }}>
          <ResultsGrid
            rows={results}
            columns={columns}
            loading={loading}
            indexedColumns={indexedColumns}
            tableData={tableData}
          />
        </Box>
      </Box>
    </Box>
  );
}

export default App;