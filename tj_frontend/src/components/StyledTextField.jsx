import { TextField } from '@mui/material';

const StyledTextField = ({ sx, ...props }) => {
  return (
    <TextField
      variant="outlined"
      size="medium"
      {...props}
      sx={{
        width: '100%',
        '& .MuiOutlinedInput-root': {
          backgroundColor: '#f8fafc',
          '& fieldset': {
            borderColor: '#cbd5e1',
            borderWidth: '1.5px'
          },
          '&:hover fieldset': {
            borderColor: '#94a3b8'
          },
          '&.Mui-focused fieldset': {
            borderColor: '#345c90',
            borderWidth: '2px'
          },
          '&.Mui-focused': {
            backgroundColor: '#ffffff'
          }
        },
        '& .MuiInputLabel-root': {
          color: '#64748b',
          fontWeight: 500,
          fontSize: '0.875rem'
        },
        '& .MuiInputLabel-root.Mui-focused': {
          color: '#345c90',
          fontWeight: 600,
          fontSize: '0.875rem'
        },
        '& input::placeholder': {
          color: '#cbd5e1',
          fontSize: '0.85rem',
          opacity: 1
        },
        '& textarea::placeholder': {
          color: '#cbd5e1',
          fontSize: '0.85rem',
          opacity: 1
        },
        '& input[type="datetime-local"]:invalid': {
          color: '#cbd5e1',
          fontSize: '0.85rem'
        },
        '& .MuiSelect-select': {
          '&[aria-expanded="false"]': {
            color: props.value === '' ? '#cbd5e1' : 'inherit',
            fontSize: props.value === '' ? '0.85rem' : 'inherit'
          }
        },
        ...sx
      }}
    />
  );
};

export default StyledTextField;
