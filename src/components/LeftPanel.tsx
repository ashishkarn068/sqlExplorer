import {
  Box,
} from '@mui/material';
import QueryBuilder from './QueryBuilder';
import { Table, QueryParams } from '../types/database';

interface LeftPanelProps {
  open: boolean;
  tables: Table[];
  selectedTable: Table | null;
  onTableChange: (table: Table | null) => void;
  onQuerySubmit: (params: QueryParams) => void;
  isLoading: boolean;
  onTableSelect?: (table: Table, params: QueryParams) => void;
}

export default function LeftPanel({
  open,
  tables,
  selectedTable,
  onTableChange,
  onQuerySubmit,
  isLoading,
  onTableSelect
}: LeftPanelProps) {
  return (
    <Box
      sx={{
        width: '275px',
        minWidth: '275px',
        display: open ? 'block' : 'none',
        bgcolor: '#f8fafc',
        height: '100%',
      }}
    >
      <QueryBuilder
        tables={tables}
        selectedTable={selectedTable}
        onTableChange={onTableChange}
        onQuerySubmit={onQuerySubmit}
        isLoading={isLoading}
        onTableSelect={onTableSelect}
      />
    </Box>
  );
}