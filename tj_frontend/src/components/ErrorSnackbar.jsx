import { Snackbar, Alert } from '@mui/material';
import PropTypes from 'prop-types';

const ErrorSnackbar = ({ open, message, onClose, autoHideDuration = 6000, severity = 'error' }) => {
  const getStyles = () => {
    if (severity === 'success') {
      return {
        backgroundColor: '#4caf50',
        color: '#ffffff',
        '& .MuiAlert-icon': {
          color: '#ffffff'
        }
      };
    }
    return {
      backgroundColor: '#f44336',
      color: '#ffffff',
      '& .MuiAlert-icon': {
        color: '#ffffff'
      }
    };
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      sx={{ marginTop: '60px' }}
    >
      <Alert
        onClose={onClose}
        severity={severity}
        variant="filled"
        sx={{
          width: '100%',
          ...getStyles()
        }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
};

ErrorSnackbar.propTypes = {
  open: PropTypes.bool.isRequired,
  message: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  autoHideDuration: PropTypes.number,
  severity: PropTypes.oneOf(['error', 'success'])
};

export default ErrorSnackbar;
