import { useState } from 'react';
import { AuthContext } from './AuthContextDefinition';
import * as authService from '../services/authService';

export const AuthProvider = ({ children }) => {
  const getInitialUser = () => {
    // Check if session is expired first
    if (authService.isSessionExpired()) {
      authService.logout();
      return null;
    }
    
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    
    if (token && userData) {
      try {
        return JSON.parse(userData);
      } catch (error) {
        console.error('Error parsing user data:', error);
        authService.logout();
        return null;
      }
    }
    return null;
  };

  const initialUser = getInitialUser();
  const [user, setUser] = useState(initialUser);
  const [loading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(initialUser?.email === 'admin@trading.com');
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);

  const checkAuth = () => {
    // Check if session is expired
    if (authService.isSessionExpired()) {
      authService.logout();
      setUser(null);
      setIsAdmin(false);
      return;
    }
    
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsAdmin(parsedUser.email === 'admin@trading.com');
      } catch (error) {
        console.error('Error parsing user data:', error);
        authService.logout();
        setUser(null);
        setIsAdmin(false);
      }
    } else {
      setUser(null);
      setIsAdmin(false);
    }
  };

  const signIn = async (email, password) => {
    const result = await authService.login(email, password);
    if (result.success && result.data) {
      setUser(result.data.user);
      setIsAdmin(result.data.user.email === 'admin@trading.com');
      // Trigger welcome dialog
      setShowWelcomeDialog(true);
      return result.data;
    }
    throw new Error(result.error || 'Login failed');
  };

  const signUp = async (userData) => {
    const result = await authService.signup(userData);
    if (result.success) {
      return result.data;
    }
    throw new Error(result.error || 'Signup failed');
  };

  const signOut = async () => {
    authService.logout();
    setUser(null);
    setIsAdmin(false);
    setShowWelcomeDialog(false);
  };

  const refreshAuth = () => {
    checkAuth();
  };

  const clearWelcome = () => {
    setShowWelcomeDialog(false);
  };

  const value = {
    user,
    isAdmin,
    loading,
    signIn,
    signUp,
    signOut,
    refreshAuth,
    showWelcomeDialog,
    clearWelcome,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
