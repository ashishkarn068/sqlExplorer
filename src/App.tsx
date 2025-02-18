import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  IconButton, 
  Tabs, 
  Tab,
  Button,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CssBaseline, 
  FormControl, 
  Select, 
  MenuItem, 
  CircularProgress
} from '@mui/material';
import { Menu, Database as DatabaseIcon, X as CloseIcon, Code, ChevronDown, Copy, X } from 'lucide-react';
import CodeMirror from '@uiw/react-codemirror';
import { sql } from '@codemirror/lang-sql';
import LeftPanel from './components/LeftPanel';
import ResultsGrid from './components/ResultsGrid';
import { Database, Table, QueryParams, Relation } from './types/database';

interface RelatedTab {
  id: string;
  tableName: string;
  relationName: string;
  results: any[];
  columns: any[];
  indexedColumns: string[];
  tableData: any;
}

function App() {
  const [drawerOpen, setDrawerOpen] = useState(true);
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
  const [relatedTabs, setRelatedTabs] = useState<RelatedTab[]>([]);
  const [activeTab, setActiveTab] = useState<string>('main');
  const [sqlCommandOpen, setSqlCommandOpen] = useState(false);
  const [sqlCommand, setSqlCommand] = useState('');

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

  const handleTableSelect = async (table: Table, params: QueryParams) => {
    setSelectedTable(table);
    setLoading(true);
    setRelatedTabs([]);
    setActiveTab('main');

    try {
      // Construct the query
      let query = `SELECT TOP ${params.limit} * FROM [${params.tableName}]`;

      // Add WHERE clause if there are filters
      if (params.filters && params.filters.length > 0) {
        const validFilters = params.filters.filter(f => f.column && f.value);
        if (validFilters.length > 0) {
          query += ' WHERE ' + validFilters.map(f => `[${f.column}] LIKE '%${f.value}%'`).join(' AND ');
        }
      }

      // Add ORDER BY clause if specified
      if (params.orderByColumn) {
        query += ` ORDER BY [${params.orderByColumn}] ${params.orderDirection}`;
      }

      const currentTime = new Date().toLocaleTimeString();
      setSqlCommand(prev => `${prev}\n-- [${currentTime}] Selected table:\n${query}`);

      const response = await fetch('http://localhost:3001/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          database: selectedDatabase,
          rawQuery: query
        }),
      });

      const data = await response.json();
      
      if (data.error) {
        console.error('Query error:', data.error);
        setSqlCommand(prev => `${prev}\n-- Error: ${data.error}`);
        return;
      }

      if (data && data.length > 0) {
        const gridColumns = Object.keys(data[0])
          .filter(key => key !== 'id')
          .map(key => ({
            field: key,
            headerName: key,
            flex: 1,
          }));
        setColumns(gridColumns);
      }

      setResults(data || []);
      setActiveTableName(params.tableName);

    } catch (error) {
      console.error('API error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setSqlCommand(prev => `${prev}\n-- Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleQuerySubmit = async (params: QueryParams) => {
    setLoading(true);
    setRelatedTabs([]);
    setActiveTab('main');

    try {
      // Construct the query
      let query = `SELECT TOP ${params.limit} * FROM [${params.tableName}]`;

      if (params.filters && params.filters.length > 0) {
        const whereClause = params.filters.map((filter, index) => {
          const condition = index === 0 ? 'WHERE' : filter.condition;
          return `${condition} [${filter.column}] = '${filter.value}'`;
        }).join(' ');
        query += ` ${whereClause}`;
      }

      if (params.orderByColumn) {
        query += ` ORDER BY [${params.orderByColumn}] ${params.orderDirection}`;
      }

      const currentTime = new Date().toLocaleTimeString();
      setSqlCommand(prev => `${prev}\n-- [${currentTime}] Generated Query:\n${query}`);

      const response = await fetch('http://localhost:3001/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          database: selectedDatabase,
          rawQuery: query
        }),
      });

      const data = await response.json();
      
      if (data.error) {
        console.error('Query error:', data.error);
        setSqlCommand(prev => `${prev}\n-- Error: ${data.error}`);
        return;
      }

      if (data && data.length > 0) {
        const gridColumns = Object.keys(data[0])
          .filter(key => key !== 'id')
          .map(key => ({
            field: key,
            headerName: key,
            flex: 1,
          }));
        setColumns(gridColumns);
      }

      setResults(data || []);
      
      const tableMatch = query.match(/FROM\s+\[?(\w+)\]?/i);
      setActiveTableName(tableMatch ? tableMatch[1] : '');

    } catch (error) {
      console.error('API error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setSqlCommand(prev => `${prev}\n-- Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };


  const handleSqlCommandToggle = () => {
    setSqlCommandOpen(!sqlCommandOpen);
  };

  const handleCloseRelatedTab = (tabId: string) => {
    setRelatedTabs(prev => prev.filter(tab => tab.id !== tabId));
    setActiveTab('main');
  };

  const handleSqlExecute = async () => {
    if (!sqlCommand.trim()) return;

    setLoading(true);
    setRelatedTabs([]);
    setActiveTab('main');

    try {
      const response = await fetch('http://localhost:3001/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: sqlCommand,
          database: selectedDatabase,
          rawQuery: sqlCommand
        }),
      });

      const data = await response.json();
      
      if (data.error) {
        console.error('Query error:', data.error);
        setSqlCommand(prev => `${prev}\n-- Error: ${data.error}`);
        return;
      }

      if (data && data.length > 0) {
        const gridColumns = Object.keys(data[0])
          .filter(key => key !== 'id')
          .map(key => ({
            field: key,
            headerName: key,
            flex: 1,
          }));
        setColumns(gridColumns);
      }

      setResults(data || []);
      
      const tableMatch = sqlCommand.match(/FROM\s+\[?(\w+)\]?/i);
      setActiveTableName(tableMatch ? tableMatch[1] : '');

      const timestamp = new Date().toLocaleTimeString();
      setSqlCommand(prev => `${prev}\n-- [${timestamp}] Executed:\n${sqlCommand}`);

    } catch (error) {
      console.error('API error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setSqlCommand(prev => `${prev}\n-- Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopySQL = () => {
    navigator.clipboard.writeText(sqlCommand);
  };

  const handleClearSQL = () => {
    setSqlCommand('');
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue);
  };

  const handleRelatedTableClick = async (targetTable: string, columnValue: any, constraints: Array<{ field: string, relatedField: string }>, clickedField: string, relations: Relation[]) => {
    setLoading(true);
    try {
      // Find all relations where the clicked field is used as a constraint
      const relevantRelations = relations.filter(relation => 
        relation.constraints.some(constraint => 
          constraint.field.toLowerCase() === clickedField.toLowerCase()
        )
      );

      console.log('Found relevant relations:', relevantRelations);

      // Create a tab for each related table
      for (const relation of relevantRelations) {
        const matchingConstraint = relation.constraints.find(c => 
          c.field.toLowerCase() === clickedField.toLowerCase()
        );

        if (!matchingConstraint) continue;

        const query = `SELECT * FROM [${relation.relatedTable}] WHERE [${matchingConstraint.relatedField}] = ${
          typeof columnValue === 'string' ? `'${columnValue}'` : columnValue
        }`;

        console.log(`Executing query for ${relation.relatedTable}:`, query);

        const [queryResponse, indexedColumnsResponse, tableIndexResponse] = await Promise.all([
          fetch('http://localhost:3001/api/query', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              query,
              database: selectedDatabase,
              rawQuery: query
            }),
          }),
          fetch(`http://localhost:3001/api/indexed-columns/${relation.relatedTable}`),
          fetch(`http://localhost:3001/api/table-index/${relation.relatedTable}`)
        ]);

        if (!queryResponse.ok) {
          throw new Error(`HTTP error! status: ${queryResponse.status}`);
        }

        const [data, indexedColumnsData, tableIndexData] = await Promise.all([
          queryResponse.json(),
          indexedColumnsResponse.json(),
          tableIndexResponse.json()
        ]);

        if (data.error) {
          console.error(`Query error for ${relation.relatedTable}:`, data.error);
          setSqlCommand(prev => `${prev}\n-- Error for ${relation.relatedTable}: ${data.error}`);
          continue;
        }

        let gridColumns: any[] = [];
        if (data && data.length > 0) {
          gridColumns = Object.keys(data[0])
            .filter(key => key !== 'id')
            .map(key => ({
              field: key,
              headerName: key,
              flex: 1,
            }));
        }

        const newTabId = `${relation.relatedTable}-${Date.now()}`;
        const newTab: RelatedTab = {
          id: newTabId,
          tableName: relation.relatedTable,
          relationName: `${relation.name} (${matchingConstraint.field})`,
          results: data || [],
          columns: gridColumns,
          indexedColumns: indexedColumnsData,
          tableData: tableIndexData
        };

        setRelatedTabs(prev => [...prev, newTab]);
        // Only set active tab to the first relation
        if (relation === relevantRelations[0]) {
          setActiveTab(newTabId);
        }

        const timestamp = new Date().toLocaleTimeString();
        setSqlCommand(prev => `${prev}\n-- [${timestamp}] Related Query for ${relation.relatedTable}:\n${query}`);
      }

    } catch (err) {
      console.error('API error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setSqlCommand(prev => `${prev}\n-- Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTableName) {
      const fetchIndexedColumns = async () => {
        const response = await fetch(`http://localhost:3001/api/indexed-columns/${activeTableName}`);
        const data = await response.json();
        setIndexedColumns(data);
        
        const tableIndexResponse = await fetch(`http://localhost:3001/api/table-index/${activeTableName}`);
        const tableIndexData = await tableIndexResponse.json();
        setTableData(tableIndexData);
      };
      fetchIndexedColumns();
    }
  }, [activeTableName]);


  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      
      {/* Top Bar */}
      <Box sx={{ 
        width: '100%', 
        height: '48px',
        bgcolor: '#1e293b',
        borderBottom: '1px solid #334155',
        display: 'flex',
        alignItems: 'center',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 1201,
        px: 2
      }}>
        <IconButton 
          onClick={() => setDrawerOpen(!drawerOpen)}
          sx={{ color: 'white', p: 1 }}
        >
          {drawerOpen ? <CloseIcon size={16} /> : <Menu size={16} />}
        </IconButton>
        
        <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
          <DatabaseIcon size={14} className="text-gray-400" />
          <FormControl 
            size="small" 
            sx={{ 
              ml: 1,
              minWidth: 200,
              '& .MuiOutlinedInput-root': {
                color: 'white',
                fontSize: 12,
                '& fieldset': {
                  borderColor: '#475569',
                },
                '&:hover fieldset': {
                  borderColor: '#64748b',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#64748b',
                },
              },
            }}
          >
            <Select
              value={selectedDatabase}
              onChange={(e) => handleDatabaseChange(e.target.value)}
              displayEmpty
              sx={{
                height: '32px',
                bgcolor: '#334155',
                '& .MuiSelect-select': {
                  py: 1,
                },
              }}
            >
              <MenuItem value="" sx={{ fontSize: 12 }}>
                <em>Select Database</em>
              </MenuItem>
              {databases.map((db) => (
                <MenuItem key={db.id} value={db.name} sx={{ fontSize: 12 }}>
                  {db.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {isLoadingTables && (
            <CircularProgress size={16} sx={{ ml: 2, color: '#64748b' }} />
          )}
        </Box>
      </Box>

      <Box sx={{ display: 'flex', mt: '48px', height: 'calc(100vh - 48px)', width: '100vw', overflow: 'hidden' }}>
        {/* Left Panel with Query Builder */}
        <LeftPanel 
          open={drawerOpen}
          tables={tables}
          selectedTable={selectedTable}
          onTableChange={setSelectedTable}
          onQuerySubmit={handleQuerySubmit}
          isLoading={loading}
          onTableSelect={handleTableSelect}
        />

        {/* Main Content */}
        <Box component="main" sx={{ 
          flexGrow: 1, 
          height: '100vh', 
          display: 'flex', 
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* SQL Command Box */}
          <Accordion 
            expanded={sqlCommandOpen} 
            onChange={handleSqlCommandToggle}
            sx={{
              boxShadow: 'none',
              '&:before': {
                display: 'none',
              },
            }}
          >
            <AccordionSummary
              expandIcon={<ChevronDown size={16} />}
              sx={{
                minHeight: '40px !important',
                bgcolor: '#f8fafc',
                borderTop: '1px solid #e2e8f0',
                borderBottom: '1px solid #e2e8f0',
                '& .MuiAccordionSummary-content': {
                  margin: '8px 0 !important',
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Code size={14} />
                <Typography sx={{ fontSize: '12px', fontWeight: 600 }}>SQL Command</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0 }}>
              <Box sx={{pr:1, bgcolor: '#f8fafc' }}>
                <CodeMirror
                  value={sqlCommand}
                  height="180px"
                  extensions={[sql()]}
                  onChange={(value) => setSqlCommand(value)}
                  theme="dark"
                  basicSetup={{
                    lineNumbers: false,
                    foldGutter: false,
                    dropCursor: false,
                    allowMultipleSelections: false,
                    indentOnInput: false,
                    highlightActiveLineGutter: false,
                    highlightActiveLine: false,
                  }}
                  style={{
                    fontSize: 13,
                    fontFamily: 'monospace',
                    backgroundColor: '#0f172a',
                    borderRadius: '4px',
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                      e.preventDefault();
                      handleSqlExecute();
                    }
                  }}
                />
                
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 1 }}>
                  <Tooltip 
                    title={<div style={{ padding: '8px' }}>Copy SQL</div>}
                    enterDelay={500}
                    arrow
                    componentsProps={{
                      tooltip: {
                        sx: {
                          bgcolor: '#fff',
                          color: '#333',
                          border: '1px solid #e0e0e0',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                          borderRadius: '6px',
                          maxWidth: '400px',
                          p: 0,
                          '& .MuiTooltip-arrow': {
                            color: '#fff',
                            '&:before': {
                              border: '1px solid #e0e0e0'
                            }
                          }
                        }
                      }
                    }}
                  >
                    <IconButton
                      size="small"
                      onClick={handleCopySQL}
                      sx={{ 
                        p: 0.5,
                        color: '#94a3b8',
                        '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                      }}
                    >
                      <Copy size={14} />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip 
                    title={<div style={{ padding: '8px' }}>Clear SQL</div>}
                    enterDelay={500}
                    arrow
                    componentsProps={{
                      tooltip: {
                        sx: {
                          bgcolor: '#fff',
                          color: '#333',
                          border: '1px solid #e0e0e0',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                          borderRadius: '6px',
                          maxWidth: '400px',
                          p: 0,
                          '& .MuiTooltip-arrow': {
                            color: '#fff',
                            '&:before': {
                              border: '1px solid #e0e0e0'
                            }
                          }
                        }
                      }
                    }}
                  >
                    <IconButton
                      size="small"
                      onClick={handleClearSQL}
                      sx={{ 
                        p: 0.5,
                        color: '#94a3b8',
                        '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                      }}
                    >
                      <X size={13} />
                    </IconButton>
                  </Tooltip>
                  
                  <Button
                    variant="contained"
                    onClick={handleSqlExecute}
                    disabled={!sqlCommand.trim()}
                    sx={{ 
                      fontSize: '11px',
                      textTransform: 'none',
                      py: 0.5,
                      px: 2,
                      minWidth: 0,
                      bgcolor: '#3b82f6',
                      '&:hover': {
                        bgcolor: '#2563eb',
                      },
                      '&:disabled': {
                        bgcolor: '#1e293b',
                        color: '#64748b'
                      }
                    }}
                  >
                    Execute
                  </Button>
                </Box>
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* Results Content - Always Visible */}
          <Box sx={{ 
            flex: 1,
            minHeight: 0,
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column',
            p: 0
          }}>
            {/* Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: '#334155' }}>
              <Tabs 
                value={activeTab} 
                onChange={handleTabChange}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                  minHeight: 36,
                  '& .MuiTab-root': {
                    minHeight: 36,
                    textTransform: 'none',
                    fontSize: 13,
                    fontWeight: 'normal',
                    padding: '6px 12px',
                    minWidth: 'auto'
                  },
                  '& .MuiTab-root.Mui-selected': {
                    color: '#1976d2'
                  }
                }}
              >
                <Tab
                  value="main"
                  label={
                    <Typography 
                      sx={{ 
                        fontSize: 13,
                        fontWeight: 600
                      }}
                    >
                      {activeTableName || 'Results'}
                    </Typography>
                  }
                />
                {relatedTabs
                  .sort((a, b) => (b.results?.length || 0) - (a.results?.length || 0))
                  .map(tab => (
                    <Tab
                      key={tab.id}
                      value={tab.id}
                      sx={{
                        bgcolor: tab.results?.length ? 'rgba(76, 175, 80, 0.08)' : 'transparent',
                        borderRadius: 1,
                        mr: 0.5,
                        '&.Mui-selected': {
                          bgcolor: tab.results?.length ? 'rgba(76, 175, 80, 0.16)' : undefined,
                        },
                        '&:hover': {
                          bgcolor: tab.results?.length ? 'rgba(76, 175, 80, 0.16)' : 'rgba(0, 0, 0, 0.04)',
                        }
                      }}
                      label={
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 1,
                          maxWidth: '160px'
                        }}>
                          <Tooltip 
                            title={<div style={{ padding: '8px' }}>{tab.relationName}</div>}
                            enterDelay={500}
                            arrow
                            componentsProps={{
                              tooltip: {
                                sx: {
                                  bgcolor: '#fff',
                                  color: '#333',
                                  border: '1px solid #e0e0e0',
                                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                  borderRadius: '6px',
                                  maxWidth: '400px',
                                  p: 0,
                                  '& .MuiTooltip-arrow': {
                                    color: '#fff',
                                    '&:before': {
                                      border: '1px solid #e0e0e0'
                                    }
                                  }
                                }
                              }
                            }}
                          >
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                fontSize: 13,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                color: tab.results?.length ? '#2e7d32' : 'inherit'
                              }}
                            >
                              {tab.relationName}
                            </Typography>
                          </Tooltip>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCloseRelatedTab(tab.id);
                            }}
                            sx={{
                              p: 0.25,
                              ml: 'auto',
                              '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                            }}
                          >
                            <X size={14} />
                          </IconButton>
                        </Box>
                      }
                    />
                  ))}
              </Tabs>
            </Box>

            {/* Results Grid */}
            {activeTab === 'main' ? (
              <ResultsGrid 
                rows={results} 
                columns={columns}
                loading={loading}
                indexedColumns={indexedColumns}
                tableName={activeTableName}
                tableData={tableData}
                onRelatedTableClick={handleRelatedTableClick}
              />
            ) : (
              <ResultsGrid 
                rows={relatedTabs.find(tab => tab.id === activeTab)?.results || []}
                columns={relatedTabs.find(tab => tab.id === activeTab)?.columns || []}
                loading={loading}
                indexedColumns={relatedTabs.find(tab => tab.id === activeTab)?.indexedColumns || []}
                tableName={relatedTabs.find(tab => tab.id === activeTab)?.tableName}
                tableData={relatedTabs.find(tab => tab.id === activeTab)?.tableData}
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