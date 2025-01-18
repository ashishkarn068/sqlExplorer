import { DataGrid, GridColDef, GridColumnHeaderParams } from '@mui/x-data-grid';
import { Paper, Typography, Box, Switch, FormControlLabel, Tooltip } from '@mui/material';
import { Table as TableIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

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
}

export default function ResultsGrid({ rows, columns, loading, indexedColumns = [], tableName, tableData }: ResultsGridProps) {
  const safeRows = Array.isArray(rows) ? rows : [];
  
  const [highlightEnabled, setHighlightEnabled] = useState(true);

  const toggleHighlight = () => {
    setHighlightEnabled(!highlightEnabled);
  };

  const styles = `
    .indexed-column {
      background-color: #e8f5e9;
      color: #2e7d32;
      font-weight: 600;
    }
  `;

  const adjustedColumns = columns.map(col => {
    const isIndexed = indexedColumns.map(c => c.toLowerCase()).includes(col.field.toLowerCase());
    const indexInfo = tableData?.indexes.find(index => 
      index.columns.map(c => c.toLowerCase()).includes(col.field.toLowerCase())
    );
    
    const columnClassName = highlightEnabled && isIndexed ? 'indexed-column' : '';
    
    return {
      ...col,
      flex: undefined,
      width: 150,
      headerAlign: 'left' as const,
      align: 'left' as const,
      headerClassName: columnClassName,
      cellClassName: columnClassName,
      renderHeader: (params: GridColumnHeaderParams) => (
        <Tooltip 
          title={isIndexed ? `Part of Index: ${indexInfo?.indexName || 'Unknown'}` : ''}
          arrow
        >
          <div>{params.colDef.headerName}</div>
        </Tooltip>
      )
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