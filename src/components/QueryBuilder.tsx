import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Select,
  MenuItem,
  FormControl,
  Button,
  IconButton,
  TextField,
  Paper,
  Autocomplete
} from '@mui/material';
import { Search, SortAsc, SortDesc, Database as DatabaseIcon, Plus as PlusIcon, Minus as MinusIcon, AlignCenter, X } from 'lucide-react';
import { Table, FilterType, QueryParams } from '../types/database';

interface QueryBuilderProps {
  tables: Table[];
  selectedTable: Table | null;
  onTableChange: (table: Table | null) => void;
  onQuerySubmit?: (params: QueryParams) => void;
  isLoading: boolean;
  onTableSelect?: (table: Table, params: QueryParams) => void;
}

export default function QueryBuilder({
  tables,
  selectedTable,
  onTableChange,
  onQuerySubmit,
  isLoading,
  onTableSelect
}: QueryBuilderProps) {
  const [filters, setFilters] = useState<FilterType[]>([{ column: '', value: '', condition: 'AND' }]);
  const [orderByColumn, setOrderByColumn] = useState('');
  const [orderDirection, setOrderDirection] = useState<'asc' | 'desc'>('desc');
  const [limit, setLimit] = useState<number>(50);
  const [tableFilterText, setTableFilterText] = useState('');
  const [filteredTables, setFilteredTables] = useState<Table[]>([]);

  useEffect(() => {
    if (selectedTable && selectedTable.columns.some(col => col.name.toLowerCase() === 'recid')) {
      setOrderByColumn('RECID');
      setOrderDirection('desc');
    } else {
      setOrderByColumn('');
      setOrderDirection('desc');
    }
  }, [selectedTable]);

  useEffect(() => {
    if (!tables || !Array.isArray(tables)) {
      setFilteredTables([]);
      return;
    }

    if (!tableFilterText) {
      setFilteredTables(tables.slice(0, 100)); // Show first 100 tables by default
      return;
    }

    const searchText = tableFilterText.toLowerCase();
    const filtered = tables
      .filter(table => table.name.toLowerCase().includes(searchText))
      .slice(0, 100); // Limit to 100 results for performance
    setFilteredTables(filtered);
  }, [tables, tableFilterText]);

  const handleAutoCompleteChange = async (event: any, newValue: Table | null) => {
    onTableChange(newValue);
    if (newValue && onTableSelect) {
      // Set order by values first
      if (newValue.columns.some(col => col.name.toLowerCase() === 'recid')) {
        // Set the state and wait for it to update
        setOrderByColumn('RECID');
        setOrderDirection('desc');
        // Use setTimeout to wait for state updates
        setTimeout(() => {
          onTableSelect(newValue, {
            tableName: newValue.name,
            filters: filters.filter(f => f.column && f.value),
            orderByColumn: 'RECID',
            orderDirection: 'desc',
            limit
          });
        }, 0);
      } else {
        setOrderByColumn('');
        setOrderDirection('desc');
        setTimeout(() => {
          onTableSelect(newValue, {
            tableName: newValue.name,
            filters: filters.filter(f => f.column && f.value),
            orderByColumn: '',
            orderDirection: 'desc',
            limit
          });
        }, 0);
      }
    }
  };

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

  const resetFilters = () => {
    setFilters([{ column: '', value: '', condition: 'AND' }]);
  };

  const handleSubmit = () => {
    if (!selectedTable) {
      alert('Please select a table first');
      return;
    }

    const validFilters = filters.filter(filter => filter.column && filter.value);

    if (onQuerySubmit) {
      onQuerySubmit({
        tableName: selectedTable.name,
        filters: validFilters,
        orderByColumn,
        orderDirection,
        limit
      });
    }
  };

  return (
    <Box sx={{ 
      p: 2,
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Table Selection */}
      <Box sx={{ flexShrink: 0 }}>
        <Paper 
          elevation={0} 
          sx={{ 
            p: 1.5,
            width: '100%',
            bgcolor: 'white',
            border: '1px solid #e2e8f0',
            mb: 2
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', height: 20, mb: 1 }}>
            <DatabaseIcon size={14} className="text-gray-600" />
            <Typography variant="body2" sx={{ ml: 1, fontSize: 12 }}>Table</Typography>
          </Box>
          <Autocomplete<Table, false>
            size="small"
            disableClearable={false}
            clearOnBlur={false}
            clearOnEscape
            clearIcon={<X size={14} />}
            options={filteredTables}
            getOptionLabel={(option: Table | null) => {
              if (!option) return '';
              return option.name || '';
            }}
            value={selectedTable}
            onChange={(event, newValue) => {
              handleAutoCompleteChange(event, newValue);
            }}
            onInputChange={(event, value) => {
              setTableFilterText(value);
            }}
            filterOptions={(x) => x} // Disable built-in filtering
            loading={isLoading}
            loadingText="Loading tables..."
            noOptionsText={tableFilterText ? "No tables found" : "Type to search tables"}
            isOptionEqualToValue={(option: Table, value: Table) => {
              if (!option || !value) return false;
              return option.name === value.name;
            }}
            ListboxProps={{
              style: {
                maxHeight: '300px'
              }
            }}
            renderOption={(props, option: Table) => {
              const { key, ...otherProps } = props;
              return (
                <MenuItem 
                  key={option.name} 
                  {...otherProps}
                  sx={{
                    fontSize: '11px',
                    py: 0.5,
                    px: 1,
                    '&:hover': {
                      backgroundColor: '#f1f5f9'
                    }
                  }}
                >
                  {option.name}
                </MenuItem>
              );
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Search tables..."
                InputProps={{
                  ...params.InputProps,
                  sx: {
                    '& .MuiOutlinedInput-input': {
                      padding: '4px 8px',
                      fontSize: '11px'
                    }
                  }
                }}
              />
            )}
            sx={{
              width: '100%',
              '& .MuiAutocomplete-listbox': {
                '& .MuiAutocomplete-option': {
                  minHeight: '32px',
                  padding: '4px 8px'
                }
              }
            }}
          />
        </Paper>
      </Box>

      {/* Scrollable Middle Section */}
      <Box sx={{ 
        flex: 1,
        minHeight: 100,
        maxHeight: 'calc(100vh - 250px)',
        overflowY: 'auto'
      }}>
        {/* Filters Section */}
        <Paper 
          elevation={0} 
          sx={{ 
            p: 1.5,
            width: '100%',
            bgcolor: 'white',
            border: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            mb: 2
          }}
        >
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            height: 20
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Search size={14} className="text-gray-600" />
              <Typography variant="body2" sx={{ ml: 1, fontSize: 12 }}>Filters</Typography>
            </Box>
            {filters.length > 1 || (filters.length === 1 && (filters[0].column || filters[0].value)) ? (
              <IconButton
                size="small"
                onClick={resetFilters}
                sx={{
                  p: 0.5,
                  color: '#64748b',
                  '&:hover': {
                    color: '#475569'
                  }
                }}
              >
                <X size={14} />
              </IconButton>
            ) : null}
          </Box>

          <Box sx={{ 
            display: 'flex',
            flexDirection: 'column',
            gap: 1
          }}>
            {filters.map((filter, index) => (
              <Box key={index} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                {/* AND/OR Select */}
                {index > 0 && (
                  <FormControl size="small" sx={{ width: 45, mt: 1.5, minWidth: 'unset' }}>
                    <Select
                      value={filter.condition}
                      onChange={(e) => updateFilterCondition(index, e.target.value as 'AND' | 'OR')}
                      sx={{ 
                        fontSize: '10px',
                        '& .MuiSelect-select': {
                          padding: '4px 6px',
                          paddingRight: '20px !important',
                          lineHeight: 1.2
                        },
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#e2e8f0'
                        },
                        '& .MuiSvgIcon-root': { // Dropdown icon
                          width: 16,
                          height: 16,
                          right: 2
                        }
                      }}
                    >
                      <MenuItem value="AND" sx={{ fontSize: '10px', py: 0.5, minHeight: 'unset', lineHeight: 1.2 }}>AND</MenuItem>
                      <MenuItem value="OR" sx={{ fontSize: '10px', py: 0.5, minHeight: 'unset', lineHeight: 1.2 }}>OR</MenuItem>
                    </Select>
                  </FormControl>
                )}

                {/* Column and Value Stack */}
                <Box sx={{ 
                  flex: 1, 
                  display: 'flex', 
                  flexDirection: 'column',
                  gap: 1,
                  position: 'relative'
                }}>
                  <Autocomplete
                    size="small"
                    options={selectedTable?.columns.map(col => col.name) || []}
                    value={filter.column}
                    onChange={(_, newValue) => updateFilterColumn(index, newValue || '')}
                    renderInput={(params) => (
                      <TextField 
                        {...params} 
                        placeholder="Column"
                        sx={{
                          '& .MuiInputBase-root': {
                            fontSize: '11px'
                          }
                        }}
                      />
                    )}
                    renderOption={(props, option) => (
                      <li {...props} style={{ fontSize: '11px', padding: '4px 8px' }}>
                        {option}
                      </li>
                    )}
                  />

                  <TextField
                    size="small"
                    fullWidth
                    placeholder="Value"
                    value={filter.value}
                    onChange={(e) => updateFilterValue(index, e.target.value)}
                    sx={{
                      '& .MuiInputBase-root': {
                        fontSize: '11px'
                      }
                    }}
                  />
                </Box>

                {/* Remove Filter Button */}
                {filters.length > 1 && (
                  <IconButton
                    size="small"
                    onClick={() => removeFilter(index)}
                    sx={{
                      p: 0.5,
                      mt: 1.5,
                      color: '#94a3b8',
                      '&:hover': {
                        color: '#64748b'
                      }
                    }}
                  >
                    <MinusIcon size={14} />
                  </IconButton>
                )}
              </Box>
            ))}
            
            <Button
              startIcon={<PlusIcon size={14} />}
              onClick={addFilter}
              sx={{
                mt: 1,
                fontSize: 12,
                textTransform: 'none',
                alignSelf: 'flex-start'
              }}
            >
              Add Filter
            </Button>
          </Box>
        </Paper>

        {/* Order By Section */}
        <Paper 
          elevation={0} 
          sx={{ 
            p: 1.5,
            width: '100%',
            bgcolor: 'white',
            border: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            gap: 1
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', height: 20 }}>
            {orderDirection === 'asc' ? (
              <SortAsc size={14} className="text-gray-600" />
            ) : (
              <SortDesc size={14} className="text-gray-600" />
            )}
            <Typography variant="body2" sx={{ ml: 1, fontSize: 12 }}>Order By</Typography>
          </Box>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Autocomplete
              size="small"
              options={selectedTable?.columns.map(col => col.name) || []}
              value={orderByColumn}
              onChange={(_, newValue) => setOrderByColumn(newValue || '')}
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  placeholder="Column"
                  sx={{
                    '& .MuiInputBase-root': {
                      fontSize: '11px'
                    }
                  }}
                />
              )}
              renderOption={(props, option) => (
                <li {...props} style={{ fontSize: '11px', padding: '4px 8px' }}>
                  {option}
                </li>
              )}
            />
            
            <FormControl size="small">
              <Select
                value={orderDirection}
                onChange={(e) => setOrderDirection(e.target.value as 'asc' | 'desc')}
                sx={{ fontSize: '11px' }}
              >
                <MenuItem value="asc" sx={{ fontSize: '11px' }}>Ascending</MenuItem>
                <MenuItem value="desc" sx={{ fontSize: '11px' }}>Descending</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Paper>

        {/* Limit Section */}
        <Paper 
          elevation={0} 
          sx={{ 
            p: 1.5,
            width: '100%',
            bgcolor: 'white',
            border: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            gap: 1
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', height: 20 }}>
            <Typography variant="body2" sx={{ ml: 1, fontSize: 12 }}>Limit Records</Typography>
          </Box>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <FormControl size="small">
              <Select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                sx={{ fontSize: '11px' }}
              >
                <MenuItem value={50} sx={{ fontSize: '11px' }}>50 records</MenuItem>
                <MenuItem value={100} sx={{ fontSize: '11px' }}>100 records</MenuItem>
                <MenuItem value={500} sx={{ fontSize: '11px' }}>500 records</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Paper>
      </Box>

      {/* Execute Query Button */}
      <Box sx={{ mt: 2, flexShrink: 0 }}>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isLoading || !selectedTable}
          fullWidth
          sx={{ 
            textTransform: 'none',
            fontSize: 13
          }}
        >
          Execute Query
        </Button>
      </Box>
    </Box>
  );
}