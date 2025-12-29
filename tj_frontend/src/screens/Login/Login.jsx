import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import * as authService from '../../services/authService';
import ErrorSnackbar from '../../components/ErrorSnackbar';
import api from '../../services/api';
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
  CircularProgress,
} from '@mui/material';
import { Visibility, VisibilityOff, Email, Lock, Person, Phone } from '@mui/icons-material';
import './Login.css';

const Login = () => {
  const [mode, setMode] = useState('login'); // 'login', 'signup'
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('error');
  const [userIdAvailable, setUserIdAvailable] = useState(null);
  const [checkingUserId, setCheckingUserId] = useState(false);
  const [emailValid, setEmailValid] = useState(null);
  const [phoneValid, setPhoneValid] = useState(null);
  const [passwordValid, setPasswordValid] = useState(null);
  const [formData, setFormData] = useState({
    user_id: '',
    name: '',
    email: '',
    phone: '',
    password: '',
  });
  const { refreshAuth, signIn } = useAuth();
  const navigate = useNavigate();

  // Debounce timer for user_id check
  useEffect(() => {
    if (mode !== 'signup' || !formData.user_id) {
      setUserIdAvailable(null);
      return;
    }

    // Validate format first
    const userIdRegex = /^[a-zA-Z0-9._]{3,30}$/;
    if (!userIdRegex.test(formData.user_id)) {
      setUserIdAvailable(false);
      return;
    }

    const timer = setTimeout(async () => {
      setCheckingUserId(true);
      try {
        const response = await api.get(`/api/users/check/${formData.user_id}`);
        const data = await response.json();
        setUserIdAvailable(data.available);
      } catch (error) {
        console.error('Check user_id error:', error);
        setUserIdAvailable(false);
      }
      setCheckingUserId(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.user_id, mode]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setSnackbarOpen(false);

    // Validate fields in real-time
    if (mode === 'signup') {
      if (name === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        setEmailValid(emailRegex.test(value));
      } else if (name === 'phone') {
        const phoneRegex = /^[0-9]{10}$/;
        setPhoneValid(phoneRegex.test(value));
      } else if (name === 'password') {
        setPasswordValid(value.length >= 6);
      }
    }
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
    if (
      !formData.user_id ||
      !formData.name ||
      !formData.email ||
      !formData.phone ||
      !formData.password
    ) {
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

    if (!userIdAvailable) {
      setSnackbarMessage('User ID is not available or invalid');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    setIsLoading(true);
    const result = await authService.signup(
      formData.user_id,
      formData.name,
      formData.email,
      formData.phone,
      formData.password
    );

    setIsLoading(false);

    if (result.success) {
      // Send Telegram notification
      try {
        const telegramBotUrl = import.meta.env.VITE_TELEGRAM_BOT_URL;
        const telegramChatId = import.meta.env.VITE_TELEGRAM_CHAT_ID;

        if (telegramBotUrl && telegramChatId) {
          await fetch(telegramBotUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              chat_id: telegramChatId,
              text: `🎉 *New User Signup*\n\n👤 *Name:* ${formData.name}\n📧 *Email:* ${formData.email}`,
              parse_mode: 'Markdown',
            }),
          });
        }
      } catch (error) {
        console.error('Telegram notification error:', error);
        // Don't show error to user, just log it
      }

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

  const switchMode = (newMode) => {
    setMode(newMode);
    setSnackbarOpen(false);
    if (newMode === 'login') {
      setFormData({
        name: '',
        email: formData.email,
        phone: '',
        password: '',
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
          zIndex: 1,
        }}
      >
        <Box
          sx={{
            backdropFilter: 'blur(10px)',
            py: 3,
            px: 3,
            textAlign: 'center',
            position: 'relative',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
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
          </Typography>
        </Box>

        <CardContent sx={{ padding: '50px 32px' }}>
          <Box
            component="form"
            onSubmit={(e) => {
              if (mode === 'login') handleLogin(e);
              else if (mode === 'signup') handleSignup(e);
            }}
            sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}
          >
            {mode === 'signup' && (
              <>
                <TextField
                  fullWidth
                  label="User ID"
                  name="user_id"
                  value={formData.user_id}
                  onChange={handleInputChange}
                  required
                  helperText={
                    formData.user_id === ''
                      ? '3-30 characters: letters, numbers, dots, or underscores (e.g., john_trader, jane.doe)'
                      : checkingUserId
                      ? 'Checking availability...'
                      : userIdAvailable === true
                      ? '✓ Available!'
                      : userIdAvailable === false
                      ? '✗ Not available or invalid format'
                      : ''
                  }
                  error={userIdAvailable === false && formData.user_id !== ''}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person sx={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: 'white',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      '& fieldset': {
                        borderColor:
                          userIdAvailable === true
                            ? 'rgba(76, 175, 80, 0.5)'
                            : userIdAvailable === false
                            ? 'rgba(244, 67, 54, 0.5)'
                            : 'rgba(255, 255, 255, 0.2)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.3)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor:
                          userIdAvailable === true
                            ? 'rgba(76, 175, 80, 0.8)'
                            : userIdAvailable === false
                            ? 'rgba(244, 67, 54, 0.8)'
                            : 'rgba(255, 255, 255, 0.5)',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: 'rgba(255, 255, 255, 0.7)',
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: 'rgba(255, 255, 255, 0.9)',
                    },
                    '& .MuiFormHelperText-root': {
                      color:
                        userIdAvailable === true
                          ? 'rgba(76, 175, 80, 0.9)'
                          : userIdAvailable === false
                          ? 'rgba(244, 67, 54, 0.9)'
                          : 'rgba(255, 255, 255, 0.6)',
                    },
                  }}
                />

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
                    ),
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
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: 'rgba(255, 255, 255, 0.7)',
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: 'rgba(255, 255, 255, 0.9)',
                    },
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
                  helperText={
                    formData.phone === ''
                      ? '10-digit phone number'
                      : phoneValid === true
                      ? '✓ Valid'
                      : phoneValid === false
                      ? '✗ Must be 10 digits'
                      : ''
                  }
                  error={phoneValid === false && formData.phone !== ''}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Phone sx={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: 'white',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      '& fieldset': {
                        borderColor:
                          phoneValid === true
                            ? 'rgba(76, 175, 80, 0.5)'
                            : phoneValid === false
                            ? 'rgba(244, 67, 54, 0.5)'
                            : 'rgba(255, 255, 255, 0.2)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.3)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor:
                          phoneValid === true
                            ? 'rgba(76, 175, 80, 0.8)'
                            : phoneValid === false
                            ? 'rgba(244, 67, 54, 0.8)'
                            : 'rgba(255, 255, 255, 0.5)',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: 'rgba(255, 255, 255, 0.7)',
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: 'rgba(255, 255, 255, 0.9)',
                    },
                    '& .MuiFormHelperText-root': {
                      color:
                        phoneValid === true
                          ? 'rgba(76, 175, 80, 0.9)'
                          : phoneValid === false
                          ? 'rgba(244, 67, 54, 0.9)'
                          : 'rgba(255, 255, 255, 0.6)',
                    },
                  }}
                />
              </>
            )}

            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              autoComplete="email"
              helperText={
                mode === 'signup' && formData.email === ''
                  ? 'Valid email address (e.g., user@example.com)'
                  : mode === 'signup' && emailValid === true
                  ? '✓ Valid'
                  : mode === 'signup' && emailValid === false
                  ? '✗ Invalid email format'
                  : ''
              }
              error={mode === 'signup' && emailValid === false && formData.email !== ''}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email sx={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: 'white',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  '& fieldset': {
                    borderColor:
                      mode === 'signup' && emailValid === true
                        ? 'rgba(76, 175, 80, 0.5)'
                        : mode === 'signup' && emailValid === false
                        ? 'rgba(244, 67, 54, 0.5)'
                        : 'rgba(255, 255, 255, 0.2)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor:
                      mode === 'signup' && emailValid === true
                        ? 'rgba(76, 175, 80, 0.8)'
                        : mode === 'signup' && emailValid === false
                        ? 'rgba(244, 67, 54, 0.8)'
                        : 'rgba(255, 255, 255, 0.5)',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(255, 255, 255, 0.7)',
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: 'rgba(255, 255, 255, 0.9)',
                },
                '& .MuiFormHelperText-root': {
                  color:
                    mode === 'signup' && emailValid === true
                      ? 'rgba(76, 175, 80, 0.9)'
                      : mode === 'signup' && emailValid === false
                      ? 'rgba(244, 67, 54, 0.9)'
                      : 'rgba(255, 255, 255, 0.6)',
                },
              }}
            />

            {(mode === 'login' || mode === 'signup') && (
              <TextField
                fullWidth
                label="Password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleInputChange}
                required
                helperText={
                  mode === 'signup' && formData.password === ''
                    ? 'Minimum 6 characters'
                    : mode === 'signup' && passwordValid === true
                    ? '✓ Strong enough'
                    : mode === 'signup' && passwordValid === false
                    ? '✗ Too short (min 6 characters)'
                    : ''
                }
                error={mode === 'signup' && passwordValid === false && formData.password !== ''}
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
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    '& fieldset': {
                      borderColor:
                        mode === 'signup' && passwordValid === true
                          ? 'rgba(76, 175, 80, 0.5)'
                          : mode === 'signup' && passwordValid === false
                          ? 'rgba(244, 67, 54, 0.5)'
                          : 'rgba(255, 255, 255, 0.2)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor:
                        mode === 'signup' && passwordValid === true
                          ? 'rgba(76, 175, 80, 0.8)'
                          : mode === 'signup' && passwordValid === false
                          ? 'rgba(244, 67, 54, 0.8)'
                          : 'rgba(255, 255, 255, 0.5)',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255, 255, 255, 0.7)',
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: 'rgba(255, 255, 255, 0.9)',
                  },
                  '& .MuiFormHelperText-root': {
                    color:
                      mode === 'signup' && passwordValid === true
                        ? 'rgba(76, 175, 80, 0.9)'
                        : mode === 'signup' && passwordValid === false
                        ? 'rgba(244, 67, 54, 0.9)'
                        : 'rgba(255, 255, 255, 0.6)',
                  },
                }}
              />
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={isLoading}
              sx={{
                mt: 3,
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
                  transform: 'translateY(-2px)',
                },
                '&:disabled': {
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: 'rgba(255, 255, 255, 0.5)',
                },
              }}
            >
              {isLoading ? (
                <CircularProgress size={24} sx={{ color: 'white' }} />
              ) : (
                <>
                  {mode === 'login' && 'Sign In'}
                  {mode === 'signup' && 'Create Account'}
                </>
              )}
            </Button>

            {(mode === 'login' || mode === 'signup') && (
              <>
                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  {mode === 'login' && (
                    <Typography
                      variant="body2"
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 1,
                        color: 'rgba(255, 255, 255, 0.7)',
                        flexWrap: 'nowrap',
                      }}
                    >
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
                            textDecoration: 'underline',
                          },
                        }}
                      >
                        Sign Up
                      </Link>
                    </Typography>
                  )}

                  {mode === 'signup' && (
                    <Typography
                      variant="body2"
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 1,
                        color: 'rgba(255, 255, 255, 0.7)',
                        flexWrap: 'nowrap',
                      }}
                    >
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
                            textDecoration: 'underline',
                          },
                        }}
                      >
                        Sign In
                      </Link>
                    </Typography>
                  )}
                </Box>
              </>
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
