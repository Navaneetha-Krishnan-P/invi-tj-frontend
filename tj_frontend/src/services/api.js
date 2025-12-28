// API Configuration - Using environment variables
const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;
const ADMIN_API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;
const IMAGE_API_URL = import.meta.env.VITE_IMAGE_API_URL || 'http://62.84.183.182:7080';

// API Endpoints
const ENDPOINTS = {
  // Dashboard
  DASHBOARD_STATS: '/dashboard/stats',
  DASHBOARD_COMPARISON: '/dashboard/comparison',
  DASHBOARD_TRADES: '/dashboard/trades',
  DASHBOARD_PROFIT_OVER_TIME: '/dashboard/profit-over-time',

  // Trades
  TRADES_SAVE: '/trades/save',
  TRADES_ALL: '/trades/all',
  TRADES_DATA: '/trades/data',

  // Admin
  USERS_LIST: '/users/list',
  ADMIN_TRADES_ALL: '/trades/all',

  // Image Processing
  IMAGE_DETAILS: '/imgdetails/',

  // Auth
  AUTH_LOGIN: '/auth/login',
};

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// Dashboard APIs
export const dashboardAPI = {
  getStats: async () => {
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.DASHBOARD_STATS}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch dashboard stats');
    return response.json();
  },

  getComparison: async () => {
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.DASHBOARD_COMPARISON}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch comparison data');
    return response.json();
  },

  getTrades: async (market, limit = 1000, startDate = null, endDate = null) => {
    let url = `${API_BASE_URL}${ENDPOINTS.DASHBOARD_TRADES}?market=${market}&limit=${limit}`;
    if (startDate) url += `&startDate=${startDate}`;
    if (endDate) url += `&endDate=${endDate}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error(`Failed to fetch ${market} trades`);
    return response.json();
  },

  getProfitOverTime: async (period, market, timeFilter = null) => {
    const timeFilterParam = timeFilter && timeFilter !== 'all' ? `&timeFilter=${timeFilter}` : '';
    const response = await fetch(
      `${API_BASE_URL}${ENDPOINTS.DASHBOARD_PROFIT_OVER_TIME}?period=${period}&market=${market}${timeFilterParam}`,
      {
        method: 'GET',
        headers: getAuthHeaders(),
      }
    );
    if (!response.ok) throw new Error(`Failed to fetch ${market} profit data`);
    return response.json();
  },
};

// Trade APIs
export const tradeAPI = {
  saveTrades: async (trades) => {
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.TRADES_SAVE}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ trades }),
    });
    if (!response.ok) throw new Error('Failed to save trades');
    return response.json();
  },

  getAllTrades: async () => {
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.TRADES_ALL}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch trades');
    return response.json();
  },

  getTradeData: async () => {
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.TRADES_DATA}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch trade data');
    return response.json();
  },
};

// Image Processing API
export const imageAPI = {
  processImage: async (imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await fetch(`${IMAGE_API_URL}${ENDPOINTS.IMAGE_DETAILS}`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) throw new Error(`API returned status ${response.status}`);
    return response.json();
  },
};

// Admin APIs
export const adminAPI = {
  getUsers: async () => {
    const response = await fetch(`${ADMIN_API_URL}${ENDPOINTS.USERS_LIST}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch users');
    return response.json();
  },

  getUserById: async (userId) => {
    const response = await fetch(`${ADMIN_API_URL}/users/${userId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch user');
    return response.json();
  },

  updateUser: async (userId, userData) => {
    const response = await fetch(`${ADMIN_API_URL}/users/${userId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData),
    });
    if (!response.ok) throw new Error('Failed to update user');
    return response.json();
  },

  updateUserPassword: async (userId, newPassword) => {
    const response = await fetch(`${ADMIN_API_URL}/users/${userId}/password`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ newPassword }),
    });
    if (!response.ok) throw new Error('Failed to update password');
    return response.json();
  },

  deleteUser: async (userId) => {
    const response = await fetch(`${ADMIN_API_URL}/users/${userId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete user');
    return response.json();
  },

  getAllTrades: async (userIds = null) => {
    let url = `${ADMIN_API_URL}${ENDPOINTS.ADMIN_TRADES_ALL}`;
    if (userIds && userIds.length > 0) {
      url += `?userId=${userIds.join(',')}`;
    }
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch trades');
    return response.json();
  },

  // Maintenance APIs
  getMaintenanceRecords: async () => {
    const response = await fetch(`${ADMIN_API_URL}/maintenance`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch maintenance records');
    return response.json();
  },

  createMaintenance: async (maintenanceData) => {
    const response = await fetch(`${ADMIN_API_URL}/maintenance`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(maintenanceData),
    });
    if (!response.ok) throw new Error('Failed to create maintenance record');
    return response.json();
  },

  updateMaintenance: async (maintenanceId, maintenanceData) => {
    const response = await fetch(`${ADMIN_API_URL}/maintenance/${maintenanceId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(maintenanceData),
    });
    if (!response.ok) throw new Error('Failed to update maintenance record');
    return response.json();
  },

  deleteMaintenance: async (maintenanceId) => {
    const response = await fetch(`${ADMIN_API_URL}/maintenance/${maintenanceId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete maintenance record');
    return response.json();
  },
};

// Auth APIs (if needed for future use)
export const authAPI = {
  login: async (email, password) => {
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.AUTH_LOGIN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) throw new Error('Login failed');
    return response.json();
  },

  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    localStorage.removeItem('userId');
  },

  checkUserId: async (userId) => {
    const response = await fetch(`${API_BASE_URL}/users/check/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) throw new Error('Failed to check user ID');
    return response.json();
  },
};

export default {
  get: async (url) => {
    const response = await fetch(`${API_BASE_URL.replace('/api', '')}${url}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) throw new Error('Request failed');
    return response;
  },
  dashboardAPI,
  tradeAPI,
  imageAPI,
  authAPI,
  adminAPI,
};
