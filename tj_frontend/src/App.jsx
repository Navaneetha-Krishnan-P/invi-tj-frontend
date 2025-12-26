import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout/Layout/Layout';
import Login from './screens/Login/Login';
import Dashboard from './screens/Dashboard/Dashboard';
import ForexMarket from './screens/ForexMarket/ForexMarket';
import IndianMarket from './screens/IndianMarket/IndianMarket';
import TradeDetails from './screens/TradeDetails/TradeDetails';
import Admin from './screens/Admin/Admin';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="forex-market" element={<ForexMarket />} />
            <Route path="indian-market" element={<IndianMarket />} />
            <Route path="trade-details" element={<TradeDetails />} />
            <Route
              path="admin"
              element={
                <ProtectedRoute adminOnly={true}>
                  <Admin />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
