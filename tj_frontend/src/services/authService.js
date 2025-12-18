const API_URL = 'http://localhost:5000/api/auth';

// Sign Up
export const signup = async (name, email, phone, password) => {
  try {
    const response = await fetch(`${API_URL}/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, phone, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Signup failed');
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Verify OTP
export const verifyOTP = async (email, otp) => {
  try {
    const response = await fetch(`${API_URL}/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, otp }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'OTP verification failed');
    }

    // Store token and user data
    if (data.token) {
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('userData', JSON.stringify(data.user));
      localStorage.setItem('loginTimestamp', Date.now().toString());
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Resend OTP
export const resendOTP = async (email) => {
  try {
    const response = await fetch(`${API_URL}/resend-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to resend OTP');
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Login
export const login = async (email, password) => {
  try {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }

    // Store token and user data
    if (data.token) {
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('userData', JSON.stringify(data.user));
      localStorage.setItem('loginTimestamp', Date.now().toString());
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message, needsVerification: error.needsVerification };
  }
};

// Forgot Password
export const forgotPassword = async (email) => {
  try {
    const response = await fetch(`${API_URL}/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to send reset email');
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Reset Password
export const resetPassword = async (email, otp, newPassword) => {
  try {
    const response = await fetch(`${API_URL}/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, otp, newPassword }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Password reset failed');
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get User Profile
export const getUserProfile = async () => {
  try {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_URL}/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch profile');
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Logout
export const logout = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('userData');
  localStorage.removeItem('loginTimestamp');
};

// Check if session is expired (2 hours = 7200000 milliseconds)
export const isSessionExpired = () => {
  const loginTimestamp = localStorage.getItem('loginTimestamp');
  if (!loginTimestamp) return true;
  
  const now = Date.now();
  const elapsed = now - parseInt(loginTimestamp);
  const twoHours = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
  
  return elapsed > twoHours;
};

// Check if user is authenticated and session is valid
export const isAuthenticated = () => {
  const hasToken = !!localStorage.getItem('authToken');
  if (!hasToken) return false;
  
  // Check if session expired
  if (isSessionExpired()) {
    logout();
    return false;
  }
  
  return true;
};

// Get current user
export const getCurrentUser = () => {
  const userData = localStorage.getItem('userData');
  return userData ? JSON.parse(userData) : null;
};
