import React from 'react';
import PropTypes from 'prop-types';

const ConfirmDialog = ({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
}) => {
  if (!open) return null;

  return (
    <div className="logout-confirm-overlay">
      <div className="logout-confirm-dialog">
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="logout-confirm-buttons">
          <button className="logout-confirm-btn" onClick={onConfirm}>
            {confirmText}
          </button>
          <button className="logout-cancel-btn" onClick={onCancel}>
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
};

ConfirmDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
};

export default ConfirmDialog;
