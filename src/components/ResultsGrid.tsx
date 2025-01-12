import { DataGrid } from '@mui/x-data-grid';
import { Paper, Typography, Box } from '@mui/material';
import { Table } from 'lucide-react';

interface ResultsGridProps {
  rows: any[];
  columns: { field: string; headerName: string; flex: number }[];
  loading: boolean;
}

export default function ResultsGrid({ rows, columns, loading }: ResultsGridProps) {
  // Ensure rows is always an array
  const safeRows = Array.isArray(rows) ? rows : [];
  
  return (
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
        <Table size={18} className="text-gray-600" />
        <Typography variant="subtitle1" sx={{ ml: 1, fontWeight: 600, fontSize: 14 }}>
          Query Results
        </Typography>
        <Typography variant="body2" sx={{ ml: 2, color: 'text.secondary', fontSize: 12 }}>
          {safeRows.length} rows
        </Typography>
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
          columns={columns}
          loading={loading}
          pagination
          pageSizeOptions={[25, 50, 100]}
          disableRowSelectionOnClick
          getRowId={(row) => row.id || Math.random()}
          sx={{
            border: 'none',
            '& .MuiDataGrid-columnHeaders': {
              bgcolor: '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
            },
            '& .MuiDataGrid-cell': {
              borderBottom: '1px solid #f1f5f9',
            },
            // Add styles for no rows overlay
            '& .MuiDataGrid-overlay': {
              bgcolor: 'transparent',
              color: '#64748b',
              fontSize: 13
            }
          }}
        />
      </Paper>
    </Paper>
  );
}