import { DataGrid, GridColDef, GridColumnHeaderParams, GridRenderCellParams } from '@mui/x-data-grid';
import { Paper, Typography, Box, Switch, FormControlLabel, Tooltip, Link, IconButton } from '@mui/material';
import { Table as TableIcon, Copy as CopyIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Relation {
  name: string;
  relatedTable: string;
  cardinality: string;
  relationshipType: string;
  constraints: Array<{
    field: string;
    relatedField: string;
  }>;
}

interface ResultsGridProps {
  rows: any[];
  columns: GridColDef[];
  loading: boolean;
  indexedColumns: string[];
  tableName?: string;
  tableData?: {
    indexes: Array<{
      indexName: string;
      columns: string[];
    }>;
  };
  onRelatedTableClick?: (tableName: string, columnValue: any, constraints: Array<{ field: string; relatedField: string }>) => void;
}

export default function ResultsGrid({ 
  rows, 
  columns, 
  loading, 
  indexedColumns = [], 
  tableName, 
  tableData,
  onRelatedTableClick 
}: ResultsGridProps) {
  const safeRows = Array.isArray(rows) ? rows : [];
  const [highlightEnabled, setHighlightEnabled] = useState(true);
  const [relationData, setRelationData] = useState<any>(null);

  const toggleHighlight = () => {
    setHighlightEnabled(!highlightEnabled);
  };

  const styles = `
    .indexed-column {
      background-color: #e8f5e9;
      color: #2e7d32;
      font-weight: 600;
    }
    .related-column {
      color: #1976d2;
      cursor: pointer;
      text-decoration: underline;
    }
  `;

  // Fetch relation data when tableName changes
  useEffect(() => {
    const fetchRelationData = async () => {
      if (tableName) {
        try {
          const response = await fetch(`http://localhost:3001/api/table-relation/${tableName}`);
          const data = await response.json();
          
          // Log the raw data first
          console.log('Raw relation data for table', tableName, ':', data);
          
          // Check if data has the expected structure
          if (data && typeof data === 'object' && 'relations' in data) {
            const relations = data.relations;
            if (Array.isArray(relations) && relations.length > 0) {
              console.log('Found relations:', relations);
              setRelationData(data);
            } else {
              console.log('No relations array found in data');
              setRelationData({ relations: [] });
            }
          } else {
            console.log('Invalid relation data structure:', data);
            setRelationData({ relations: [] });
          }
        } catch (error) {
          console.error('Error fetching relation data:', error);
          setRelationData({ relations: [] });
        }
      }
    };
    fetchRelationData();
  }, [tableName]);

  const handleCopyToClipboard = (value: any) => {
    navigator.clipboard.writeText(String(value));
  };

  const adjustedColumns = columns.map(col => {
    const isIndexed = Array.isArray(indexedColumns) && 
      indexedColumns.map(c => c.toLowerCase()).includes(col.field.toLowerCase());
    const indexInfo = tableData?.indexes.find(index => 
      index.columns.map(c => c.toLowerCase()).includes(col.field.toLowerCase())
    );
    
    const relation = relationData?.relations?.find((r: Relation) => {
      if (!r || !r.constraints) return false;
      return r.constraints.some(constraint => 
        constraint.field.toLowerCase() === col.field.toLowerCase()
      );
    });

    const columnClassName = highlightEnabled && isIndexed ? 'indexed-column' : '';
    
    const renderCellWithCopy = (params: GridRenderCellParams) => {
      const value = params.value;
      
      if (relation) {
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
            <Link
              component="button"
              onClick={() => onRelatedTableClick?.(relation.relatedTable, value, relation.constraints)}
              sx={{
                textDecoration: 'underline',
                color: '#1976d2 !important',
                cursor: 'pointer',
                fontSize: '11px',
                border: 'none',
                background: 'none',
                padding: 0,
                fontFamily: 'inherit',
                '&:hover': {
                  color: '#1565c0 !important',
                  textDecoration: 'underline'
                }
              }}
            >
              {value}
            </Link>
            <Tooltip title="Copy to clipboard" arrow>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopyToClipboard(value);
                }}
                sx={{
                  ml: 0.5,
                  p: 0.2,
                  opacity: 0,
                  '&:hover': { opacity: 1 },
                  '.MuiDataGrid-row:hover &': { opacity: 0.7 }
                }}
              >
                <CopyIcon size={12} />
              </IconButton>
            </Tooltip>
          </Box>
        );
      }

      return (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
          <Typography variant="body2" sx={{ fontSize: '11px' }}>
            {value}
          </Typography>
          <Tooltip title="Copy to clipboard" arrow>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleCopyToClipboard(value);
              }}
              sx={{
                ml: 0.5,
                p: 0.2,
                opacity: 0,
                '&:hover': { opacity: 1 },
                '.MuiDataGrid-row:hover &': { opacity: 0.7 }
              }}
            >
              <CopyIcon size={12} />
            </IconButton>
          </Tooltip>
        </Box>
      );
    };
    
    return {
      ...col,
      flex: undefined,
      width: Math.max((col.headerName?.length || col.field.length) * 8 + 32, 80),
      headerAlign: 'center' as const,
      align: 'center' as const,
      headerClassName: columnClassName,
      cellClassName: columnClassName,
      renderHeader: (params: GridColumnHeaderParams) => (
        <Tooltip 
          title={isIndexed ? `Part of Index: ${indexInfo?.indexName || 'Unknown'}` : 
                 relation ? `Related to: ${relation.relatedTable}` : ''}
          arrow
        >
          <div>{params.colDef.headerName}</div>
        </Tooltip>
      ),
      renderCell: renderCellWithCopy
    };
  });

  // Log indexed columns when data is loaded
  useEffect(() => {
    if (safeRows.length > 0) {
      console.log('Indexed columns:', indexedColumns);
    }
  }, [safeRows, indexedColumns]);

  return (
    <>
      <style>{styles}</style>
      <Paper 
        elevation={0} 
        sx={{ 
          height: 400, 
          width: '100%',
          bgcolor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: 2,
          p: 3,
          mt: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <TableIcon size={18} className="text-gray-600" />
          <Typography variant="subtitle1" sx={{ ml: 1, fontWeight: 600, fontSize: 14 }}>
            {tableName ? `${tableName} - Query Results` : 'Query Results'}
          </Typography>
          <Typography variant="body2" sx={{ ml: 2, color: 'text.secondary', fontSize: 12 }}>
            {safeRows.length} rows
          </Typography>
          <FormControlLabel
            control={<Switch checked={highlightEnabled} onChange={toggleHighlight} size="small" />}
            label="Highlight Index"
            sx={{ 
              ml: 'auto',
              '& .MuiFormControlLabel-label': {
                fontSize: 12
              }
            }}
          />
        </Box>
        
        <Paper 
          elevation={0} 
          sx={{ 
            height: 'calc(100% - 48px)',
            bgcolor: 'white',
            border: '1px solid #e2e8f0'
          }}
        >
          <DataGrid
            rows={safeRows}
            columns={adjustedColumns}
            loading={loading}
            pagination
            pageSizeOptions={[25, 50, 100]}
            disableRowSelectionOnClick
            getRowId={(row) => row.id || Math.random()}
            autoHeight={false}
            density="compact"
            sx={{
              border: 'none',
              '& .MuiDataGrid-main': {
                overflow: 'auto !important',
                scrollbarWidth: 'thin',
                scrollBehavior: 'smooth',
                '&::-webkit-scrollbar': {
                  width: '6px',
                  height: '6px',
                },
                '&::-webkit-scrollbar-track': {
                  background: 'transparent',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: '#cbd5e1',
                  borderRadius: '3px',
                  '&:hover': {
                    background: '#94a3b8',
                  },
                },
              },
              '& .MuiDataGrid-columnHeaders': {
                bgcolor: '#f8fafc',
                borderBottom: '1px solid #e2e8f0',
                fontSize: '11px',
                fontWeight: 600,
                '& .MuiDataGrid-columnHeader': {
                  padding: '6px 8px',
                  height: '32px',
                  '& .MuiDataGrid-columnHeaderTitle': {
                    fontWeight: 600,
                    whiteSpace: 'normal',
                    lineHeight: 1.2,
                    overflow: 'visible'
                  }
                }
              },
              '& .MuiDataGrid-cell': {
                borderBottom: '1px solid #f1f5f9',
                fontSize: '11px',
                padding: '4px 8px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              },
              '& .MuiDataGrid-row': {
                maxHeight: '32px !important',
                minHeight: '32px !important'
              },
              '& .MuiDataGrid-overlay': {
                bgcolor: 'transparent',
                color: '#64748b',
                fontSize: '11px'
              },
              '& .MuiTablePagination-root': {
                fontSize: '11px'
              },
              '& .MuiDataGrid-footerContainer': {
                borderTop: '1px solid #e2e8f0',
                fontSize: '11px'
              }
            }}
          />
        </Paper>
      </Paper>
    </>
  );
}