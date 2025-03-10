import { DataGrid, GridColDef, GridColumnHeaderParams, GridRenderCellParams, useGridApiRef } from '@mui/x-data-grid';
import { Paper, Typography, Box, Switch, FormControlLabel, Tooltip, Link, IconButton, Backdrop, CircularProgress, FormControl, Select, MenuItem, InputLabel, Menu, Button } from '@mui/material';
import { Table as TableIcon, Copy as CopyIcon, FileDown as FileDownIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Relation, RelationData } from '../types/database';
import * as XLSX from 'xlsx';

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
      allowDuplicates?: boolean;
    }>;
  };
  onRelatedTableClick?: (
    tableName: string,
    columnValue: any,
    constraints: Array<{ field: string; relatedField: string }>,
    clickedField: string,
    relations: Relation[]
  ) => void;
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
  const apiRef = useGridApiRef();

  const [highlightEnabled, setHighlightEnabled] = useState(true);
  const [hideEmptyEnabled, setHideEmptyEnabled] = useState(false);
  const [relationData, setRelationData] = useState<RelationData | null>(null);
  const [adjustedColumns, setAdjustedColumns] = useState<GridColDef[]>([]);
  const [selectedColumn, setSelectedColumn] = useState<string>('');
  const [exportMenuAnchorEl, setExportMenuAnchorEl] = useState<null | HTMLElement>(null);

  const toggleHighlight = () => {
    setHighlightEnabled(!highlightEnabled);
  };

  const toggleHideEmpty = () => {
    setHideEmptyEnabled(!hideEmptyEnabled);
  };

  // Filter out empty columns if hideEmptyEnabled is true
  const filteredColumns = hideEmptyEnabled 
    ? columns.filter(col => {
        // Check if the column has any non-empty values
        return safeRows.some(row => {
          const value = row[col.field];
          return value !== null && value !== undefined && value !== '';
        });
      })
    : columns;

  const styles = `
    .indexed-column {
      background-color: #e8f5e9 !important;
      color: #2e7d32 !important;
      font-weight: 600 !important;
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
          
          if (data && Array.isArray(data.relations)) {
            setRelationData(data);
          } else {
            console.log('Invalid relation data structure:', data);
            setRelationData({ tableName, relations: [] });
          }
        } catch (error) {
          console.error('Error fetching relation data:', error);
          setRelationData({ tableName, relations: [] });
        }
      }
    };
    fetchRelationData();
  }, [tableName]);

  useEffect(() => {
    const adjustedColumns: GridColDef[] = columns.map((col) => {
      // Find the maximum length of values in this column
      const maxValueLength = safeRows.reduce((max, row) => {
        const value = row[col.field]?.toString() || '';
        return Math.max(max, value.length);
      }, 0);

      // Compare with column header length
      const headerLength = col.headerName?.length || col.field.length;
      const maxLength = Math.max(maxValueLength, headerLength);

      // Calculate width: each character is roughly 8px + padding
      const width = Math.min(Math.max(maxLength * 8 + 50, 100), 300);

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

      const columnClassName = `${highlightEnabled && isIndexed ? 'indexed-column' : ''} ${relation ? 'related-column' : ''}`;

      const renderCellWithCopy = (params: GridRenderCellParams) => {
        const formatValue = (value: any) => {
          if (value === null || value === undefined) {
            return '';
          }
          if (typeof value === 'boolean') {
            return value.toString();
          }
          if (typeof value === 'object') {
            return JSON.stringify(value);
          }
          return value;
        };

        const value = formatValue(params.value);
        const hasValue = value !== null && value !== undefined && value !== '';
        
        if (relation) {
          return (
            <Box sx={{ 
              width: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: 0.5
            }}>
              <Link
                component="button"
                onClick={() => {
                  if (relation && onRelatedTableClick && relationData) {
                    onRelatedTableClick(
                      relation.relatedTable,
                      params.value,
                      relation.constraints,
                      params.field,
                      relationData.relations
                    );
                  }
                }}
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
              {hasValue && (
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(value?.toString() || '');
                  }}
                  sx={{
                    p: 0.2,
                    opacity: 0,
                    minWidth: '20px',
                    '&:hover': { opacity: 1 },
                    '.MuiDataGrid-row:hover &': { opacity: 0.7 }
                  }}
                >
                  <CopyIcon size={12} />
                </IconButton>
              )}
            </Box>
          );
        }

        return (
          <Box sx={{ 
            width: '100%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: 0.5
          }}>
            <span style={{ fontSize: '11px' }}>
              {value}
            </span>
            {hasValue && (
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText(value?.toString() || '');
                }}
                sx={{
                  p: 0.2,
                  opacity: 0,
                  minWidth: '20px',
                  '&:hover': { opacity: 1 },
                  '.MuiDataGrid-row:hover &': { opacity: 0.7 }
                }}
              >
                <CopyIcon size={12} />
              </IconButton>
            )}
          </Box>
        );
      };
      
      const renderHeaderWithCopy = (params: GridColumnHeaderParams) => {
        let tooltipContent = '';

        // Get indexes for this column
        const columnIndexes = tableData?.indexes.filter(index => 
          index.columns.map(c => c.toLowerCase()).includes(col.field.toLowerCase())
        ) || [];

        // Get relations for this column
        const relevantRelations = relationData?.relations?.filter(rel => 
          rel.constraints.some(c => c.field.toLowerCase() === col.field.toLowerCase())
        ) || [];

        if (columnIndexes.length > 0 || relevantRelations.length > 0) {
          tooltipContent = `
            <div style="padding: 8px;">
              ${columnIndexes.length > 0 ? `
                <div style="margin-bottom: ${relevantRelations.length > 0 ? '16px' : '0'}">
                  <div style="font-weight: 600; margin-bottom: 8px; color: #2e7d32;">Index Information</div>
                  <div style="
                    max-height: 300px; 
                    overflow-y: auto;
                    overflow-x: hidden;
                    padding-right: 8px;
                    margin-right: -8px;
                  ">
                    ${columnIndexes.map(index => `
                      <div style="margin-bottom: 12px;">
                        <div style="margin-bottom: 4px;">
                          <b>${index.indexName}</b>
                          <span style="
                            font-size: 10px;
                            color: ${index.allowDuplicates === false ? '#2e7d32' : '#666'};
                            background: ${index.allowDuplicates === false ? '#e8f5e9' : '#f5f5f5'};
                            padding: 2px 6px;
                            border-radius: 4px;
                            margin-left: 6px;
                          ">
                            ${index.allowDuplicates === false ? 'Unique' : index.allowDuplicates === undefined ? 'Unknown' : 'Non-Unique'}
                          </span>
                        </div>
                        <div style="font-weight: 600; margin-bottom: 4px; color: #2e7d32;">Columns</div>
                        <div style="font-family: monospace; font-size: 11px;">
                          ${index.columns.map(column => 
                            `<div style="margin-bottom: 2px;">
                              <span style="color: #666;">•</span> ${column}${column.toLowerCase() === col.field.toLowerCase() ? ' <span style="color: #2e7d32">(current)</span>' : ''}
                            </div>`
                          ).join('')}
                        </div>
                      </div>
                    `).join('<div style="border-top: 1px solid #e0e0e0; margin: 8px 0;"></div>')}
                  </div>
                </div>
              ` : ''}
              ${relevantRelations.length > 0 ? `
                <div>
                  <div style="font-weight: 600; margin-bottom: 8px; color: #1976d2;">Related Tables</div>
                  <div style="
                    max-height: 300px; 
                    overflow-y: auto;
                    overflow-x: hidden;
                    padding-right: 8px;
                    margin-right: -8px;
                  ">
                    ${relevantRelations.map(relation => `
                      <div style="margin-bottom: 12px;">
                        <div style="margin-bottom: 4px;"><b>${relation.relatedTable}</b></div>
                        <div style="font-size: 11px; color: #666; margin-bottom: 8px;">
                          ${relation.relationshipType} (${relation.cardinality})
                        </div>
                        <div style="font-weight: 600; margin-bottom: 4px; color: #1976d2;">Constraints</div>
                        <div style="font-family: monospace; font-size: 11px;">
                          ${relation.constraints.map(c => 
                            `<div style="margin-bottom: 2px;">
                              <span style="color: #666;">•</span> ${c.field} 
                              <span style="color: #666;">→</span> 
                              <span style="color: #1976d2;">${relation.relatedTable}</span>
                              <span style="color: #666;">.</span>${c.relatedField}
                            </div>`
                          ).join('')}
                        </div>
                      </div>
                    `).join('<div style="border-top: 1px solid #e0e0e0; margin: 8px 0;"></div>')}
                  </div>
                </div>
              ` : ''}
            </div>
          `;
        }
        
        return (
          <Tooltip 
            title={<div dangerouslySetInnerHTML={{ __html: tooltipContent }} />}
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
                  },
                  '& ::-webkit-scrollbar': {
                    width: '6px',
                    height: '6px'
                  },
                  '& ::-webkit-scrollbar-track': {
                    background: 'transparent'
                  },
                  '& ::-webkit-scrollbar-thumb': {
                    background: 'rgba(0, 0, 0, 0.08)',
                    borderRadius: '3px',
                    '&:hover': {
                      background: 'rgba(0, 0, 0, 0.12)'
                    }
                  }
                }
              }
            }}
          >
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: '4px'
            }}>
              <div>{params.colDef.headerName}</div>
            </Box>
          </Tooltip>
        );
      };

      return {
        ...col,
        width,
        minWidth: width,
        headerClassName: columnClassName,
        cellClassName: columnClassName,
        renderCell: renderCellWithCopy,
        renderHeader: renderHeaderWithCopy,
        headerAlign: 'center' as const,
        align: 'center' as const,
      };
    });

    setAdjustedColumns(adjustedColumns);
  }, [columns, safeRows, indexedColumns, relationData, highlightEnabled]);

  // Log indexed columns when data is loaded
  useEffect(() => {
    if (safeRows.length > 0) {
      console.log('Indexed columns:', indexedColumns);
    }
  }, [safeRows, indexedColumns]);

  // Reset column selector and scroll to left when rows or columns change
  useEffect(() => {
    setSelectedColumn('');
    if (apiRef.current) {
      // Scroll to leftmost column
      apiRef.current.scrollToIndexes({
        colIndex: 0,
      });
    }
  }, [rows, columns]);

  const handleColumnSelect = (event: any) => {
    const columnField = event.target.value;
    setSelectedColumn(columnField);
    
    if (columnField && apiRef.current) {
      const columnIndex = filteredColumns.findIndex(col => col.field === columnField);
      if (columnIndex !== -1) {
        apiRef.current.scrollToIndexes({
          colIndex: columnIndex,
        });
      }
    }
  };

  // Export functions
  const handleExportMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setExportMenuAnchorEl(event.currentTarget);
  };

  const handleExportMenuClose = () => {
    setExportMenuAnchorEl(null);
  };

  const exportToCSV = () => {
    handleExportMenuClose();
    
    if (safeRows.length === 0) {
      console.warn('No data to export');
      return;
    }
    
    // Create CSV content
    const headers = adjustedColumns.map(col => col.headerName || col.field);
    const csvContent = [
      headers.join(','),
      ...safeRows.map(row => 
        adjustedColumns.map(col => {
          const value = row[col.field];
          // Handle null, undefined, and format values with commas
          if (value === null || value === undefined) return '';
          const strValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
          // Escape quotes and wrap in quotes if contains comma
          return strValue.includes(',') ? `"${strValue.replace(/"/g, '""')}"` : strValue;
        }).join(',')
      )
    ].join('\n');
    
    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${tableName || 'export'}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToExcel = () => {
    handleExportMenuClose();
    
    if (safeRows.length === 0) {
      console.warn('No data to export');
      return;
    }
    
    // Create worksheet data
    const wsData = [
      adjustedColumns.map(col => col.headerName || col.field),
      ...safeRows.map(row => 
        adjustedColumns.map(col => {
          const value = row[col.field];
          if (value === null || value === undefined) return '';
          return value;
        })
      )
    ];
    
    // Create worksheet and workbook
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data');
    
    // Generate and download Excel file
    XLSX.writeFile(wb, `${tableName || 'export'}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <Box sx={{ height: '100%', position: 'relative' }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'flex-end', 
        alignItems: 'center', 
        gap: 2,
        p: 1,
        borderBottom: '1px solid #e0e0e0'
      }}>
        <FormControl 
          size="small" 
          sx={{ 
            minWidth: 150,
            marginRight: 'auto',
            '& .MuiInputLabel-root': {
              fontSize: '11px',
              color: 'rgba(0, 0, 0, 0.6)',
              transform: 'translate(14px, 6px) scale(1)'
            },
            '& .MuiInputLabel-shrink': {
              transform: 'translate(14px, -9px) scale(0.75)'
            },
            '& .MuiSelect-select': {
              fontSize: '11px',
              py: 0.5,
              height: '15px',
              lineHeight: '15px'
            },
            '& .MuiOutlinedInput-root': {
              height: '28px'
            }
          }}
        >
          <InputLabel size="small">Go to Column</InputLabel>
          <Select
            value={selectedColumn}
            onChange={handleColumnSelect}
            label="Go to Column"
            size="small"
            MenuProps={{
              PaperProps: {
                sx: {
                  '& .MuiMenuItem-root': {
                    fontSize: '10px',
                    py: 0.25,
                    minHeight: 'auto'
                  }
                }
              }
            }}
          >
            {filteredColumns.map((col) => (
              <MenuItem key={col.field} value={col.field}>
                {col.headerName || col.field}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        {/* Export Button */}
        <Tooltip title="Export Data">
          <Button
            onClick={handleExportMenuOpen}
            size="small"
            variant="outlined"
            startIcon={<FileDownIcon size={14} />}
            sx={{
              fontSize: '0.75rem',
              py: 0.5,
              px: 1,
              minWidth: 'auto',
              height: '28px',
              borderColor: '#e0e0e0',
              color: 'text.secondary',
              '&:hover': {
                borderColor: '#bdbdbd',
                backgroundColor: 'rgba(0, 0, 0, 0.04)'
              }
            }}
            disabled={safeRows.length === 0 || loading}
          >
            Export
          </Button>
        </Tooltip>
        
        {/* Export Menu */}
        <Menu
          anchorEl={exportMenuAnchorEl}
          open={Boolean(exportMenuAnchorEl)}
          onClose={handleExportMenuClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'center',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'center',
          }}
          PaperProps={{
            sx: {
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
              mt: 0.5,
              '& .MuiMenuItem-root': {
                fontSize: '0.75rem',
                py: 0.75,
                px: 2
              }
            }
          }}
        >
          <MenuItem onClick={exportToCSV}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FileDownIcon size={14} />
              Export to CSV
            </Box>
          </MenuItem>
          <MenuItem onClick={exportToExcel}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FileDownIcon size={14} />
              Export to Excel
            </Box>
          </MenuItem>
        </Menu>
        
        <FormControlLabel
          sx={{ 
            m: 0,
            '& .MuiFormControlLabel-label': {
              fontSize: '0.875rem'
            }
          }}
          control={<Switch 
            checked={highlightEnabled} 
            onChange={toggleHighlight}
            size="small"
          />}
          label="Highlight Index"
        />
        <FormControlLabel
          sx={{ 
            m: 0,
            '& .MuiFormControlLabel-label': {
              fontSize: '0.875rem'
            }
          }}
          control={<Switch 
            checked={hideEmptyEnabled} 
            onChange={toggleHideEmpty}
            size="small"
          />}
          label="Hide Empty Columns"
        />
        <Tooltip title={loading ? 'Loading...' : ''}>
          <Typography 
            variant="body2" 
            sx={{ 
              color: 'text.secondary',
              fontSize: '0.875rem'
            }}
          >
            {safeRows.length} {safeRows.length === 1 ? 'row' : 'rows'}
          </Typography>
        </Tooltip>
      </Box>
      <style>{styles}</style>
      <Box sx={{ 
        height: 'calc(100% - 48px)',  
        position: 'relative',
        '& .MuiDataGrid-root': {
          border: '1px solid #e2e8f0',
          bgcolor: 'white',
          fontSize: '11px'
        }
      }}>
        <Backdrop
          open={loading}
          sx={{
            position: 'absolute',
            zIndex: 1,
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            color: '#1976d2'
          }}
        >
          <CircularProgress color="inherit" size={40} />
        </Backdrop>
        <DataGrid
          apiRef={apiRef}
          rows={safeRows}
          columns={adjustedColumns.filter(col => 
            !hideEmptyEnabled || filteredColumns.some(fc => fc.field === col.field)
          )}
          pagination
          pageSizeOptions={[25, 50, 100]}
          disableRowSelectionOnClick
          getRowId={(row) => row.id || Math.random()}
          loading={loading}
          density="compact"
          initialState={{
            pagination: { paginationModel: { pageSize: 50 } },
          }}
          components={{
            NoRowsOverlay: () => (
              <Box 
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: 3,
                  color: 'text.secondary'
                }}
              >
                <Box sx={{ mb: 2 }}>
                  <TableIcon size={48} strokeWidth={1} />
                </Box>
                <Typography variant="h6" sx={{ mb: 1, color: 'text.primary' }}>
                  No Records Found
                </Typography>
                <Typography variant="body2" color="text.secondary" align="center">
                  {tableName ? 
                    `No records found in table "${tableName}". Try modifying your query or filters.` :
                    'Select a table or write a query to see results here.'}
                </Typography>
              </Box>
            )
          }}
          sx={{
            border: 'none',
            height: 'calc(100vh - 200px)',  
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
              whiteSpace: 'normal',
              overflow: 'visible'
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
      </Box>
    </Box>
  );
}