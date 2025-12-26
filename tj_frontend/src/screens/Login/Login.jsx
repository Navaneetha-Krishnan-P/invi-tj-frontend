import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import * as authService from '../../services/authService';
import ErrorSnackbar from '../../components/ErrorSnackbar';
import {
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Box,
  InputAdornment,
  IconButton,
  Link,
  Divider,
  CircularProgress
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Person,
  Phone
} from '@mui/icons-material';
import './Login.css';

const Login = () => {
  const [mode, setMode] = useState('login'); // 'login', 'signup', 'forgot-password', 'reset-password'
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('error');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    newPassword: '',
    resetToken: ''
  });
  const { refreshAuth, signIn } = useAuth();
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setSnackbarOpen(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setSnackbarMessage('Please enter email and password');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }
    setIsLoading(true);
    try {
      await signIn(formData.email, formData.password);
      setSnackbarMessage('Login successful!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      setTimeout(() => navigate('/dashboard'), 1000);
    } catch (error) {
      console.error('Login error:', error);
      setSnackbarMessage(error.message || 'Login failed');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
    setIsLoading(false);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone || !formData.password) {
      setSnackbarMessage('Please fill in all fields');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    if (formData.password.length < 6) {
      setSnackbarMessage('Password must be at least 6 characters');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    setIsLoading(true);
    const result = await authService.signup(
      formData.name,
      formData.email,
      formData.phone,
      formData.password
    );

    setIsLoading(false);

    if (result.success) {
      setSnackbarMessage('Signup successful! Please login.');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      setTimeout(() => {
        setMode('login');
        setFormData({ ...formData, password: '' });
      }, 2000);
    } else {
      setSnackbarMessage(result.error || 'Signup failed');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!formData.email) {
      setSnackbarMessage('Please enter your email');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    setIsLoading(true);
    const result = await authService.forgotPassword(formData.email);
    setIsLoading(false);

    if (result.success) {
      setSnackbarMessage('Password reset link sent to your email');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      setTimeout(() => setMode('login'), 3000);
    } else {
      setSnackbarMessage(result.error || 'Failed to send reset link');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!formData.resetToken || !formData.newPassword) {
      setSnackbarMessage('Invalid reset link or missing password');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    if (formData.newPassword.length < 6) {
      setSnackbarMessage('Password must be at least 6 characters');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    setIsLoading(true);
    const result = await authService.resetPassword(
      formData.resetToken,
      formData.newPassword
    );

    setIsLoading(false);

    if (result.success) {
      setSnackbarMessage('Password reset successful! Please login.');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      setTimeout(() => {
        setMode('login');
        setFormData({ ...formData, password: '', resetToken: '', newPassword: '' });
      }, 2000);
    } else {
      setSnackbarMessage(result.error || 'Password reset failed');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setSnackbarOpen(false);
    if (newMode === 'login') {
      setFormData({
        name: '',
        email: formData.email,
        phone: '',
        password: '',
        resetToken: '',
        newPassword: ''
      });
    }
  };

  return (
    <div className="login-container">
      <Card 
        className="login-card" 
        sx={{ 
          maxWidth: 440, 
          width: '100%', 
          background: '#122238',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.37)',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          position: 'relative',
          zIndex: 1
        }}
      >
        <Box 
          sx={{ 
            backdropFilter: 'blur(10px)',
            py: 3,
            px: 3,
            textAlign: 'center',
            position: 'relative',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <Typography 
            variant="h4" 
            component="h1" 
            sx={{ 
              fontWeight: 300, 
              color: 'rgba(255, 255, 255, 0.9)',
              letterSpacing: 4,
              mb: 1,
              fontSize: '1.5rem',
              lineHeight: 1.8,
            }}
          >
            {mode === 'login' && 'WELCOME TO TJ'}
            {mode === 'signup' && 'JOIN US'}
            {mode === 'forgot-password' && 'RESET'}
            {mode === 'reset-password' && 'NEW PASSWORD'}
          </Typography>
        </Box>

        <CardContent sx={{ padding: '50px 32px' }}>
          <Box
            component="form"
            onSubmit={(e) => {
              if (mode === 'login') handleLogin(e);
              else if (mode === 'signup') handleSignup(e);
              else if (mode === 'forgot-password') handleForgotPassword(e);
              else if (mode === 'reset-password') handleResetPassword(e);
            }}
            sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}
          >
            {mode === 'signup' && (
              <>
                <TextField
                  fullWidth
                  label="Full Name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person sx={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                      </InputAdornment>
                    )
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: 'white',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      '& fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.3)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.5)',
                      }
                    },
                    '& .MuiInputLabel-root': {
                      color: 'rgba(255, 255, 255, 0.7)',
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: 'rgba(255, 255, 255, 0.9)',
                    }
                  }}
                />

                <TextField
                  fullWidth
                  label="Phone Number"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Phone sx={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                      </InputAdornment>
                    )
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: 'white',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      '& fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.3)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.5)',
                      }
                    },
                    '& .MuiInputLabel-root': {
                      color: 'rgba(255, 255, 255, 0.7)',
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: 'rgba(255, 255, 255, 0.9)',
                    }
                  }}
                />
              </>
            )}

            {mode !== 'reset-password' && (
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                autoComplete="email"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email sx={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                    </InputAdornment>
                  )
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.5)',
                    }
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255, 255, 255, 0.7)',
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: 'rgba(255, 255, 255, 0.9)',
                  }
                }}
              />
            )}

            {(mode === 'login' || mode === 'signup') && (
              <TextField
                fullWidth
                label="Password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleInputChange}
                required
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock sx={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        size="small"
                        sx={{ color: 'rgba(255, 255, 255, 0.5)' }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.5)',
                    }
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255, 255, 255, 0.7)',
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: 'rgba(255, 255, 255, 0.9)',
                  }
                }}
              />
            )}

            {mode === 'reset-password' && (
              <TextField
                fullWidth
                label="New Password"
                name="newPassword"
                type={showPassword ? 'text' : 'password'}
                value={formData.newPassword}
                onChange={handleInputChange}
                required
                autoComplete="new-password"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock sx={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        size="small"
                        sx={{ color: 'rgba(255, 255, 255, 0.5)' }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.5)',
                    }
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255, 255, 255, 0.7)',
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: 'rgba(255, 255, 255, 0.9)',
                  }
                }}
              />
            )}

            {mode === 'login' && (
              <Box sx={{ textAlign: 'right', mt: -1 }}>
                <Typography
                  variant="body2"
                  onClick={() => switchMode('forgot-password')}
                  sx={{ 
                    cursor: 'pointer', 
                    textDecoration: 'none',
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontWeight: 500,
                    '&:hover': {
                      color: 'rgba(255, 255, 255, 0.9)',
                      textDecoration: 'underline'
                    }
                  }}
                >
                  Forgot Password?
                </Typography>
              </Box>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={isLoading}
              sx={{
                mt: 1,
                py: 1.5,
                background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
                fontSize: '1rem',
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: 2,
                boxShadow: '0 4px 15px rgba(255, 107, 107, 0.3)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: 'linear-gradient(135deg, #ee5a6f 0%, #ff6b6b 100%)',
                  boxShadow: '0 6px 20px rgba(255, 107, 107, 0.4)',
                  transform: 'translateY(-2px)'
                },
                '&:disabled': {
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: 'rgba(255, 255, 255, 0.5)'
                }
              }}
            >
              {isLoading ? (
                <CircularProgress size={24} sx={{ color: 'white' }} />
              ) : (
                <>
                  {mode === 'login' && 'Sign In'}
                  {mode === 'signup' && 'Create Account'}
                  {mode === 'forgot-password' && 'Send Reset Link'}
                  {mode === 'reset-password' && 'Reset Password'}
                </>
              )}
            </Button>

            {(mode === 'login' || mode === 'signup') && (
              <>
                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  {mode === 'login' && (
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, color: 'rgba(255, 255, 255, 0.7)', flexWrap: 'nowrap' }}>
                      <span>Don't have an account?</span>
                      <Link
                        component="button"
                        type="button"
                        onClick={() => switchMode('signup')}
                        sx={{ 
                          fontWeight: 600, 
                          cursor: 'pointer', 
                          textDecoration: 'none',
                          color: 'rgba(255, 255, 255, 0.9)',
                          '&:hover': {
                            textDecoration: 'underline'
                          }
                        }}
                      >
                        Sign Up
                      </Link>
                    </Typography>
                  )}

                  {mode === 'signup' && (
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, color: 'rgba(255, 255, 255, 0.7)', flexWrap: 'nowrap' }}>
                      <span>Already have an account?</span>
                      <Link
                        component="button"
                        type="button"
                        onClick={() => switchMode('login')}
                        sx={{ 
                          fontWeight: 600, 
                          cursor: 'pointer', 
                          textDecoration: 'none',
                          color: 'rgba(255, 255, 255, 0.9)',
                          '&:hover': {
                            textDecoration: 'underline'
                          }
                        }}
                      >
                        Sign In
                      </Link>
                    </Typography>
                  )}
                </Box>
              </>
            )}

            {(mode === 'forgot-password' || mode === 'reset-password') && (
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Link
                  component="button"
                  type="button"
                  onClick={() => switchMode('login')}
                  sx={{ 
                    fontWeight: 600, 
                    cursor: 'pointer', 
                    textDecoration: 'none',
                    color: 'rgba(255, 255, 255, 0.9)',
                    '&:hover': {
                      textDecoration: 'underline'
                    }
                  }}
                >
                  Back to Login
                </Link>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>

      <ErrorSnackbar
        open={snackbarOpen}
        message={snackbarMessage}
        severity={snackbarSeverity}
        onClose={() => setSnackbarOpen(false)}
      />
    </div>
  );
};

export default Login;
