import React, { useState, useEffect } from 'react';
import { IoArrowBack } from 'react-icons/io5';
import { Button, CircularProgress, IconButton } from '@mui/material';
import ErrorSnackbar from '../../../components/ErrorSnackbar';
import { styled } from '@mui/material/styles';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Pagination from '@mui/material/Pagination';
import Stack from '@mui/material/Stack';
import { FaEdit } from 'react-icons/fa';
import { RiDeleteBin6Line } from 'react-icons/ri';
import { adminAPI } from '../../../services/api';
import './style.css';

const StyledTableCell = styled(TableCell)(() => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: '#345c90',
    color: '#ffffff',
    fontWeight: 600,
    fontSize: 15,
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14,
  },
}));

const StyledTableRow = styled(TableRow)(() => ({
  '&:nth-of-type(odd)': {
    backgroundColor: 'rgb(237, 243, 255)',
  },
  '&:nth-of-type(even)': {
    backgroundColor: '#ffffff',
  },
  '&:last-child td, &:last-child th': {
    border: 0,
  },
}));

const Maintenance = ({ onBack }) => {
  const [maintenanceRecords, setMaintenanceRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [formData, setFormData] = useState({
    maintenance_date: '',
    from_time: '',
    to_time: '',
    frontend_version: '',
    backend_version: '',
    description: '',
  });
  const [editingId, setEditingId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all' or 'upcoming'
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;
  const [showForm, setShowForm] = useState(false); // Toggle between table and form view

  useEffect(() => {
    fetchMaintenanceRecords();
  }, []);

  const fetchMaintenanceRecords = async () => {
    setLoading(true);
    try {
      const data = await adminAPI.getMaintenanceRecords();
      setMaintenanceRecords(data.maintenance || []);
    } catch (error) {
      console.error('Error fetching maintenance records:', error);
      showSnackbar('Failed to fetch maintenance records', 'error');
    }
    setLoading(false);
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateTimeFormat = (timeString) => {
    const timeRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/;
    return timeRegex.test(timeString);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate maintenance date
    if (!formData.maintenance_date) {
      showSnackbar('Please select a maintenance date', 'error');
      return;
    }

    // Validate time format
    if (!validateTimeFormat(formData.from_time)) {
      showSnackbar('Invalid From Time format. Use format like 09:00 AM', 'error');
      return;
    }

    if (!validateTimeFormat(formData.to_time)) {
      showSnackbar('Invalid To Time format. Use format like 02:00 PM', 'error');
      return;
    }

    // Convert 12-hour format to 24-hour format for comparison
    const fromTime24 = convertTo24Hour(formData.from_time);
    const toTime24 = convertTo24Hour(formData.to_time);

    // Validate that from_time is less than to_time
    if (fromTime24 >= toTime24) {
      showSnackbar('From Time must be earlier than To Time', 'error');
      return;
    }

    setSaving(true);
    try {
      // Convert 12-hour format to 24-hour format for backend
      const dataToSend = {
        ...formData,
        from_time: fromTime24,
        to_time: toTime24,
      };

      if (editingId) {
        await adminAPI.updateMaintenance(editingId, dataToSend);
        showSnackbar('Maintenance record updated successfully', 'success');
      } else {
        await adminAPI.createMaintenance(dataToSend);
        showSnackbar('Maintenance record added successfully', 'success');
      }

      setFormData({
        maintenance_date: '',
        from_time: '',
        to_time: '',
        frontend_version: '',
        backend_version: '',
        description: '',
      });
      setEditingId(null);
      setShowForm(false); // Return to table view after saving
      fetchMaintenanceRecords();
    } catch (error) {
      console.error('Error saving maintenance record:', error);
      showSnackbar(error.response?.data?.error || 'Failed to save maintenance record', 'error');
    }
    setSaving(false);
  };

  const handleEdit = (record) => {
    // Format date to YYYY-MM-DD for input type="date"
    const formattedDate = record.maintenance_date
      ? new Date(record.maintenance_date).toISOString().split('T')[0]
      : '';

    setFormData({
      maintenance_date: formattedDate,
      from_time: convertTo12Hour(record.from_time),
      to_time: convertTo12Hour(record.to_time),
      frontend_version: record.frontend_version || '',
      backend_version: record.backend_version || '',
      description: record.description || '',
    });
    setEditingId(record.id);
    setShowForm(true); // Show form view for editing
  };

  const handleAddNew = () => {
    setFormData({
      maintenance_date: '',
      from_time: '',
      to_time: '',
      frontend_version: '',
      backend_version: '',
      description: '',
    });
    setEditingId(null);
    setShowForm(true); // Show form view for adding
  };

  const handleCancelForm = () => {
    setFormData({
      maintenance_date: '',
      from_time: '',
      to_time: '',
      frontend_version: '',
      backend_version: '',
      description: '',
    });
    setEditingId(null);
    setShowForm(false); // Return to table view
  };

  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    setSaving(true);
    try {
      await adminAPI.deleteMaintenance(deleteId);
      setShowDeleteConfirm(false);
      setDeleteId(null);
      showSnackbar('Maintenance record deleted successfully', 'success');
      fetchMaintenanceRecords();
    } catch (error) {
      console.error('Error deleting maintenance record:', error);
      showSnackbar('Failed to delete maintenance record', 'error');
    }
    setSaving(false);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeleteId(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Convert 24-hour time to 12-hour format for display
  const formatTime = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Convert 12-hour time to 24-hour format for backend
  const convertTo24Hour = (time12h) => {
    if (!time12h) return '';
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':');
    if (hours === '12') {
      hours = '00';
    }
    if (modifier === 'PM') {
      hours = parseInt(hours, 10) + 12;
    }
    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  };

  // Convert 24-hour time to 12-hour format for input
  const convertTo12Hour = (time24h) => {
    if (!time24h) return '';
    const [hours, minutes] = time24h.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour.toString().padStart(2, '0')}:${minutes} ${ampm}`;
  };

  const getFilteredRecords = () => {
    if (filter === 'upcoming') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return maintenanceRecords.filter((record) => {
        const maintenanceDate = new Date(record.maintenance_date);
        maintenanceDate.setHours(0, 0, 0, 0);
        return maintenanceDate >= today;
      });
    }
    return maintenanceRecords;
  };

  const filteredRecords = getFilteredRecords();

  // Pagination
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredRecords.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);

  const handlePageChange = (event, pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Reset to first page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  return (
    <div className="trade-details-screen">
      <div className="screen-header responsive-header">
        <div className="header-title">
          <div className="header-icon" onClick={onBack}>
            <IoArrowBack size={24} color="#345c90" />
          </div>
          <h3>Maintenance Management</h3>
        </div>
        <div className="header-description">
          <span>
            Schedule and manage system maintenance windows, version updates, and service
            notifications.
          </span>
        </div>
      </div>

      {showForm ? (
        /* Form Container */
        <div className="chart-section">
          <div className="chart-header">
            <h2>{editingId ? 'Edit Maintenance Schedule' : 'Add New Maintenance'}</h2>
          </div>
          <div className="profile-form-container">
            <form onSubmit={handleSubmit} className="maintenance-form">
              <div className="form-grid">
                <div className="form-field">
                  <label>Maintenance Date</label>
                  <input
                    type="date"
                    name="maintenance_date"
                    value={formData.maintenance_date}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-field">
                  <label>From Time</label>
                  <input
                    type="text"
                    name="from_time"
                    value={formData.from_time}
                    onChange={handleInputChange}
                    placeholder="e.g., 09:00 AM"
                    pattern="(0?[1-9]|1[0-2]):[0-5][0-9] (AM|PM)"
                    required
                  />
                </div>

                <div className="form-field">
                  <label>To Time</label>
                  <input
                    type="text"
                    name="to_time"
                    value={formData.to_time}
                    onChange={handleInputChange}
                    placeholder="e.g., 02:00 PM"
                    pattern="(0?[1-9]|1[0-2]):[0-5][0-9] (AM|PM)"
                    required
                  />
                </div>

                <div className="form-field">
                  <label>Frontend Version</label>
                  <input
                    type="text"
                    name="frontend_version"
                    value={formData.frontend_version}
                    onChange={handleInputChange}
                    placeholder="e.g., v1.2.3"
                  />
                </div>

                <div className="form-field">
                  <label>Backend Version</label>
                  <input
                    type="text"
                    name="backend_version"
                    value={formData.backend_version}
                    onChange={handleInputChange}
                    placeholder="e.g., v1.2.3"
                  />
                </div>

                <div className="form-field full-width">
                  <label>Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Describe the maintenance work..."
                    rows={3}
                  />
                </div>
              </div>

              <div className="section-button">
                <Button
                  type="submit"
                  variant="contained"
                  disabled={saving}
                  sx={{
                    backgroundColor: '#345c90',
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: 16,
                    padding: '10px 24px',
                    borderRadius: 2,
                    minWidth: 200,
                    '&:hover': { backgroundColor: '#2a4a73' },
                  }}
                >
                  {saving ? 'Saving...' : editingId ? 'Update Schedule' : 'Add Schedule'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleCancelForm}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: 16,
                    padding: '12px 32px',
                    borderRadius: 2,
                    minWidth: 140,
                    ml: 2,
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        /* Maintenance Schedule Table */
        <div className="chart-section">
          <div className="chart-header">
            <h3>Maintenance Schedule</h3>
            <div className="chart-controls">
              <div className="filter-group">
                <label htmlFor="status-filter">Status:</label>
                <select
                  id="status-filter"
                  className="filter-select"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option value="all">All</option>
                  <option value="upcoming">Upcoming</option>
                </select>
              </div>
              <Button
                variant="contained"
                onClick={handleAddNew}
                sx={{
                  backgroundColor: '#345c90',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: 14,
                  padding: '8px 24px',
                  ml: 2,
                  '&:hover': { backgroundColor: '#2a4a73' },
                }}
              >
                + Add
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="traders-profile-loading">
              <CircularProgress />
              <p>Loading maintenance records...</p>
            </div>
          ) : (
            <TableContainer
              component={Paper}
              sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderRadius: 2 }}
            >
              <Table>
                <TableHead>
                  <StyledTableRow>
                    <StyledTableCell>Date</StyledTableCell>
                    <StyledTableCell>From</StyledTableCell>
                    <StyledTableCell>To</StyledTableCell>
                    <StyledTableCell>Frontend Ver.</StyledTableCell>
                    <StyledTableCell>Backend Ver.</StyledTableCell>
                    <StyledTableCell>Description</StyledTableCell>
                    <StyledTableCell align="center">Actions</StyledTableCell>
                  </StyledTableRow>
                </TableHead>
                <TableBody>
                  {filteredRecords.length === 0 ? (
                    <StyledTableRow>
                      <StyledTableCell
                        colSpan={7}
                        align="center"
                        sx={{ color: '#7f8c8d', fontStyle: 'italic', py: 4 }}
                      >
                        {filter === 'upcoming'
                          ? 'No upcoming maintenance scheduled'
                          : 'No maintenance scheduled'}
                      </StyledTableCell>
                    </StyledTableRow>
                  ) : (
                    currentRecords.map((record) => (
                      <StyledTableRow key={record.id}>
                        <StyledTableCell>{formatDate(record.maintenance_date)}</StyledTableCell>
                        <StyledTableCell>{formatTime(record.from_time)}</StyledTableCell>
                        <StyledTableCell>{formatTime(record.to_time)}</StyledTableCell>
                        <StyledTableCell>{record.frontend_version || '-'}</StyledTableCell>
                        <StyledTableCell>{record.backend_version || '-'}</StyledTableCell>
                        <StyledTableCell>{record.description || '-'}</StyledTableCell>
                        <StyledTableCell align="center">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleEdit(record)}
                            title="Edit"
                          >
                            <FaEdit />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            style={{ marginTop: '2px', transition: 'background 0.2s' }}
                            onClick={() => handleDeleteClick(record.id)}
                            title="Delete"
                            sx={{
                              borderRadius: '50%',
                              transition: 'background 0.2s',
                              '&:hover': {
                                background: 'rgba(255,107,107,0.12)',
                              },
                            }}
                          >
                            <RiDeleteBin6Line
                              size={16}
                              color="#ff6b6b"
                              style={{ transition: 'color 0.2s' }}
                            />
                          </IconButton>
                        </StyledTableCell>
                      </StyledTableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          <Stack spacing={2} className="pagination">
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={handlePageChange}
              shape="rounded"
              variant="outlined"
            />
          </Stack>
        </div>
      )}

      <ErrorSnackbar
        open={snackbar.open}
        message={snackbar.message}
        onClose={handleCloseSnackbar}
        severity={snackbar.severity}
      />

      {showDeleteConfirm && (
        <div className="logout-confirm-overlay">
          <div className="logout-confirm-dialog">
            <h3>Confirm Delete</h3>
            <p>Are you sure you want to delete this maintenance record?</p>
            <div className="logout-confirm-buttons">
              <button className="logout-confirm-btn" onClick={confirmDelete}>
                Confirm
              </button>
              <button className="logout-cancel-btn" onClick={cancelDelete}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Maintenance;
