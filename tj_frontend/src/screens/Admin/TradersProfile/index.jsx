import { IoArrowBack } from "react-icons/io5";
import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../../services/api';
import { Autocomplete, TextField, Card, CardContent, Button, Switch, FormControlLabel, Snackbar, Alert, CircularProgress } from '@mui/material';
import './style.css';

const TradersProfile = ({ onBack }) => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role_type: 'TRADER',
    is_active: false,
    is_verified: true
  });
  
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      fetchUserDetails(selectedUser.id);
    } else {
      setUserDetails(null);
      resetForm();
    }
  }, [selectedUser]);

  const fetchUsers = async () => {
    try {
      const data = await adminAPI.getUsers();
      if (data.success) {
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      showSnackbar('Failed to fetch users', 'error');
    }
  };

  const fetchUserDetails = async (userId) => {
    try {
      setLoading(true);
      const data = await adminAPI.getUserById(userId);
      if (data.success) {
        setUserDetails(data.user);
        setFormData({
          name: data.user.name,
          email: data.user.email,
          phone: data.user.phone,
          role_type: data.user.role_type,
          is_active: data.user.is_active,
          is_verified: data.user.is_verified
        });
      }
    } catch (err) {
      console.error('Error fetching user details:', err);
      showSnackbar('Failed to fetch user details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      role_type: 'TRADER',
      is_active: false,
      is_verified: true
    });
    setPasswordData({
      newPassword: '',
      confirmPassword: ''
    });
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePasswordChange = (field, value) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = () => {
    setShowSaveConfirm(true);
  };

  const confirmSaveProfile = async () => {
    try {
      setShowSaveConfirm(false);
      setSaving(true);
      const data = await adminAPI.updateUser(selectedUser.id, formData);
      if (data.success) {
        setUserDetails(data.user);
        showSnackbar('Profile updated successfully', 'success');
        fetchUsers(); // Refresh user list
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      showSnackbar('Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const cancelSaveProfile = () => {
    setShowSaveConfirm(false);
  };

  const handleSavePassword = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showSnackbar('Passwords do not match', 'error');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      showSnackbar('Password must be at least 6 characters', 'error');
      return;
    }
    setShowPasswordConfirm(true);
  };

  const confirmSavePassword = async () => {
    try {
      setShowPasswordConfirm(false);
      setSaving(true);
      const data = await adminAPI.updateUserPassword(selectedUser.id, passwordData.newPassword);
      if (data.success) {
        showSnackbar('Password updated successfully', 'success');
        setPasswordData({ newPassword: '', confirmPassword: '' });
      }
    } catch (err) {
      console.error('Error updating password:', err);
      showSnackbar('Failed to update password', 'error');
    } finally {
      setSaving(false);
    }
  };

  const cancelSavePassword = () => {
    setShowPasswordConfirm(false);
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <div className="trade-details-screen">
      <div className="screen-header responsive-header">
        <div className="header-title">
          <div className='header-icon' onClick={onBack}>
            <IoArrowBack size={24} color='#345c90' />
          </div>
          <h3>Traders Profile Management</h3>
        </div>
        <div className="header-description">
          <span>Select a trader to view and manage their profile, role, and account status.</span>
        </div>
        <div className="trader-multiselect-group">
          <Autocomplete
            options={users}
            getOptionLabel={(option) => `${option.name} (${option.email})`}
            value={selectedUser}
            onChange={(event, newValue) => setSelectedUser(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Search Trader"
                placeholder="Type name or email..."
                size="small"
                sx={{
                  '& .MuiInputLabel-root': {
                    fontWeight: 500,
                    color: '#345c90',
                    paddingTop: '4px',
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#345c90',
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    border: '1px solid #e1e8ed',
                  },
                }}
              />
            )}
            sx={{
              width: '100%',
              maxWidth: '100%',
              backgroundColor: '#fff',
              borderRadius: 2,
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
              '& .MuiOutlinedInput-root': {
                backgroundColor: '#fff',
                borderRadius: 2,
                minHeight: 50,
                fontSize: 15,
              },
            }}
          />
        </div>
      </div>

      {loading ? (
        <div className="traders-profile-loading">
          <CircularProgress />
          <p>Loading user details...</p>
        </div>
      ) : userDetails ? (
        <div className="traders-profile-section">
          <div className="profile-form-container">
            {/* Section: Profile Information */}
            <div className="form-section">
              <div className="section-header">
                <h3>Profile Information</h3>
              </div>
              <div className="form-grid">
                <div className="form-field">
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter full name"
                  />
                </div>

                <div className="form-field">
                  <label>Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Enter email"
                  />
                </div>

                <div className="form-field">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="Enter phone"
                  />
                </div>

                <div className="form-field">
                  <label>User Role</label>
                  <select
                    value={formData.role_type}
                    onChange={(e) => handleInputChange('role_type', e.target.value)}
                    className="role-select"
                  >
                    <option value="TRADER">Trader</option>
                    <option value="ADMIN">Admin</option>
                    <option value="MANAGER">Manager</option>
                    <option value="VIEWER">Viewer</option>
                  </select>
                </div>

                <div className="form-field">
                  <label>Account Status</label>
                  <select
                    value={formData.is_active ? 'active' : 'inactive'}
                    onChange={(e) => handleInputChange('is_active', e.target.value === 'active')}
                    className="role-select"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div className="form-field">
                  <label>Email Verification</label>
                  <select
                    value={formData.is_verified ? 'verified' : 'unverified'}
                    onChange={(e) => handleInputChange('is_verified', e.target.value === 'verified')}
                    className="role-select"
                  >
                    <option value="verified">Verified</option>
                    <option value="unverified">Unverified</option>
                  </select>
                </div>
              </div>

              <div className="section-button">
                <Button
                  variant="contained"
                  onClick={handleSaveProfile}
                  disabled={saving}
                  sx={{
                    background: 'linear-gradient(135deg, #1976d2 0%, #64b5f6 100%)',
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: 16,
                    padding: '12px 32px',
                    borderRadius: 2,
                    minWidth: 200
                  }}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>

            <div className="section-divider"></div>

            {/* Section: Password Management */}
            <div className="form-section">
              <div className="section-header">
                <h3>Password Management</h3>
              </div>
              <div className="form-grid">
                <div className="form-field">
                  <label>New Password</label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                    placeholder="Enter new password (min 6 characters)"
                  />
                </div>

                <div className="form-field">
                  <label>Confirm Password</label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                    placeholder="Confirm new password"
                  />
                </div>
              </div>

              <div className="section-button">
                <Button
                  variant="contained"
                  onClick={handleSavePassword}
                  disabled={saving || !passwordData.newPassword || !passwordData.confirmPassword}
                  sx={{
                    background: 'linear-gradient(135deg, #f9a825 0%, #fff59d 100%)',
                    color: '#333',
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: 16,
                    padding: '12px 32px',
                    borderRadius: 2,
                    minWidth: 200
                  }}
                >
                  {saving ? 'Updating...' : 'Update Password'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="traders-profile-empty">
          <h3>No Trader Selected</h3>
          <p>Select a trader from the dropdown above to view and manage their profile.</p>
        </div>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Save Profile Confirmation Dialog */}
      {showSaveConfirm && (
        <div className="logout-confirm-overlay">
          <div className="logout-confirm-dialog">
            <h3>Confirm Save Changes</h3>
            <p>Are you sure you want to save the profile changes?</p>
            <div className="logout-confirm-buttons">
              <button className="logout-confirm-btn" onClick={confirmSaveProfile}>
                Confirm
              </button>
              <button className="logout-cancel-btn" onClick={cancelSaveProfile}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Update Confirmation Dialog */}
      {showPasswordConfirm && (
        <div className="logout-confirm-overlay">
          <div className="logout-confirm-dialog">
            <h3>Confirm Password Update</h3>
            <p>Are you sure you want to update the password for this user?</p>
            <div className="logout-confirm-buttons">
              <button className="logout-confirm-btn" onClick={confirmSavePassword}>
                Confirm
              </button>
              <button className="logout-cancel-btn" onClick={cancelSavePassword}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TradersProfile;