import {
  Drawer,
  Box,
} from '@mui/material';

interface LeftPanelProps {
  open: boolean;
}

export default function LeftPanel({
  open,
}: LeftPanelProps) {
  return (
    <Drawer
      variant="persistent"
      anchor="left"
      open={open}
      sx={{
        width: '15.525vw',
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: '15.525vw',
          boxSizing: 'border-box',
          bgcolor: '#1e293b',
          borderRight: '1px solid #334155',
          mt: '48px',
          height: 'calc(100% - 48px)',
          position: 'fixed'
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        {/* Future content */}
      </Box>
    </Drawer>
  );
}