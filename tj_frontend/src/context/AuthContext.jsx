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
  const [roles, setRoles] = useState(() => {
    if (!initialUser) return [];
    const rt = initialUser.role_type ?? initialUser.roles ?? '';
    if (Array.isArray(rt)) return rt.map(r => String(r).toUpperCase());
    return String(rt).split(',').map(r => r.trim().toUpperCase()).filter(Boolean);
  });
  const [loading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(roles.includes('ADMIN'));
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
        const rt = parsedUser.role_type ?? parsedUser.roles ?? '';
        const parsedRoles = Array.isArray(rt) ? rt.map(r => String(r).toUpperCase()) : String(rt).split(',').map(r => r.trim().toUpperCase()).filter(Boolean);
        setRoles(parsedRoles);
        setIsAdmin(parsedRoles.includes('ADMIN'));
      } catch (error) {
        console.error('Error parsing user data:', error);
        authService.logout();
        setUser(null);
        setRoles([]);
        setIsAdmin(false);
      }
    } else {
      setUser(null);
      setRoles([]);
      setIsAdmin(false);
    }
  };

  const signIn = async (email, password) => {
    const result = await authService.login(email, password);
    if (result.success && result.data) {
      const u = result.data.user;
      setUser(u);
      const rt = u.role_type ?? u.roles ?? '';
      const parsedRoles = Array.isArray(rt) ? rt.map(r => String(r).toUpperCase()) : String(rt).split(',').map(r => r.trim().toUpperCase()).filter(Boolean);
      setRoles(parsedRoles);
      setIsAdmin(parsedRoles.includes('ADMIN'));
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
    setRoles([]);
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
    roles,
    isAdmin,
    hasRole: (r) => {
      if (!r) return false;
      return roles.includes(String(r).toUpperCase());
    },
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
