import { useState, useEffect } from 'react';
import { dashboardAPI, adminAPI } from '../../../services/api';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import ErrorSnackbar from '../../../components/ErrorSnackbar';
import './style.css';
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
import { IoArrowBack } from "react-icons/io5";
import TraderMultiSelect from '../../../components/TraderMultiSelect';


const StyledTableCell = styled(TableCell)(() => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: '#345c90', 
    color: '#ffffff'
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

const AnalyseTrades = ({onBack}) => {
  const [trades, setTrades] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [filter, setFilter] = useState('all');
  const [marketFilter, setMarketFilter] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('error');
  const [currentPage, setCurrentPage] = useState(1);
  const tradesPerPage = 15;

  useEffect(() => {
    fetchUsers();
    fetchTrades();
  }, [selectedUsers]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const data = await adminAPI.getUsers();
      if (data.success) {
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const fetchTrades = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');

      if (!token) {
        const errorMsg = 'No authentication token found';
        setSnackbarMessage(errorMsg);
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        return;
      }

      // Support multi-user filter
      const userIds = selectedUsers && selectedUsers.length > 0 
        ? selectedUsers.map(u => u.id) 
        : null;

      const data = await adminAPI.getAllTrades(userIds);
      if (data.success) {
        setTrades(data.trades || []);
      } else {
        throw new Error(data.error || 'Failed to fetch trades');
      }
    } catch (err) {
      console.error('Error fetching trades:', err);
      const errorMsg = 'Oops! Something went wrong';
      setSnackbarMessage(errorMsg);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const filteredTrades = trades.filter(trade => {
    const matchesStatus = filter === 'all' || 
      (filter === 'profit' && Number(trade.profit_loss) > 0) ||
      (filter === 'loss' && Number(trade.profit_loss) < 0);

    const matchesMarket = marketFilter === 'all' || 
      trade.market_type?.toUpperCase() === marketFilter.toUpperCase();

    // Date filtering: default show all. If user sets from/to, apply them.
    let matchesDate = true;
    if (fromDate) {
      const from = new Date(fromDate + 'T00:00:00');
      const tradeDate = new Date(trade.trade_date);
      if (isFinite(from.getTime())) matchesDate = matchesDate && tradeDate >= from;
    }
    if (toDate) {
      const to = new Date(toDate + 'T23:59:59');
      const tradeDate = new Date(trade.trade_date);
      if (isFinite(to.getTime())) matchesDate = matchesDate && tradeDate <= to;
    }

    return matchesStatus && matchesMarket && matchesDate;
  });

  const indexOfLastTrade = currentPage * tradesPerPage;
  const indexOfFirstTrade = indexOfLastTrade - tradesPerPage;
  const currentTrades = filteredTrades.slice(indexOfFirstTrade, indexOfLastTrade);

  const totalPages = Math.ceil(filteredTrades.length / tradesPerPage);

  const handlePageChange = (event, pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, marketFilter, fromDate, toDate, selectedUsers]);

  const formatDateDDMMYYYY = (dateInput) => {
    if (!dateInput) return '';
    const d = new Date(dateInput);
    if (!isFinite(d.getTime())) return '';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`; // DD/MM/YYYY
  };

  return (
    <div className="trade-details-screen">
      <div className="screen-header responsive-header">
        <div className="header-title">
          <div className='header-icon' onClick={onBack}><IoArrowBack size={24} color='#345c90'/></div>
          <h3>Analyse Trades</h3>
        </div>
        <div className="header-description">
          <span>Complete history of all your trades. Use the filters to analyse by trader, market, and result.</span>
        </div>
        <div className="trader-multiselect-group">
          <TraderMultiSelect
            users={users}
            selectedUsers={selectedUsers}
            setSelectedUsers={setSelectedUsers}
            label="Trader Name"
            placeholder="Select traders"
          />
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 700 }}>
              <TableBody>
                {Array(5).fill(0).map((_, rowIndex) => (
                  <StyledTableRow key={rowIndex}>
                    {Array(11).fill(0).map((_, colIndex) => (
                      <StyledTableCell key={colIndex}>
                        <Skeleton height={20} />
                      </StyledTableCell>
                    ))}
                  </StyledTableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
      ) : (
        <>
          <div className="chart-section">
            <div className="chart-header">
              <h2>All Trades</h2>
              <div className="chart-controls">
                <div className="filter-group">
                  <label>Result:</label>
                  <select 
                    value={filter} 
                    onChange={(e) => setFilter(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">All Trades</option>
                    <option value="profit">Profitable</option>
                    <option value="loss">Loss</option>
                  </select>
                </div>
                <div className="filter-group">
                  <label>Market:</label>
                  <select 
                    value={marketFilter} 
                    onChange={(e) => setMarketFilter(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">All Markets</option>
                    <option value="forex">Forex</option>
                    <option value="indian">Indian</option>
                  </select>
                </div>
                <div className="filter-group">
                  <label>From :</label>
                  <div className="date-range-row">
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="filter-select"
                    />
                     <label>To :</label>
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="filter-select"
                    />
                    <button
                      type="button"
                      className="clear-filter-btn"
                      onClick={() => { setFromDate(''); setToDate(''); }}
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {currentTrades.length === 0 ? (
              <div className="empty-state">
                <p>No trades found matching the selected filters</p>
              </div>
            ) : (
              <TableContainer component={Paper}>
                <Table sx={{ minWidth: 700 }} aria-label="customized table">
                  <TableHead>
                    <TableRow>
                      <StyledTableCell>Trader Name</StyledTableCell>
                      <StyledTableCell>Market</StyledTableCell>
                      <StyledTableCell>Symbol</StyledTableCell>
                      <StyledTableCell>Type</StyledTableCell>
                      <StyledTableCell>Lot Size</StyledTableCell>
                      <StyledTableCell>Entry Price</StyledTableCell>
                      <StyledTableCell>Exit Price</StyledTableCell>
                      <StyledTableCell>P/L</StyledTableCell>
                      <StyledTableCell>Date</StyledTableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {currentTrades.map((trade) => (
                      <StyledTableRow key={trade.id}>
                        <StyledTableCell>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 600, color: '#345c90' }}>{trade.user_name}</span>
                            <span style={{ fontSize: '0.8rem', color: '#666' }}>{trade.user_email}</span>
                          </div>
                        </StyledTableCell>
                        <StyledTableCell>
                          <span className={`market-badge ${trade.market_type?.toLowerCase()}`}>
                            {trade.market_type}
                          </span>
                        </StyledTableCell>
                        <StyledTableCell>{trade.symbol}</StyledTableCell>
                        <StyledTableCell>{trade.trade_type}</StyledTableCell>
                        <StyledTableCell>{trade.lot_size}</StyledTableCell>
                        <StyledTableCell>{trade.market_type === 'INDIAN' ? '₹' : '$'}{Number(trade.entry_price).toFixed(2)}</StyledTableCell>
                        <StyledTableCell>{trade.market_type === 'INDIAN' ? '₹' : '$'}{trade.exit_price ? Number(trade.exit_price).toFixed(2) : 'N/A'}</StyledTableCell>
                        <StyledTableCell
                          className={Number(trade.profit_loss) >= 0 ? 'profit' : 'loss'}
                          style={{
                            color: Number(trade.profit_loss) >= 0 ? '#2e7d32' : '#d32f2f',
                            fontWeight: 600
                          }}
                        >
                          {Number(trade.profit_loss) >= 0 ? '+' : ''}{trade.market_type === 'INDIAN' ? '₹' : '$'}{Number(trade.profit_loss).toFixed(2)}
                        </StyledTableCell>
                        <StyledTableCell>{formatDateDDMMYYYY(trade.trade_date)}</StyledTableCell>
                      </StyledTableRow>
                    ))}
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
        </>
      )}
      
      <ErrorSnackbar
        open={snackbarOpen}
        message={snackbarMessage}
        severity={snackbarSeverity}
        onClose={() => setSnackbarOpen(false)}
      />
    </div>
  );
};

export default AnalyseTrades;
