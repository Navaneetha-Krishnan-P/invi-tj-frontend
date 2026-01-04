import React, { useEffect, useRef } from 'react';
import { Autocomplete, TextField } from '@mui/material';

const TraderMultiSelect = ({ users, selectedUsers, setSelectedUsers, label = 'Trader Name', placeholder = 'Select traders', sx, limitTags }) => {
  const tagLimit = typeof limitTags === 'number' ? limitTags : 3;
  const inputRef = useRef(null);

  useEffect(() => {
    if (selectedUsers.length > tagLimit) {
      const timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.blur();
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [selectedUsers, tagLimit]);

  return (
    <Autocomplete
      multiple
      limitTags={tagLimit}
      id="multiple-limit-tags"
      disablePortal
      options={users}
      getOptionLabel={(option) => `${option.name} (${option.user_id})`}
      value={selectedUsers}
      onChange={(event, newValue) => {
        setSelectedUsers(newValue);
      }}
      sx={{
        width: '150%',
        maxWidth: '150%',
        backgroundColor: '#fff',
        borderRadius: 2,
        boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
        '& .MuiOutlinedInput-root': {
          backgroundColor: '#fff',
          borderRadius: 2,
          paddingRight: 2,
          minHeight: 50,
          fontSize: 15,
        },
        '& .MuiChip-root': {
          background: '#345c90',
          color: '#fff',
          borderRadius: '6px !important',
          fontWeight: 500,
          fontSize: 12,
          padding: '2px 4px !important',
        },
        '& .MuiChip-deleteIcon': {
          color: '#e0e0e0',

        },
        
        ...(sx || {})
      }}
      slotProps={{
        popper: {
          sx: {
            '& .MuiAutocomplete-option': {
              fontSize: '14px !important',
              minHeight: 26,
            },
          },
        },
      }}
      renderInput={(params) =>
        <TextField
          {...params}
          inputRef={inputRef}
          label={label}
          placeholder={placeholder}
          size="small"
          sx={{
            '& .MuiInputLabel-root': {
              fontWeight: 500,
              color: '#345c90',
              paddingTop: '4px',
            },
            '& .MuiOutlinedInput-notchedOutline': {
              border: '1px solid #e1e8ed',
            },
            '& .MuiInputLabel-root:hover': {
              color: '#345c90',
            },
          }}
        />
      }
    />
  );
};

export default TraderMultiSelect;
