import { useState, useEffect } from 'react';
import {
  Paper,
  Box,
  Autocomplete,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Typography,
  Collapse,
  IconButton,
  Tooltip
} from '@mui/material';
import { Search, SortAsc, SortDesc, Database as DatabaseIcon, Code, ChevronDown, ChevronUp, Copy, X, PlusIcon, MinusIcon } from 'lucide-react';
import CodeMirror from '@uiw/react-codemirror';
import { sql } from '@codemirror/lang-sql';
import { Table, QueryParams, Filter as FilterType } from '../types/database';

interface QueryBuilderProps {
  tables: Table[];
  selectedTable: Table | null;
  onTableChange: (table: Table | null) => void;
  onQuerySubmit: (params: QueryParams) => void;
  onSqlQuerySubmit: (query: string) => void;
  isLoading: boolean;
}

export default function QueryBuilder({
  tables,
  selectedTable,
  onTableChange,
  onQuerySubmit,
  onSqlQuerySubmit,
  isLoading
}: QueryBuilderProps) {
  const [filters, setFilters] = useState<FilterType[]>([{ column: '', value: '', condition: 'AND' }]);
  const [orderByColumn, setOrderByColumn] = useState('');
  const [orderDirection, setOrderDirection] = useState<'asc' | 'desc'>('desc');
  const [sqlCommandOpen, setSqlCommandOpen] = useState(false);
  const [sqlCommand, setSqlCommand] = useState('');

  useEffect(() => {
    if (selectedTable && selectedTable.columns.some(col => col.name.toLowerCase() === 'recid')) {
      setOrderByColumn('RECID');
    } else {
      setOrderByColumn('');
    }
  }, [selectedTable]);

  const addFilter = () => {
    setFilters([...filters, { column: '', value: '', condition: 'AND' }]);
  };

  const removeFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  const updateFilterColumn = (index: number, value: string) => {
    const newFilters = [...filters];
    newFilters[index].column = value;
    setFilters(newFilters);
  };

  const updateFilterValue = (index: number, value: string) => {
    const newFilters = [...filters];
    newFilters[index].value = value;
    setFilters(newFilters);
  };

  const updateFilterCondition = (index: number, value: 'AND' | 'OR') => {
    const newFilters = [...filters];
    newFilters[index].condition = value;
    setFilters(newFilters);
  };

  const handleSubmit = () => {
    if (!selectedTable) {
      alert('Please select a table first');
      return;
    }

    // Filter out empty filters
    const validFilters = filters.filter(f => f.column && f.value);

    // Construct SQL query
    let query = `SELECT * FROM [${selectedTable.name}]`;
    if (validFilters.length > 0) {
      const whereClauses = validFilters.map(f => `[${f.column}] = '${f.value}'`);
      query += ` WHERE ${whereClauses.join(` ${validFilters[0].condition} `)}`;
    }
    if (orderByColumn) {
      query += ` ORDER BY [${orderByColumn}] ${orderDirection}`;
    }

    // Set the SQL command and expand the box
    setSqlCommand(query);
    setSqlCommandOpen(true);

    onQuerySubmit({
      tableName: selectedTable.name,
      filters: validFilters,
      orderByColumn,
      orderDirection,
    });
  };

  const handleCopySQL = () => {
    navigator.clipboard.writeText(sqlCommand);
  };

  const handleClearSQL = () => {
    setSqlCommand('');
  };

  const handleSqlExecute = () => {
    const query = sqlCommand.trim();
    if (!query) {
      alert('Please enter a SQL query');
      return;
    }

    // Basic SQL query validation
    if (!query.toLowerCase().startsWith('select')) {
      alert('Only SELECT queries are allowed');
      return;
    }

    // Ensure the query has a FROM clause
    if (!query.toLowerCase().includes('from')) {
      alert('Query must include a FROM clause');
      return;
    }

    // Extract table name and validate existence
    const fromMatch = query.match(/from\s+([^\s;]+)/i);
    if (fromMatch) {
      const tableName = fromMatch[1].replace(/[\[\]]/g, '');
      if (!tables.some(t => t.name.toLowerCase() === tableName.toLowerCase())) {
        alert(`Table "${tableName}" does not exist in the database`);
        return;
      }
    }

    onSqlQuerySubmit(query);
    setSqlCommand('');
    setSqlCommandOpen(false);
  };

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        borderRadius: 0,
        borderBottom: '1px solid #e2e8f0',
        bgcolor: '#f8fafc',
        maxHeight: '70vh',
        overflow: 'auto',
        mt: 1
      }}
    >
      <Box sx={{ p: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: 14, mb: 1 }}>
          Query Builder
        </Typography>

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', mb: 1 }}>
          {/* Table Selection */}
          <Paper 
            elevation={0} 
            sx={{ 
              p: 1,
              width: '25%',
              bgcolor: 'white',
              border: '1px solid #e2e8f0',
              display: 'flex',
              flexDirection: 'column',
              gap: 1
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', height: 20 }}>
              <DatabaseIcon size={14} className="text-gray-600" />
              <Typography variant="body2" sx={{ ml: 1, fontSize: 12 }}>Table</Typography>
            </Box>
            <Autocomplete
              size="small"
              options={Array.isArray(tables) ? tables : []}
              getOptionLabel={(option) => option.name}
              value={selectedTable}
              onChange={(_, newValue) => onTableChange(newValue)}
              renderOption={(props, option) => {
                const { key, style, ...otherProps } = props;
                return (
                  <li 
                    key={key}
                    {...otherProps}
                    style={{ 
                      ...style,
                      fontSize: '11px', 
                      padding: '2px 8px' 
                    }}
                  >
                    {option.name}
                  </li>
                );
              }}
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  label="Select Table" 
                  variant="outlined"
                  size="small"
                  InputProps={{
                    ...params.InputProps,
                    style: { fontSize: 11 }
                  }}
                  InputLabelProps={{
                    style: { fontSize: 12 }
                  }}
                  sx={{
                    '& .MuiInputBase-root': {
                      height: '28px',
                      '& input': {
                        padding: '6px 8px',
                        fontSize: 11,
                        height: '16px'
                      },
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#e2e8f0'
                      },
                      padding: '0'
                    },
                    '& .MuiInputLabel-root': { 
                      fontSize: 12,
                      transform: 'translate(14px, 6px) scale(1)'
                    },
                    '& .MuiInputLabel-shrink': {
                      transform: 'translate(14px, -9px) scale(0.75)'
                    },
                    '& .MuiAutocomplete-endAdornment': {
                      top: '50%',
                      transform: 'translateY(-50%)',
                      right: 2,
                      display: 'flex',
                      flexDirection: 'row',
                      '& .MuiButtonBase-root': {
                        padding: 0
                      },
                      '& .MuiAutocomplete-clearIndicator': {
                        order: 0
                      },
                      '& .MuiAutocomplete-popupIndicator': {
                        order: 1
                      }
                    }
                  }}
                />
              )}
              sx={{
                '& .MuiAutocomplete-option': {
                  fontSize: 11,
                  py: 0,
                  minHeight: 'unset',
                  lineHeight: '1.2'
                },
                '& .MuiAutocomplete-listbox': {
                  '& li': {
                    fontSize: 11,
                    minHeight: 'unset',
                    padding: '2px 8px'
                  }
                },
                '& .MuiAutocomplete-input': {
                  fontSize: 11,
                  padding: '6px 8px !important'
                },
                '& .MuiAutocomplete-clearIndicator': {
                  visibility: 'hidden'
                },
                '&:hover .MuiAutocomplete-clearIndicator': {
                  visibility: orderByColumn ? 'visible' : 'hidden'
                }
              }}
            />
          </Paper>

          {/* Filter Section */}
          <Paper 
            elevation={0} 
            sx={{ 
              p: 1,
              flex: 1,
              bgcolor: 'white',
              border: '1px solid #e2e8f0',
              display: 'flex',
              flexDirection: 'column',
              gap: 1
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', pb: 1 }}>
              <Typography variant="body2" sx={{ fontSize: 12, fontWeight: 500, color: '#475569' }}>Filters</Typography>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <Tooltip title="Add filter" arrow>
                  <IconButton size="small" onClick={addFilter} sx={{ p: 0.5, '&:hover': { bgcolor: '#f1f5f9' } }}>
                    <PlusIcon size={14} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Clear all filters" arrow>
                  <IconButton size="small" onClick={() => setFilters([{ column: '', value: '', condition: 'AND' }])} sx={{ p: 0.5, visibility: filters.some(f => f.column || f.value) ? 'visible' : 'hidden', '&:hover': { bgcolor: '#f1f5f9' } }}>
                    <X size={14} />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, maxHeight: '200px', overflowY: 'auto', pr: 0.5, '&::-webkit-scrollbar': { width: '4px' }, '&::-webkit-scrollbar-track': { background: '#f1f5f9', borderRadius: '2px' }, '&::-webkit-scrollbar-thumb': { background: '#cbd5e1', borderRadius: '2px' } }}>
              {filters.map((filter, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 1.5, alignItems: 'center', bgcolor: '#f8fafc', p: 1, borderRadius: 1, border: '1px solid #e2e8f0', transition: 'all 0.2s', '&:hover': { borderColor: '#cbd5e1' } }}>
                  <Autocomplete
                    size="small"
                    options={selectedTable?.columns.map(col => col.name) || []}
                    value={filter.column}
                    onChange={(_, newValue) => updateFilterColumn(index, newValue || '')}
                    renderOption={(props, option) => <li {...props} style={{ fontSize: '12px', padding: '4px 8px' }}>{option}</li>}
                    renderInput={(params) => <TextField {...params} label="Column" variant="outlined" size="small" sx={{ width: '200px', '& .MuiInputBase-root': { height: '32px', fontSize: 12, bgcolor: 'white' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' }, '& .MuiInputLabel-root': { fontSize: 12 } }} />}
                    sx={{ '& .MuiAutocomplete-input': { fontSize: 12, padding: '4px 8px !important' }, '& .MuiAutocomplete-listbox': { '& li': { fontSize: 12, padding: '4px 8px' } } }}
                  />
                  <TextField
                    size="small"
                    label="Value"
                    value={filter.value}
                    onChange={(e) => updateFilterValue(index, e.target.value)}
                    sx={{ flex: 1, '& .MuiInputBase-root': { height: '32px', fontSize: 12, bgcolor: 'white' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' }, '& .MuiInputLabel-root': { fontSize: 12 } }}
                  />
                  <FormControl size="small" sx={{ minWidth: 85 }}>
                    <Select
                      value={filter.condition}
                      onChange={(e) => updateFilterCondition(index, e.target.value as 'AND' | 'OR')}
                      sx={{ height: '32px', fontSize: 12, bgcolor: 'white', '& .MuiSelect-select': { p: '4px 8px', color: '#475569' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' } }}
                    >
                      <MenuItem value="AND" sx={{ fontSize: 12 }}>AND</MenuItem>
                      <MenuItem value="OR" sx={{ fontSize: 12 }}>OR</MenuItem>
                    </Select>
                  </FormControl>
                  {filters.length > 1 && (
                    <Tooltip title="Remove filter" arrow>
                      <IconButton size="small" onClick={() => removeFilter(index)} sx={{ p: 0.5, '&:hover': { bgcolor: '#fee2e2', color: '#ef4444' } }}>
                        <MinusIcon size={14} />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              ))}
            </Box>
          </Paper>

          {/* Sort Section */}
          <Paper 
            elevation={0} 
            sx={{ 
              p: 1,
              width: '30%',
              bgcolor: 'white',
              border: '1px solid #e2e8f0',
              display: 'flex',
              flexDirection: 'column',
              gap: 1
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', height: 20 }}>
              {orderDirection === 'asc' ? (
                <SortAsc size={14} className="text-gray-600" style={{ marginTop: -2 }} />
              ) : (
                <SortDesc size={14} className="text-gray-600" style={{ marginTop: -2 }} />
              )}
              <Typography variant="body2" sx={{ ml: 1, fontSize: 12 }}>Sort</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <FormControl size="small" sx={{ flex: 2 }}>
                <InputLabel sx={{ fontSize: 12 }}>Order By</InputLabel>
                <Select
                  value={orderByColumn}
                  label="Order By"
                  onChange={(e) => setOrderByColumn(e.target.value)}
                  sx={{
                    fontSize: 11,
                    '& .MuiSelect-select': {
                      fontSize: 11,
                      padding: '6px 8px'
                    },
                    '& .MuiMenuItem-root': {
                      fontSize: 11,
                      minHeight: 'unset',
                      padding: '2px 8px',
                      lineHeight: '1.2'
                    }
                  }}
                >
                  {selectedTable?.columns.map((column) => (
                    <MenuItem 
                      key={column.name} 
                      value={column.name}
                      sx={{
                        fontSize: 11,
                        minHeight: 'unset',
                        padding: '2px 8px',
                        lineHeight: '1.2'
                      }}
                    >
                      {column.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ flex: 1 }}>
                <InputLabel sx={{ fontSize: 12 }}>Direction</InputLabel>
                <Select
                  value={orderDirection}
                  label="Direction"
                  onChange={(e) => setOrderDirection(e.target.value as 'asc' | 'desc')}
                  sx={{
                    fontSize: 11,
                    '& .MuiSelect-select': {
                      fontSize: 11,
                      padding: '6px 8px'
                    },
                    '& .MuiMenuItem-root': {
                      fontSize: 11,
                      minHeight: 'unset',
                      padding: '2px 8px',
                      lineHeight: '1.2'
                    }
                  }}
                >
                  <MenuItem 
                    value="asc"
                    sx={{
                      fontSize: 11,
                      minHeight: 'unset',
                      padding: '2px 8px',
                      lineHeight: '1.2'
                    }}
                  >
                    ASC
                  </MenuItem>
                  <MenuItem 
                    value="desc"
                    sx={{
                      fontSize: 11,
                      minHeight: 'unset',
                      padding: '2px 8px',
                      lineHeight: '1.2'
                    }}
                  >
                    DESC
                  </MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Paper>

          {/* Execute Button */}
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={isLoading}
            startIcon={<Search size={14} />}
            size="small"
            sx={{
              bgcolor: '#3b82f6',
              '&:hover': {
                bgcolor: '#2563eb',
              },
              '&:disabled': {
                bgcolor: '#94a3b8',
                color: 'white'
              },
              height: '40px',  // More reasonable height
              alignSelf: 'flex-end',  // Align with the bottom of other components
              mt: 'auto',  // Push to bottom of container
              mb: 1,  // Add some bottom margin
              //px: 2,  // Add horizontal padding
              fontSize: 12,
              textTransform: 'none'  // Prevent all-caps
            }}
          >
            {isLoading ? 'Executing...' : 'Execute'}
          </Button>
        </Box>

        {/* SQL Command Section */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 32 }}>
          <Button
            size="small"
            startIcon={<Code size={14} style={{ marginTop: -2 }} />}
            endIcon={sqlCommandOpen ? <ChevronUp size={14} style={{ marginTop: -2 }} /> : <ChevronDown size={14} style={{ marginTop: -2 }} />}
            onClick={() => setSqlCommandOpen(!sqlCommandOpen)}
            sx={{ 
              fontSize: 12,
              height: 24,
              padding: '4px 8px'
            }}
          >
            SQL Command
          </Button>
        </Box>

        <Collapse in={sqlCommandOpen}>
          <Paper 
            elevation={0}
            sx={{ 
              p: 1,
              bgcolor: 'white',
              border: '1px solid #e2e8f0',
            }}
          >
            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <Tooltip title="Execute SQL" arrow>
                <IconButton 
                  size="small" 
                  onClick={handleSqlExecute}
                  disabled={isLoading}
                  sx={{ p: 0.5 }}
                >
                  <Search size={14} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Copy" arrow>
                <IconButton 
                  size="small" 
                  onClick={handleCopySQL}
                  sx={{ p: 0.5 }}
                >
                  <Copy size={14} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Clear" arrow>
                <IconButton 
                  size="small" 
                  onClick={handleClearSQL}
                  sx={{ p: 0.5 }}
                >
                  <X size={14} />
                </IconButton>
              </Tooltip>
            </Box>
            <CodeMirror
              value={sqlCommand}
              height="100px"
              extensions={[sql()]}
              onChange={(value) => setSqlCommand(value)}
              theme="dark"
              basicSetup={{
                lineNumbers: false,
                foldGutter: false,
                dropCursor: false,
                allowMultipleSelections: false,
                indentOnInput: false,
              }}
              style={{
                fontSize: 13,
                fontFamily: 'monospace'
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  handleSqlExecute();
                }
              }}
            />
          </Paper>
        </Collapse>
      </Box>
    </Paper>
  );
}