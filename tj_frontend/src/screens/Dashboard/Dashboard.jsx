import { useState, useEffect, useRef } from 'react';
import { dashboardAPI } from '../../services/api';
import ProfitChart from '../../components/ProfitChart';
import BarChart from '../../components/BarChart/BarChart';
import PieChart from '../../components/PieChart';
import StockCombinedChart from '../../components/StockCombinedChart';
import ErrorSnackbar from '../../components/ErrorSnackbar';
import WelcomeDialog from '../../components/WelcomeDialog';
import MaintenanceSnackbar from '../../components/MaintenanceSnackbar';
import { useAuth } from '../../hooks/useAuth.js';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { MdDashboardCustomize } from 'react-icons/md';
import { TbCirclePercentageFilled } from 'react-icons/tb';
import { GiTrophy } from 'react-icons/gi';
import { FaArrowTrendDown } from 'react-icons/fa6';

import './Dashboard.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Dashboard = () => {
  const { showWelcomeDialog, clearWelcome } = useAuth();

  const [stats, setStats] = useState({
    totalTrades: 0,
    profitLoss: 0,
    winRate: 0,
    winningTrades: 0,
    losingTrades: 0,
    tradesByMarket: [],
  });
  const [indianProfitData, setIndianProfitData] = useState([]);
  const [indianProfitPeriod, setIndianProfitPeriod] = useState('days');
  const [forexProfitData, setForexProfitData] = useState([]);
  const [forexProfitPeriod, setForexProfitPeriod] = useState('days');
  const [indianPieTrades, setIndianPieTrades] = useState([]);
  const [forexPieTrades, setForexPieTrades] = useState([]);
  const [indianProfitLoading, setIndianProfitLoading] = useState(false);
  const [forexProfitLoading, setForexProfitLoading] = useState(false);
  const [indianChartType, setIndianChartType] = useState('line');
  const [forexChartType, setForexChartType] = useState('line');
  const [indianTimeFilter, setIndianTimeFilter] = useState('all');
  const [indianTrades, setIndianTrades] = useState([]);
  const [forexTimeFilter, setForexTimeFilter] = useState('all');
  const [forexTrades, setForexTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [forexLoading, setForexLoading] = useState(true);
  const [indianLoading, setIndianLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('error');

  // Maintenance notification states
  const [maintenanceSnackbarOpen, setMaintenanceSnackbarOpen] = useState(false);
  const [maintenanceInfo, setMaintenanceInfo] = useState(null);

  // Performance Calculation States
  const [capital, setCapital] = useState('');
  const [performanceMarket, setPerformanceMarket] = useState('FOREX');
  const [performanceFilter, setPerformanceFilter] = useState('all');
  const [perfLoading, setPerfLoading] = useState(false);
  const capitalInputRef = useRef(null);

  // Check for maintenance on mount only if no welcome dialog
  useEffect(() => {
    const loginTimestamp = localStorage.getItem('loginTimestamp');
    const maintenanceShownFor = localStorage.getItem('maintenanceShownFor');

    // Only show if not shown for this login session
    if (!showWelcomeDialog && maintenanceShownFor !== loginTimestamp) {
      checkUpcomingMaintenance();
    }
  }, []);

  const checkUpcomingMaintenance = async () => {
    const loginTimestamp = localStorage.getItem('loginTimestamp');
    const maintenanceShownFor = localStorage.getItem('maintenanceShownFor');

    if (maintenanceShownFor === loginTimestamp) return;

    try {
      const response = await fetch(`${API_URL}/api/maintenance/upcoming`);
      const data = await response.json();

      if (data.success && data.maintenance && data.maintenance.length > 0) {
        setMaintenanceInfo(data.maintenance[0]);
        setMaintenanceSnackbarOpen(true);
        localStorage.setItem('maintenanceShownFor', loginTimestamp);
      }
    } catch (error) {
      console.error('Error checking maintenance:', error);
    }
  };

  const handleWelcomeClose = () => {
    clearWelcome();
    // Check maintenance after welcome dialog closes
    setTimeout(() => {
      checkUpcomingMaintenance();
    }, 500);
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('authToken');

        if (!token) {
          const errorMsg = 'No authentication token found';
          setError(errorMsg);
          setSnackbarMessage(errorMsg);
          setSnackbarSeverity('error');
          setSnackbarOpen(true);
          return;
        }

        // Fetch stats using API store
        const statsData = await dashboardAPI.getStats();

        setStats({
          totalTrades: statsData.stats.totalTrades,
          profitLoss: statsData.stats.profitLoss,
          winRate: statsData.stats.winRate,
          winningTrades: statsData.stats.winningTrades,
          losingTrades: statsData.stats.losingTrades,
          tradesByMarket: statsData.stats.tradesByMarket || [],
        });
        setError(null);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        const errorMsg = 'Oops! Something went wrong';
        setError(errorMsg);
        setSnackbarMessage(errorMsg);
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Helper to control animation
  const [animateStats, setAnimateStats] = useState(false);
  useEffect(() => {
    if (!loading && !error) {
      setTimeout(() => setAnimateStats(true), 50); // slight delay for smoothness
    } else {
      setAnimateStats(false);
    }
  }, [loading, error]);

  // Fetch Indian trades with time filter
  useEffect(() => {
    const fetchIndianTrades = async () => {
      try {
        setIndianLoading(true);
        const token = localStorage.getItem('authToken');
        if (!token) return;

        let startDate = null;
        let endDate = null;
        const now = new Date();

        switch (indianTimeFilter) {
          case 'today': {
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            startDate = `${year}-${month}-${day}`;
            endDate = startDate;
            break;
          }
          case 'last_week': {
            const weekAgo = new Date(now);
            weekAgo.setDate(now.getDate() - 7);
            const startYear = weekAgo.getFullYear();
            const startMonth = String(weekAgo.getMonth() + 1).padStart(2, '0');
            const startDay = String(weekAgo.getDate()).padStart(2, '0');
            startDate = `${startYear}-${startMonth}-${startDay}`;
            const endYear = now.getFullYear();
            const endMonth = String(now.getMonth() + 1).padStart(2, '0');
            const endDay = String(now.getDate()).padStart(2, '0');
            endDate = `${endYear}-${endMonth}-${endDay}`;
            break;
          }
          case 'last_month': {
            const monthAgo = new Date(now);
            monthAgo.setMonth(now.getMonth() - 1);
            const startYear = monthAgo.getFullYear();
            const startMonth = String(monthAgo.getMonth() + 1).padStart(2, '0');
            const startDay = String(monthAgo.getDate()).padStart(2, '0');
            startDate = `${startYear}-${startMonth}-${startDay}`;
            const endYear = now.getFullYear();
            const endMonth = String(now.getMonth() + 1).padStart(2, '0');
            const endDay = String(now.getDate()).padStart(2, '0');
            endDate = `${endYear}-${endMonth}-${endDay}`;
            break;
          }
          case 'last_3months': {
            const threeMonthsAgo = new Date(now);
            threeMonthsAgo.setMonth(now.getMonth() - 3);
            const startYear = threeMonthsAgo.getFullYear();
            const startMonth = String(threeMonthsAgo.getMonth() + 1).padStart(2, '0');
            const startDay = String(threeMonthsAgo.getDate()).padStart(2, '0');
            startDate = `${startYear}-${startMonth}-${startDay}`;
            const endYear = now.getFullYear();
            const endMonth = String(now.getMonth() + 1).padStart(2, '0');
            const endDay = String(now.getDate()).padStart(2, '0');
            endDate = `${endYear}-${endMonth}-${endDay}`;
            break;
          }
          default:
            break;
        }

        const data = await dashboardAPI.getTrades('INDIAN', 1000, startDate, endDate);
        setIndianTrades(data.trades || []);
      } catch (err) {
        console.error('Error fetching Indian trades:', err);
        setIndianTrades([]);
      } finally {
        setIndianLoading(false);
      }
    };
    fetchIndianTrades();
  }, [indianTimeFilter]);

  // Fetch Forex trades with time filter
  useEffect(() => {
    const fetchForexTrades = async () => {
      try {
        setForexLoading(true);
        const token = localStorage.getItem('authToken');
        if (!token) return;

        let startDate = null;
        let endDate = null;
        const now = new Date();

        switch (forexTimeFilter) {
          case 'today': {
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            startDate = `${year}-${month}-${day}`;
            endDate = startDate;
            break;
          }
          case 'last_week': {
            const weekAgo = new Date(now);
            weekAgo.setDate(now.getDate() - 7);
            const startYear = weekAgo.getFullYear();
            const startMonth = String(weekAgo.getMonth() + 1).padStart(2, '0');
            const startDay = String(weekAgo.getDate()).padStart(2, '0');
            startDate = `${startYear}-${startMonth}-${startDay}`;
            const endYear = now.getFullYear();
            const endMonth = String(now.getMonth() + 1).padStart(2, '0');
            const endDay = String(now.getDate()).padStart(2, '0');
            endDate = `${endYear}-${endMonth}-${endDay}`;
            break;
          }
          case 'last_month': {
            const monthAgo = new Date(now);
            monthAgo.setMonth(now.getMonth() - 1);
            const startYear = monthAgo.getFullYear();
            const startMonth = String(monthAgo.getMonth() + 1).padStart(2, '0');
            const startDay = String(monthAgo.getDate()).padStart(2, '0');
            startDate = `${startYear}-${startMonth}-${startDay}`;
            const endYear = now.getFullYear();
            const endMonth = String(now.getMonth() + 1).padStart(2, '0');
            const endDay = String(now.getDate()).padStart(2, '0');
            endDate = `${endYear}-${endMonth}-${endDay}`;
            break;
          }
          case 'last_3months': {
            const threeMonthsAgo = new Date(now);
            threeMonthsAgo.setMonth(now.getMonth() - 3);
            const startYear = threeMonthsAgo.getFullYear();
            const startMonth = String(threeMonthsAgo.getMonth() + 1).padStart(2, '0');
            const startDay = String(threeMonthsAgo.getDate()).padStart(2, '0');
            startDate = `${startYear}-${startMonth}-${startDay}`;
            const endYear = now.getFullYear();
            const endMonth = String(now.getMonth() + 1).padStart(2, '0');
            const endDay = String(now.getDate()).padStart(2, '0');
            endDate = `${endYear}-${endMonth}-${endDay}`;
            break;
          }
          default:
            break;
        }

        const data = await dashboardAPI.getTrades('FOREX', 1000, startDate, endDate);
        setForexTrades(data.trades || []);
      } catch (err) {
        console.error('Error fetching Forex trades:', err);
        setForexTrades([]);
      } finally {
        setForexLoading(false);
      }
    };
    fetchForexTrades();
  }, [forexTimeFilter]);

  // Fetch Indian profit over time (handled client-side via aggregation)
  useEffect(() => {
    setIndianProfitLoading(false);
  }, [indianProfitPeriod]);

  // Fetch Forex profit over time (handled client-side via aggregation)
  useEffect(() => {
    setForexProfitLoading(false);
  }, [forexProfitPeriod]);

  // Aggregate trades into periods for charts (days/weeks/months/quarters/years)
  const formatDateKey = (d) => d.toISOString().split('T')[0];

  const aggregateFromTrades = (trades, periodKey) => {
    // trades: array with trade_date and profit_loss
    const mapByDate = {};
    trades.forEach((t) => {
      const key = formatDateKey(new Date(t.trade_date));
      if (!mapByDate[key]) mapByDate[key] = [];
      mapByDate[key].push(t);
    });

    const sumPLForRange = (start, end) => {
      let sum = 0;
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const k = formatDateKey(new Date(d));
        if (mapByDate[k]) {
          sum += mapByDate[k].reduce((s, tr) => s + Number(tr.profit_loss), 0);
        }
      }
      return sum;
    };

    const out = [];
    const today = new Date();

    if (periodKey === 'days') {
      const DAYS = 30;
      for (let i = DAYS - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const key = formatDateKey(d);
        const val = mapByDate[key]
          ? mapByDate[key].reduce((s, tr) => s + Number(tr.profit_loss), 0)
          : 0;
        out.push({ period: key, totalProfit: val });
      }
    } else if (periodKey === 'weeks') {
      const WEEKS = 12;
      // start of this week (Monday)
      const cur = new Date(today);
      const day = cur.getDay();
      const diffToMon = (day + 6) % 7;
      const startOfThisWeek = new Date(cur);
      startOfThisWeek.setDate(cur.getDate() - diffToMon);
      for (let i = WEEKS - 1; i >= 0; i--) {
        const weekStart = new Date(startOfThisWeek);
        weekStart.setDate(startOfThisWeek.getDate() - i * 7);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        const val = sumPLForRange(weekStart, weekEnd);
        out.push({ period: formatDateKey(weekStart), totalProfit: val });
      }
    } else if (periodKey === 'months') {
      const MONTHS = 12;
      for (let i = MONTHS - 1; i >= 0; i--) {
        const m = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const start = new Date(m.getFullYear(), m.getMonth(), 1);
        const end = new Date(m.getFullYear(), m.getMonth() + 1, 0);
        const val = sumPLForRange(start, end);
        out.push({
          period: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`,
          totalProfit: val,
        });
      }
    } else if (periodKey === 'quarters') {
      const QUARTERS = 8;
      const curYear = today.getFullYear();
      const curQuarter = Math.floor(today.getMonth() / 3) + 1;
      for (let i = QUARTERS - 1; i >= 0; i--) {
        const qIndex = curQuarter - i - 1;
        const yearOffset = Math.floor(qIndex / 4);
        const quarter = (((qIndex % 4) + 4) % 4) + 1;
        const year = curYear + yearOffset;
        const startMonth = (quarter - 1) * 3;
        const start = new Date(year, startMonth, 1);
        const end = new Date(year, startMonth + 3, 0);
        const val = sumPLForRange(start, end);
        out.push({ period: `${year}-Q${quarter}`, totalProfit: val });
      }
    }

    return out;
  };

  // Recompute profit arrays and pie-filtered trades when trades or period selection changes
  useEffect(() => {
    // indian
    try {
      const aggregated = aggregateFromTrades(indianTrades || [], indianProfitPeriod || 'days');
      setIndianProfitData(aggregated);

      // set pie trades filtered by window
      if (indianProfitPeriod === 'all') {
        setIndianPieTrades(indianTrades || []);
      } else {
        // compute window start/end based on selected period
        const today = new Date();
        let start = new Date();
        if (indianProfitPeriod === 'days') {
          const DAYS = 30;
          start.setDate(today.getDate() - (DAYS - 1));
        } else if (indianProfitPeriod === 'weeks') {
          const WEEKS = 12;
          const day = today.getDay();
          const diffToMon = (day + 6) % 7;
          const startOfThisWeek = new Date(today);
          startOfThisWeek.setDate(today.getDate() - diffToMon);
          start = new Date(startOfThisWeek);
          start.setDate(startOfThisWeek.getDate() - (WEEKS - 1) * 7);
        } else if (indianProfitPeriod === 'months') {
          const MONTHS = 12;
          start = new Date(today.getFullYear(), today.getMonth() - (MONTHS - 1), 1);
        } else if (indianProfitPeriod === 'quarters') {
          const QUARTERS = 8;
          const curQuarter = Math.floor(today.getMonth() / 3) + 1;
          const curYear = today.getFullYear();
          const startQuarterIndex = curQuarter - (QUARTERS - 1);
          const startYearOffset = Math.floor((startQuarterIndex - 1) / 4);
          const startQuarter = ((((startQuarterIndex - 1) % 4) + 4) % 4) + 1;
          const startMonth = (startQuarter - 1) * 3;
          start = new Date(curYear + startYearOffset, startMonth, 1);
        }
        const end = new Date(today);
        setIndianPieTrades(
          (indianTrades || []).filter((t) => {
            const d = new Date(t.trade_date);
            return d >= start && d <= end;
          })
        );
      }
    } catch (err) {
      console.error('Error aggregating Indian trades:', err);
    }
  }, [indianTrades, indianProfitPeriod]);

  useEffect(() => {
    // forex
    try {
      const aggregated = aggregateFromTrades(forexTrades || [], forexProfitPeriod || 'days');
      setForexProfitData(aggregated);

      if (forexProfitPeriod === 'all') {
        setForexPieTrades(forexTrades || []);
      } else {
        const today = new Date();
        let start = new Date();
        if (forexProfitPeriod === 'days') {
          const DAYS = 30;
          start.setDate(today.getDate() - (DAYS - 1));
        } else if (forexProfitPeriod === 'weeks') {
          const WEEKS = 12;
          const day = today.getDay();
          const diffToMon = (day + 6) % 7;
          const startOfThisWeek = new Date(today);
          startOfThisWeek.setDate(today.getDate() - diffToMon);
          start = new Date(startOfThisWeek);
          start.setDate(startOfThisWeek.getDate() - (WEEKS - 1) * 7);
        } else if (forexProfitPeriod === 'months') {
          const MONTHS = 12;
          start = new Date(today.getFullYear(), today.getMonth() - (MONTHS - 1), 1);
        } else if (forexProfitPeriod === 'quarters') {
          const QUARTERS = 8;
          const curQuarter = Math.floor(today.getMonth() / 3) + 1;
          const curYear = today.getFullYear();
          const startQuarterIndex = curQuarter - (QUARTERS - 1);
          const startYearOffset = Math.floor((startQuarterIndex - 1) / 4);
          const startQuarter = ((((startQuarterIndex - 1) % 4) + 4) % 4) + 1;
          const startMonth = (startQuarter - 1) * 3;
          start = new Date(curYear + startYearOffset, startMonth, 1);
        }
        const end = new Date(today);
        setForexPieTrades(
          (forexTrades || []).filter((t) => {
            const d = new Date(t.trade_date);
            return d >= start && d <= end;
          })
        );
      }
    } catch (err) {
      console.error('Error aggregating Forex trades:', err);
    }
  }, [forexTrades, forexProfitPeriod]);

  // Handle performance capital change with loading
  useEffect(() => {
    if (capital && Number(capital) > 0) {
      setPerfLoading(true);
      const timer = setTimeout(() => {
        setPerfLoading(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [capital, performanceFilter, performanceMarket]);

  // Auto-blur capital input after user finishes typing
  useEffect(() => {
    if (capital && Number(capital) > 0) {
      const blurTimer = setTimeout(() => {
        if (capitalInputRef.current) {
          capitalInputRef.current.blur();
        }
      }, 1500);
      return () => clearTimeout(blurTimer);
    }
  }, [capital]);

  if (loading) {
    return (
      <div className="dashboard-screen">
        <div className="screen-header">
          <Skeleton height={32} width={150} />
        </div>

        <div className="stats-grid">
          {Array(4)
            .fill(0)
            .map((_, index) => (
              <div
                key={index}
                className="stat-card"
                style={{
                  background: 'white',
                  borderRadius: '8px',
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <Skeleton circle width={40} height={40} />
                <div className="stat-content" style={{ flex: 1 }}>
                  <Skeleton height={15} width={100} style={{ marginBottom: '8px' }} />
                  <Skeleton height={28} width={80} />
                </div>
              </div>
            ))}
        </div>
        <br />

        {/* Market Overview Skeleton */}
        <div className="dashboard-main-section">
          <Skeleton height={28} width={200} style={{ marginBottom: '8px' }} />
          <Skeleton height={18} width={400} style={{ marginBottom: '16px' }} />
          <div className="module-content-container">
            <div className="market-overview-grid">
              {Array(2)
                .fill(0)
                .map((_, index) => (
                  <div key={index} className="market-overview-card" style={{ padding: '20px' }}>
                    <Skeleton height={24} width={150} style={{ marginBottom: '16px' }} />
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '12px',
                      }}
                    >
                      {Array(4)
                        .fill(0)
                        .map((_, i) => (
                          <div key={i}>
                            <Skeleton height={14} width={80} style={{ marginBottom: '6px' }} />
                            <Skeleton height={24} width={100} />
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Performance Calculator Skeleton */}
        <div className="dashboard-main-section">
          <Skeleton height={28} width={250} style={{ marginBottom: '8px' }} />
          <Skeleton height={18} width={500} style={{ marginBottom: '16px' }} />
          <div className="module-content-container">
            <div style={{ padding: '24px' }}>
              <Skeleton height={24} width={200} style={{ marginBottom: '20px' }} />
              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <Skeleton height={40} width={150} />
                <Skeleton height={40} width={200} />
                <Skeleton height={40} width={150} />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Skeleton */}
        <div className="dashboard-main-section no-margin-bottom">
          <Skeleton height={28} width={250} style={{ marginBottom: '8px' }} />
          <Skeleton height={18} width={600} style={{ marginBottom: '16px' }} />
        </div>

        {Array(3)
          .fill(0)
          .map((_, index) => (
            <div key={index} className="chart-section profit-chart-section">
              <div className="chart-header">
                <Skeleton height={28} width={300} style={{ marginBottom: '12px' }} />
                <Skeleton height={16} width="100%" count={2} style={{ marginBottom: '16px' }} />
                <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
                  <Skeleton height={40} width={150} />
                  <Skeleton height={40} width={150} />
                </div>
              </div>
              <Skeleton height={350} style={{ marginTop: '20px' }} />
            </div>
          ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-screen">
        <div className="screen-header">
          <h2>Dashboard</h2>
          <p className="error-message">
            Unable to load dashboard data. Please try refreshing the page.
          </p>
        </div>

        <ErrorSnackbar
          open={snackbarOpen}
          message={snackbarMessage}
          severity={snackbarSeverity}
          onClose={() => setSnackbarOpen(false)}
        />
      </div>
    );
  }

  // Calculate profit and loss separately for each market
  const forexProfitTrades = forexTrades.filter((t) => Number(t.profit_loss) > 0);
  const forexLossTrades = forexTrades.filter((t) => Number(t.profit_loss) < 0);
  const indianProfitTrades = indianTrades.filter((t) => Number(t.profit_loss) > 0);
  const indianLossTrades = indianTrades.filter((t) => Number(t.profit_loss) < 0);

  const forexTotalProfit = forexProfitTrades.reduce((sum, t) => sum + Number(t.profit_loss), 0);
  const forexTotalLoss = forexLossTrades.reduce((sum, t) => sum + Number(t.profit_loss), 0);
  const indianTotalProfit = indianProfitTrades.reduce((sum, t) => sum + Number(t.profit_loss), 0);
  const indianTotalLoss = indianLossTrades.reduce((sum, t) => sum + Number(t.profit_loss), 0);

  return (
    <div className="dashboard-screen">
      {showWelcomeDialog && <WelcomeDialog onClose={handleWelcomeClose} />}

      <div className="screen-header">
        <h2>Dashboard</h2>
      </div>

      {/* Main Stats Cards */}
      <div className={`stats-grid${animateStats ? ' animate-up' : ''}`}>
        <div className="stat-card">
          <div className="stat-icon">
            <MdDashboardCustomize color="345c90" />
          </div>
          <div className="stat-content">
            <h3>Total Trades</h3>
            <p className="stat-value">{stats.totalTrades}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <TbCirclePercentageFilled color="345c90" />
          </div>
          <div className="stat-content">
            <h3>Win Rate</h3>
            <p className="stat-value">{stats.winRate}%</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <GiTrophy color="345c90" />
          </div>
          <div className="stat-content">
            <h3>Winning Trades</h3>
            <p className="stat-value positive">{stats.winningTrades}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <FaArrowTrendDown color="345c90" />
          </div>
          <div className="stat-content">
            <h3>Losing Trades</h3>
            <p className="stat-value negative">{stats.losingTrades}</p>
          </div>
        </div>
      </div>
      <br />

      {/* Market Overview Cards - Separate Forex and Indian */}
      <div className="dashboard-main-section">
        <h2>Market Overview</h2>
        <p>Summary of trading activity and performance by market</p>
        <div className="module-content-container">
          <div className="market-overview-grid">
            {/* Forex Market Card */}
            <div className="market-overview-card forex">
              <div
                className="market-overview-header"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <h4>
                  Forex Market{' '}
                  <span style={{ color: '#71797a', marginLeft: 6, fontSize: 12 }}>(USD)</span>
                </h4>
                <div className="filter-group" style={{ margin: 0 }}>
                  <select
                    value={forexTimeFilter}
                    onChange={(e) => setForexTimeFilter(e.target.value)}
                    className="filter-select"
                    style={{ fontSize: 12 }}
                  >
                    <option value="today">Today</option>
                    <option value="last_week">Last Week</option>
                    <option value="last_month">Last Month</option>
                    <option value="last_3months">Last 3 Months</option>
                    <option value="all">All</option>
                  </select>
                </div>
              </div>
              <div className="market-overview-stats">
                {forexLoading ? (
                  <>
                    <div className="overview-stat">
                      <span className="stat-label">Total Trades</span>
                      <Skeleton width={40} height={24} />
                    </div>
                    <div className="overview-stat">
                      <span className="stat-label">Net P/L</span>
                      <Skeleton width={80} height={24} />
                    </div>
                    <div className="overview-stat profit">
                      <span className="stat-label">Total Profit</span>
                      <Skeleton width={80} height={24} />
                    </div>
                    <div className="overview-stat loss">
                      <span className="stat-label">Total Loss</span>
                      <Skeleton width={80} height={24} />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="overview-stat">
                      <span className="stat-label">Total Trades</span>
                      <span className="stat-value">{forexTrades.length}</span>
                    </div>
                    <div className="overview-stat">
                      <span className="stat-label">Net P/L</span>
                      <span
                        className={`stat-value ${
                          forexTrades.reduce((sum, t) => sum + Number(t.profit_loss), 0) >= 0
                            ? 'positive'
                            : 'negative'
                        }`}
                      >
                        ${' '}
                        {forexTrades.reduce((sum, t) => sum + Number(t.profit_loss), 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="overview-stat profit">
                      <span className="stat-label">Total Profit</span>
                      <span className="stat-value positive">$ {forexTotalProfit.toFixed(2)}</span>
                      <span className="stat-count">({forexProfitTrades.length} trades)</span>
                    </div>
                    <div className="overview-stat loss">
                      <span className="stat-label">Total Loss</span>
                      <span className="stat-value negative">$ {forexTotalLoss.toFixed(2)}</span>
                      <span className="stat-count">({forexLossTrades.length} trades)</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Indian Market Card */}
            <div className="market-overview-card indian">
              <div
                className="market-overview-header"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <h4>
                  Indian Market{' '}
                  <span style={{ color: '#71797a', marginLeft: 6, fontSize: 12 }}>(INR)</span>
                </h4>
                <div className="filter-group" style={{ margin: 0 }}>
                  <select
                    value={indianTimeFilter}
                    onChange={(e) => setIndianTimeFilter(e.target.value)}
                    className="filter-select"
                    style={{ fontSize: 12 }}
                  >
                    <option value="today">Today</option>
                    <option value="last_week">Last Week</option>
                    <option value="last_month">Last Month</option>
                    <option value="last_3months">Last 3 Months</option>
                    <option value="all">All</option>
                  </select>
                </div>
              </div>
              <div className="market-overview-stats">
                {indianLoading ? (
                  <>
                    <div className="overview-stat">
                      <span className="stat-label">Total Trades</span>
                      <Skeleton width={40} height={24} />
                    </div>
                    <div className="overview-stat">
                      <span className="stat-label">Net P/L</span>
                      <Skeleton width={80} height={24} />
                    </div>
                    <div className="overview-stat profit">
                      <span className="stat-label">Total Profit</span>
                      <Skeleton width={80} height={24} />
                    </div>
                    <div className="overview-stat loss">
                      <span className="stat-label">Total Loss</span>
                      <Skeleton width={80} height={24} />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="overview-stat">
                      <span className="stat-label">Total Trades</span>
                      <span className="stat-value">{indianTrades.length}</span>
                    </div>
                    <div className="overview-stat">
                      <span className="stat-label">Net P/L</span>
                      <span
                        className={`stat-value ${
                          indianTrades.reduce((sum, t) => sum + Number(t.profit_loss), 0) >= 0
                            ? 'positive'
                            : 'negative'
                        }`}
                      >
                        ₹{' '}
                        {indianTrades.reduce((sum, t) => sum + Number(t.profit_loss), 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="overview-stat profit">
                      <span className="stat-label">Total Profit</span>
                      <span className="stat-value positive">₹ {indianTotalProfit.toFixed(2)}</span>
                      <span className="stat-count">({indianProfitTrades.length} trades)</span>
                    </div>
                    <div className="overview-stat loss">
                      <span className="stat-label">Total Loss</span>
                      <span className="stat-value negative">₹ {indianTotalLoss.toFixed(2)}</span>
                      <span className="stat-count">({indianLossTrades.length} trades)</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Calculation Section */}
      <div className="dashboard-main-section">
        <h2>Performance Calculator</h2>
        <p>
          Calculate your portfolio performance by entering your initial capital and selecting the
          market. View returns across different time periods.
        </p>

        <div className="module-content-container">
          <div className="performance-calculator-single">
            <div className="performance-calculator">
              <h3
                style={{
                  fontSize: '18px',
                  marginBottom: '20px',
                  color: '#345c90',
                  fontWeight: 700,
                }}
              >
                Calculate Performance
              </h3>

              <div className="capital-input-section">
                <div
                  style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}
                >
                  <select
                    value={performanceMarket}
                    onChange={(e) => setPerformanceMarket(e.target.value)}
                    className="filter-select"
                    style={{ minWidth: '150px' }}
                  >
                    <option value="FOREX">Forex Market (USD)</option>
                    <option value="INDIAN">Indian Market (INR)</option>
                  </select>
                  <input
                    type="number"
                    id="capital"
                    ref={capitalInputRef}
                    placeholder="Enter initial capital"
                    value={capital}
                    onChange={(e) => setCapital(e.target.value)}
                    className="capital-input"
                    min="0"
                    step="1000"
                  />
                  <select
                    value={performanceFilter}
                    onChange={(e) => setPerformanceFilter(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">All Time</option>
                    <option value="last_week">Last Week</option>
                    <option value="last_month">Last Month</option>
                  </select>
                </div>
              </div>

              {capital && Number(capital) > 0 && (
                <div className="performance-results-single">
                  {perfLoading ? (
                    <div className="performance-card-single" style={{ padding: '24px' }}>
                      <div className="performance-details-grid">
                        {Array(10)
                          .fill(0)
                          .map((_, index) => (
                            <div key={index} className="perf-stat">
                              <Skeleton height={14} width={100} style={{ marginBottom: '6px' }} />
                              <Skeleton height={24} width={120} />
                            </div>
                          ))}
                      </div>
                    </div>
                  ) : (
                    <>
                      {(() => {
                        const filterTrades = (trades, filter) => {
                          if (filter === 'all') return trades;

                          const now = new Date();
                          let startDate = new Date();

                          if (filter === 'last_week') {
                            startDate.setDate(now.getDate() - 7);
                          } else if (filter === 'last_month') {
                            startDate.setMonth(now.getMonth() - 1);
                          }

                          return trades.filter((trade) => {
                            const tradeDate = new Date(trade.trade_date);
                            return tradeDate >= startDate && tradeDate <= now;
                          });
                        };

                        const selectedTrades =
                          performanceMarket === 'INDIAN' ? indianTrades : forexTrades;
                        const currencySymbol = performanceMarket === 'INDIAN' ? '₹' : '$';
                        const filteredTrades = filterTrades(selectedTrades, performanceFilter);
                        const totalPL = filteredTrades.reduce(
                          (sum, t) => sum + Number(t.profit_loss),
                          0
                        );
                        const capitalValue = Number(capital);
                        const finalCapital = capitalValue + totalPL;
                        const performancePercent = ((totalPL / capitalValue) * 100).toFixed(2);
                        const profitTrades = filteredTrades.filter(
                          (t) => Number(t.profit_loss) > 0
                        );
                        const lossTrades = filteredTrades.filter((t) => Number(t.profit_loss) < 0);
                        const totalProfit = profitTrades.reduce(
                          (sum, t) => sum + Number(t.profit_loss),
                          0
                        );
                        const totalLoss = lossTrades.reduce(
                          (sum, t) => sum + Number(t.profit_loss),
                          0
                        );

                        return (
                          <div className="performance-card-single">
                            <div className="performance-details-grid">
                              <div className="perf-stat">
                                <span className="perf-label">Market:</span>
                                <span className="perf-value">
                                  {performanceMarket === 'INDIAN'
                                    ? 'Indian Market'
                                    : 'Forex Market'}
                                </span>
                              </div>
                              <div className="perf-stat">
                                <span className="perf-label">Initial Capital:</span>
                                <span className="perf-value">
                                  {currencySymbol} {capitalValue.toLocaleString()}
                                </span>
                              </div>
                              <div className="perf-stat">
                                <span className="perf-label">Total Trades:</span>
                                <span className="perf-value">{filteredTrades.length}</span>
                              </div>
                              <div className="perf-stat">
                                <span className="perf-label">Winning Trades:</span>
                                <span className="perf-value positive">{profitTrades.length}</span>
                              </div>
                              <div className="perf-stat">
                                <span className="perf-label">Losing Trades:</span>
                                <span className="perf-value negative">{lossTrades.length}</span>
                              </div>
                              <div className="perf-stat">
                                <span className="perf-label">Total Profit:</span>
                                <span className="perf-value positive">
                                  {currencySymbol} {totalProfit.toFixed(2)}
                                </span>
                              </div>
                              <div className="perf-stat">
                                <span className="perf-label">Total Loss:</span>
                                <span className="perf-value negative">
                                  {currencySymbol} {totalLoss.toFixed(2)}
                                </span>
                              </div>
                              <div className="perf-stat">
                                <span className="perf-label">Net P/L:</span>
                                <span
                                  className={`perf-value ${totalPL >= 0 ? 'positive' : 'negative'}`}
                                >
                                  {currencySymbol} {totalPL.toFixed(2)}
                                </span>
                              </div>
                              <div className="perf-stat">
                                <span className="perf-label">Final Capital:</span>
                                <span
                                  className={`perf-value ${
                                    finalCapital >= capitalValue ? 'positive' : 'negative'
                                  }`}
                                >
                                  {currencySymbol} {finalCapital.toLocaleString()}
                                </span>
                              </div>
                              <div className="perf-stat highlight">
                                <span className="perf-label">Performance:</span>
                                <span
                                  className={`perf-value ${
                                    performancePercent >= 0 ? 'positive' : 'negative'
                                  }`}
                                >
                                  {performancePercent >= 0 ? '+' : ''}
                                  {performancePercent}%
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Performance Analytics Section */}
      <div className="dashboard-main-section no-margin-bottom">
        <h2>Performance Analytics</h2>
        <p>
          Detailed visual analysis of your trading performance across different markets and time
          periods. Use the filters to customize your view and gain insights into your trading
          patterns.
        </p>
      </div>

      {/* Forex Market Profit Over Time */}
      <div className="chart-section profit-chart-section">
        <div className="chart-header">
          <div>
            <h2>Forex Market - Profit Over Time</h2>
            <p style={{ color: '#7f8c8d', fontSize: '14px', margin: '8px 0 0 0' }}>
              Monitor your foreign exchange trading performance over time. Switch between different
              time periods and chart types to analyze profit patterns, identify trends, and evaluate
              your forex trading strategy.
            </p>
          </div>
          <div
            className="chart-controls"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ flex: '1 1 auto' }} />
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div className="filter-group" style={{ display: 'flex', alignItems: 'center' }}>
                <label style={{ marginRight: 8 }}>Period:</label>
                <select
                  value={forexProfitPeriod}
                  onChange={(e) => setForexProfitPeriod(e.target.value)}
                  className="filter-select"
                >
                  <option value="days">Last 30 Days</option>
                  <option value="weeks">Last 12 Weeks</option>
                  <option value="months">Last 12 Months</option>
                  <option value="quarters">Last 8 Quarters</option>
                </select>
              </div>
              <div className="filter-group" style={{ display: 'flex', alignItems: 'center' }}>
                <label style={{ marginRight: 8 }}>Chart Type:</label>
                <select
                  value={forexChartType}
                  onChange={(e) => setForexChartType(e.target.value)}
                  className="filter-select"
                >
                  <option value="line">Line Chart</option>
                  <option value="bar">Bar Chart</option>
                  <option value="pie">Pie Chart</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        {forexProfitLoading ? (
          <div style={{ marginTop: '20px' }}>
            <Skeleton height={350} />
          </div>
        ) : (
          <>
            {forexChartType === 'line' && <ProfitChart data={forexProfitData} height={350} />}
            {forexChartType === 'bar' && <BarChart data={forexProfitData} height={350} />}
            {forexChartType === 'pie' && <PieChart data={forexPieTrades} height={350} />}
          </>
        )}
      </div>

      {/* Indian Market Profit Over Time */}
      <div className="chart-section profit-chart-section">
        <div className="chart-header">
          <div>
            <h2>Indian Market - Profit Over Time</h2>
            <p style={{ color: '#7f8c8d', fontSize: '14px', margin: '8px 0 0 0' }}>
              Track your daily, weekly, or monthly profit trends in the Indian stock market.
              Visualize performance with line charts for trends, bar charts for period comparisons,
              or pie charts to see your win/loss ratio.
            </p>
          </div>
          <div
            className="chart-controls"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ flex: '1 1 auto' }} />
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div className="filter-group" style={{ display: 'flex', alignItems: 'center' }}>
                <label style={{ marginRight: 8 }}>Period:</label>
                <select
                  value={indianProfitPeriod}
                  onChange={(e) => setIndianProfitPeriod(e.target.value)}
                  className="filter-select"
                >
                  <option value="days">Last 30 Days</option>
                  <option value="weeks">Last 12 Weeks</option>
                  <option value="months">Last 12 Months</option>
                  <option value="quarters">Last 8 Quarters</option>
                </select>
              </div>
              <div className="filter-group" style={{ display: 'flex', alignItems: 'center' }}>
                <label style={{ marginRight: 8 }}>Chart Type:</label>
                <select
                  value={indianChartType}
                  onChange={(e) => setIndianChartType(e.target.value)}
                  className="filter-select"
                >
                  <option value="line">Line Chart</option>
                  <option value="bar">Bar Chart</option>
                  <option value="pie">Pie Chart</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        {indianProfitLoading ? (
          <div style={{ marginTop: '20px' }}>
            <Skeleton height={350} />
          </div>
        ) : (
          <>
            {indianChartType === 'line' && <ProfitChart data={indianProfitData} height={350} />}
            {indianChartType === 'bar' && <BarChart data={indianProfitData} height={350} />}
            {indianChartType === 'pie' && <PieChart data={indianPieTrades} height={350} />}
          </>
        )}
      </div>

      {/* Overall Profit & Loss Chart */}
      <div className="chart-section profit-chart-section">
        <div className="chart-header">
          <div>
            <h2>Overall Profit & Loss</h2>
            <p style={{ color: '#7f8c8d', fontSize: '14px', margin: '8px 0 0 0' }}>
              Combined view of profit and loss across all markets and time periods. This chart
              displays both winning and losing trades side by side for comprehensive performance
              analysis.
            </p>
          </div>
        </div>
        <StockCombinedChart />
      </div>

      {/* Win/Loss Chart */}
      <div className="chart-section">
        <div className="chart-header">
          <div>
            <h2>Win/Loss Distribution</h2>
            <p style={{ color: '#7f8c8d', fontSize: '14px', margin: '8px 0 0 0' }}>
              Visual breakdown of your winning versus losing trades. This simple bar chart shows the
              proportion of successful trades compared to losses, helping you understand your
              overall win rate at a glance.
            </p>
          </div>
        </div>
        <div className="chart-container">
          <div className="bar-chart">
            <div className="bar-group">
              <div className="bar-label">Winning</div>
              <div className="bar-wrapper">
                <div
                  className="bar winning"
                  style={{
                    width: `${
                      stats.totalTrades > 0 ? (stats.winningTrades / stats.totalTrades) * 100 : 0
                    }%`,
                  }}
                >
                  <span className="bar-value">{stats.winningTrades}</span>
                </div>
              </div>
            </div>
            <div className="bar-group">
              <div className="bar-label">Losing</div>
              <div className="bar-wrapper">
                <div
                  className="bar losing"
                  style={{
                    width: `${
                      stats.totalTrades > 0 ? (stats.losingTrades / stats.totalTrades) * 100 : 0
                    }%`,
                  }}
                >
                  <span className="bar-value">{stats.losingTrades}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ErrorSnackbar
        open={snackbarOpen}
        message={snackbarMessage}
        severity={snackbarSeverity}
        onClose={() => setSnackbarOpen(false)}
      />

      <MaintenanceSnackbar
        open={maintenanceSnackbarOpen}
        maintenanceInfo={maintenanceInfo}
        onClose={() => setMaintenanceSnackbarOpen(false)}
      />
    </div>
  );
};

export default Dashboard;
