import { useState, useEffect } from 'react';
import ErrorSnackbar from '../../components/ErrorSnackbar';
import './Admin.css';

const Admin = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('error');
  const [newUser, setNewUser] = useState({ email: '', password: '', role: 'user' });

  const fetchUsers = async () => {
    try {
      // TODO: Implement user fetching from Supabase
      // Mock data for now
      const mockUsers = [
        { id: 1, email: 'admin@trading.com', role: 'admin', created_at: '2025-01-01' },
        { id: 2, email: 'trader1@trading.com', role: 'user', created_at: '2025-02-15' },
        { id: 3, email: 'trader2@trading.com', role: 'user', created_at: '2025-03-10' }
      ];
      setUsers(mockUsers);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      const errorMsg = 'Oops! Something went wrong';
      setSnackbarMessage(errorMsg);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch users on component mount
    const loadUsers = async () => {
      await fetchUsers();
    };
    loadUsers();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      // TODO: Implement user creation via Supabase admin API
      const errorMsg = 'User creation will be implemented with Supabase Admin API';
      setSnackbarMessage(errorMsg);
      setSnackbarOpen(true);
      setNewUser({ email: '', password: '', role: 'user' });
    } catch (error) {
      console.error('Error creating user:', error);
      const errorMsg = 'Oops! Something went wrong';
      setSnackbarMessage(errorMsg);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    try {
      // TODO: Implement user deletion
      const errorMsg = 'User deletion will be implemented';
      setSnackbarMessage(errorMsg);
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error deleting user:', error);
      const errorMsg = 'Oops! Something went wrong';
      setSnackbarMessage(errorMsg);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      // TODO: Implement role change in Supabase
      const errorMsg = 'Role change will be implemented';
      setSnackbarMessage(errorMsg);
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error changing role:', error);
      const errorMsg = 'Oops! Something went wrong';
      setSnackbarMessage(errorMsg);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  return (
    <div className="admin-screen">
      <div className="screen-header">
        <h1>Admin Panel</h1>
        <p>Manage users and system settings</p>
      </div>

      <div className="admin-content">
        <div className="admin-section">
          <h2>Create New User</h2>
          <form onSubmit={handleCreateUser} className="create-user-form">
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                required
                placeholder="user@example.com"
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                required
                placeholder="Min. 6 characters"
                minLength={6}
              />
            </div>
            <div className="form-group">
              <label>Role</label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button type="submit" className="create-btn">Create User</button>
          </form>
        </div>

        <div className="admin-section">
          <h2>User Management</h2>
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading users...</p>
            </div>
          ) : (
            <div className="users-table-container">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>#{user.id}</td>
                      <td>{user.email}</td>
                      <td>
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          className="role-select"
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td>{user.created_at}</td>
                      <td>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="delete-btn"
                          disabled={user.role === 'admin'}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      
      <ErrorSnackbar
        open={snackbarOpen}
        message={snackbarMessage}
        severity={snackbarSeverity}
        onClose={() => setSnackbarOpen(false)}
      />
    </div>
  );
};

export default Admin;
