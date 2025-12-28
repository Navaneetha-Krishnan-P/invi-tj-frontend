import React from 'react';
import { Snackbar, Box, Typography, IconButton } from '@mui/material';
import { Build, Close } from '@mui/icons-material';

const MaintenanceSnackbar = ({ open, onClose, maintenanceInfo }) => {
  if (!maintenanceInfo) return null;

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour} ${ampm}`;
  };

  return (
    <Snackbar
      open={open}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      onClose={onClose}
      autoHideDuration={10000}
    >
      <Box
        sx={{
          width: { xs: '95vw', sm: '500px', md: '550px', lg: '600px' },
          maxWidth: '95vw',
          background: 'linear-gradient(135deg, #122238 0%, #345c90 100%)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: { xs: '10px', sm: '12px' },
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(245, 158, 11, 0.3)',
          overflow: 'hidden',
          position: 'relative',
          border: '1px solid rgba(245, 158, 11, 0.2)',
        }}
      >
        {/* Top accent border */}
        <Box
          sx={{
            height: '3px',
            background: 'linear-gradient(90deg, #dc2626 0%, #f59e0b 50%, #dc2626 100%)',
          }}
        />

        {/* Close button */}
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            top: { xs: 6, sm: 8 },
            right: { xs: 6, sm: 8 },
            color: 'rgba(255, 255, 255, 0.6)',
            padding: { xs: '4px', sm: '8px' },
            '&:hover': {
              color: 'rgba(255, 255, 255, 0.9)',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
            },
          }}
          size="small"
        >
          <Close fontSize="small" sx={{ fontSize: { xs: 18, sm: 20 } }} />
        </IconButton>

        <Box sx={{ p: { xs: 1.5, sm: 2, md: 2.5 } }}>
          {/* Header with icon */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: { xs: 1, sm: 1.2, md: 1.5 },
              mb: { xs: 1, sm: 1.5, md: 2 },
            }}
          >
            <Box
              sx={{
                width: { xs: 28, sm: 32, md: 38 },
                height: { xs: 28, sm: 32, md: 38 },
                borderRadius: { xs: '7px', sm: '8px', md: '10px' },
                background: 'linear-gradient(135deg, #dc2626 0%, #f59e0b 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(220, 38, 38, 0.4)',
              }}
            >
              <Build sx={{ color: '#ffffff', fontSize: { xs: 16, sm: 18, md: 20 } }} />
            </Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: '#ffffff',
                fontSize: { xs: '0.85rem', sm: '0.95rem', md: '1rem' },
                letterSpacing: '-0.01em',
              }}
            >
              ⚠️ Scheduled Maintenance Alert
            </Typography>
          </Box>

          {/* Date and Time Info - Single Row */}
          <Box
            sx={{
              backgroundColor: 'rgba(220, 38, 38, 0.1)',
              borderRadius: { xs: '6px', sm: '8px' },
              padding: { xs: '8px 10px', sm: '10px 14px' },
              mb: { xs: 1, sm: 1.5 },
              border: '1px solid rgba(245, 158, 11, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexWrap: { xs: 'wrap', sm: 'nowrap' },
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: { xs: 1.5, sm: 2 },
                flexWrap: { xs: 'wrap', sm: 'nowrap' },
                justifyContent: 'center',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' },
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Date:
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: '#ffffff',
                    fontSize: { xs: '0.75rem', sm: '0.8rem', md: '0.875rem' },
                    fontWeight: 600,
                  }}
                >
                  {formatDate(maintenanceInfo.maintenance_date)}
                </Typography>
              </Box>
              <Box
                sx={{
                  width: { xs: '0.5px', sm: '1px' },
                  height: { xs: '16px', sm: '20px' },
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  display: { xs: 'none', sm: 'block' },
                }}
              />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' },
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Time:
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: '#fbbf24',
                    fontSize: { xs: '0.75rem', sm: '0.8rem', md: '0.875rem' },
                    fontWeight: 600,
                  }}
                >
                  {formatTime(maintenanceInfo.from_time)} - {formatTime(maintenanceInfo.to_time)}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Message */}
          <Typography
            variant="body2"
            sx={{
              color: 'rgba(255, 255, 255, 0.8)',
              lineHeight: 1.5,
              fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.8125rem' },
              mb: { xs: 0.3, sm: 0.5 },
            }}
          >
            We apologize for any inconvenience. Our team is working to enhance your experience with
            system improvements.
          </Typography>

          <Typography
            variant="caption"
            sx={{
              color: 'rgba(251, 191, 36, 0.9)',
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              fontSize: { xs: '0.65rem', sm: '0.68rem', md: '0.75rem' },
              fontWeight: 500,
            }}
          >
            Services may be temporarily unavailable during this period.
          </Typography>
        </Box>
      </Box>
    </Snackbar>
  );
};

export default MaintenanceSnackbar;
