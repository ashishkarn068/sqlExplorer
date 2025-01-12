import { useState, KeyboardEvent } from 'react';
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
import { Search, SortAsc, SortDesc, Filter, Database as DatabaseIcon, Code, ChevronDown, ChevronUp, Copy, X } from 'lucide-react';
import CodeMirror from '@uiw/react-codemirror';
import { sql } from '@codemirror/lang-sql';
import { Table, QueryParams } from '../types/database';

interface QueryBuilderProps {
  tables: Table[];
  selectedTable: Table | null;
  onTableChange: (table: Table | null) => void;
  onQuerySubmit: (params: QueryParams) => void;
}

export default function QueryBuilder({
  tables,
  selectedTable,
  onTableChange,
  onQuerySubmit,
}: QueryBuilderProps) {
  const [whereColumn, setWhereColumn] = useState('');
  const [whereValue, setWhereValue] = useState('');
  const [orderByColumn, setOrderByColumn] = useState('');
  const [orderDirection, setOrderDirection] = useState<'asc' | 'desc'>('asc');
  const [sqlCommandOpen, setSqlCommandOpen] = useState(false);
  const [sqlCommand, setSqlCommand] = useState('');

  const handleSubmit = () => {
    if (sqlCommand.trim()) {
      onQuerySubmit({
        rawQuery: sqlCommand
      });
      return;
    }

    if (!selectedTable) {
      alert('Please select a table first');
      return;
    }

    onQuerySubmit({
      tableName: selectedTable.name,
      whereColumn,
      whereValue,
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

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      handleSubmit();
    }
  };

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        borderRadius: 0,
        borderBottom: '1px solid #e2e8f0',
        bgcolor: '#f8fafc',
        maxHeight: '70vh',
        overflow: 'auto'
      }}
    >
      <Box sx={{ p: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: 14, mb: 1 }}>
          Query Builder
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', mb: 2 }}>
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
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <DatabaseIcon size={12} className="text-gray-600" />
              <Typography variant="body2" sx={{ ml: 1, fontSize: 12 }}>Table</Typography>
            </Box>
            <Autocomplete
              size="small"
              options={Array.isArray(tables) ? tables : []}
              getOptionLabel={(option) => option.name}
              value={selectedTable}
              onChange={(_, newValue) => onTableChange(newValue)}
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  label="Select Table" 
                  variant="outlined"
                  size="small"
                  InputProps={{
                    ...params.InputProps,
                    style: { fontSize: 13 }
                  }}
                  InputLabelProps={{
                    style: { fontSize: 13 }
                  }}
                />
              )}
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
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Filter size={12} className="text-gray-600" />
              <Typography variant="body2" sx={{ ml: 1, fontSize: 12 }}>Filter</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl size="small" sx={{ width: '40%' }}>
                <InputLabel sx={{ fontSize: 13 }}>Column</InputLabel>
                <Select
                  value={whereColumn}
                  label="Column"
                  onChange={(e) => setWhereColumn(e.target.value)}
                  sx={{
                    fontSize: 13,
                    '& .MuiMenuItem-root': {
                      fontSize: 13
                    }
                  }}
                >
                  {selectedTable?.columns.map((column) => (
                    <MenuItem key={column.name} value={column.name}>
                      {column.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                size="small"
                label="Value"
                value={whereValue}
                onChange={(e) => setWhereValue(e.target.value)}
                sx={{ 
                  flex: 1,
                  '& .MuiInputBase-input': { fontSize: 13 },
                  '& .MuiInputLabel-root': { fontSize: 13 }
                }}
              />
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
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              {orderDirection === 'asc' ? (
                <SortAsc size={12} className="text-gray-600" />
              ) : (
                <SortDesc size={12} className="text-gray-600" />
              )}
              <Typography variant="body2" sx={{ ml: 1, fontSize: 12 }}>Sort</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <FormControl size="small" sx={{ flex: 2 }}>
                <InputLabel sx={{ fontSize: 13 }}>Order By</InputLabel>
                <Select
                  value={orderByColumn}
                  label="Order By"
                  onChange={(e) => setOrderByColumn(e.target.value)}
                  sx={{
                    fontSize: 13,
                    '& .MuiMenuItem-root': {
                      fontSize: 13
                    }
                  }}
                >
                  {selectedTable?.columns.map((column) => (
                    <MenuItem key={column.name} value={column.name}>
                      {column.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ flex: 1 }}>
                <InputLabel sx={{ fontSize: 13 }}>Direction</InputLabel>
                <Select
                  value={orderDirection}
                  label="Direction"
                  onChange={(e) => setOrderDirection(e.target.value as 'asc' | 'desc')}
                  sx={{
                    fontSize: 13,
                    '& .MuiMenuItem-root': {
                      fontSize: 13
                    }
                  }}
                >
                  <MenuItem value="asc">ASC</MenuItem>
                  <MenuItem value="desc">DESC</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Paper>

          {/* Execute Button */}
          <Button
            variant="contained"
            onClick={handleSubmit}
            startIcon={<Search size={16} />}
            size="small"
            sx={{
              bgcolor: '#3b82f6',
              '&:hover': {
                bgcolor: '#2563eb',
              },
              height: '40px',  // More reasonable height
              alignSelf: 'flex-end',  // Align with the bottom of other components
              mt: 'auto',  // Push to bottom of container
              mb: 1,  // Add some bottom margin
              px: 2,  // Add horizontal padding
              fontSize: 13,
              textTransform: 'none'  // Prevent all-caps
            }}
          >
            Execute
          </Button>
        </Box>

        {/* SQL Command Section */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Button
            size="small"
            startIcon={<Code size={16} />}
            endIcon={sqlCommandOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            onClick={() => setSqlCommandOpen(!sqlCommandOpen)}
            sx={{ fontSize: 13 }}
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
              onKeyDown={handleKeyDown}
            />
          </Paper>
        </Collapse>
      </Box>
    </Paper>
  );
}