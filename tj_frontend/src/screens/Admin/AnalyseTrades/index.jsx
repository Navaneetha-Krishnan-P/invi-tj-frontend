// All admin API calls must be imported from '../../../services/api'.
// Remove all direct axios/fetch API calls from this file. Use adminAPI from api.js for all API requests.
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
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { IoArrowBack } from 'react-icons/io5';
import TraderMultiSelect from '../../../components/TraderMultiSelect';

const StyledTableCell = styled(TableCell)(() => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: '#345c90',
    color: '#ffffff',
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14,
  },
}));

const StyledTableRow = styled(TableRow)(() => ({
  '&:nth-of-type(odd)': {
    backgroundColor: 'rgb(237, 243, 255)',
    '& td:last-child': {
      backgroundColor: 'rgb(237, 243, 255)',
    }
  },
  '&:nth-of-type(even)': {
    backgroundColor: '#ffffff',
    '& td:last-child': {
      backgroundColor: '#ffffff',
    }
  },
  '&:last-child td, &:last-child th': {
    border: 0,
  },
}));

const AnalyseTrades = ({ onBack }) => {
  const [trades, setTrades] = useState([]);
  const [journals, setJournals] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [viewMode, setViewMode] = useState('trades');
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
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedRowId, setSelectedRowId] = useState(null);
  const [journalDialogOpen, setJournalDialogOpen] = useState(false);
  const [selectedJournal, setSelectedJournal] = useState(null);

  useEffect(() => {
    fetchUsers();
    fetchTrades();
    fetchJournals();
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
      const userIds =
        selectedUsers && selectedUsers.length > 0 ? selectedUsers.map((u) => u.user_id) : null;

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

  const fetchJournals = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const userIds =
        selectedUsers && selectedUsers.length > 0 ? selectedUsers.map((u) => u.user_id) : null;

      const data = await adminAPI.getAllJournals(userIds);
      if (data.success) {
        setJournals(data.journals || []);
      } else {
        throw new Error(data.error || 'Failed to fetch journals');
      }
    } catch (err) {
      console.error('Error fetching journals:', err);
      setSnackbarMessage('Failed to fetch journals');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const filteredTrades = trades.filter((trade) => {
    const matchesStatus =
      filter === 'all' ||
      (filter === 'profit' && Number(trade.profit_loss) > 0) ||
      (filter === 'loss' && Number(trade.profit_loss) < 0);

    const matchesMarket =
      marketFilter === 'all' || trade.market_type?.toUpperCase() === marketFilter.toUpperCase();

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

  const filteredJournals = journals.filter((journal) => {
    let matchesDate = true;
    if (fromDate) {
      const from = new Date(fromDate + 'T00:00:00');
      const journalDate = new Date(journal.journal_date);
      if (isFinite(from.getTime())) matchesDate = matchesDate && journalDate >= from;
    }
    if (toDate) {
      const to = new Date(toDate + 'T23:59:59');
      const journalDate = new Date(journal.journal_date);
      if (isFinite(to.getTime())) matchesDate = matchesDate && journalDate <= to;
    }
    return matchesDate;
  });

  const indexOfLastTrade = currentPage * tradesPerPage;
  const indexOfFirstTrade = indexOfLastTrade - tradesPerPage;
  const currentTrades = filteredTrades.slice(indexOfFirstTrade, indexOfLastTrade);
  const currentJournals = filteredJournals.slice(indexOfFirstTrade, indexOfLastTrade);

  const totalPages = viewMode === 'trades' 
    ? Math.ceil(filteredTrades.length / tradesPerPage)
    : Math.ceil(filteredJournals.length / tradesPerPage);

  const handlePageChange = (event, pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, marketFilter, fromDate, toDate, selectedUsers, viewMode]);

  const formatDateDDMMYYYY = (dateInput) => {
    if (!dateInput) return '';
    const d = new Date(dateInput);
    if (!isFinite(d.getTime())) return '';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`; // DD/MM/YYYY
  };

  // Handle menu open/close
  const handleMenuClick = (event, rowId) => {
    setAnchorEl(event.currentTarget);
    setSelectedRowId(rowId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedRowId(null);
  };

  // Handle view journal from menu
  const handleViewJournal = () => {
    const journal = currentJournals.find(j => j.id === selectedRowId);
    if (journal) {
      setSelectedJournal(journal);
      setJournalDialogOpen(true);
    }
    handleMenuClose();
  };

  return (
    <div className="trade-details-screen">
      <div className="screen-header responsive-header">
        <div className="header-title">
          <div className="header-icon" onClick={onBack}>
            <IoArrowBack size={24} color="#345c90" />
          </div>
          <h3>Analyse Trades</h3>
        </div>
        <div className="header-description">
          <span>
            Complete history of all your trades. Use the filters to analyse by trader, market, and
            result.
          </span>
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

      {/* Toggle between Trades and Journals */}
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'flex-start' }}>
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={(e, newValue) => {
            if (newValue !== null) {
              setViewMode(newValue);
            }
          }}
        >
          <ToggleButton 
            value="trades"
            sx={{ 
              px: 3,
              py: 1,
              fontSize: '0.9rem',
              '&.Mui-selected': {
                backgroundColor: '#345c90',
                color: 'white',
                '&:hover': {
                  backgroundColor: '#345c90',
                }
              }
            }}
          >
            Trades
          </ToggleButton>
          <ToggleButton 
            value="journals"
            sx={{ 
              px: 3,
              py: 1,
              fontSize: '0.9rem',
              '&.Mui-selected': {
                backgroundColor: '#345c90',
                color: 'white',
                '&:hover': {
                  backgroundColor: '#345c90',
                }
              }
            }}
          >
            Journals
          </ToggleButton>
        </ToggleButtonGroup>
      </div>

      {loading ? (
        <div className="loading-state">
          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 700 }}>
              <TableBody>
                {Array(5)
                  .fill(0)
                  .map((_, rowIndex) => (
                    <StyledTableRow key={rowIndex}>
                      {Array(11)
                        .fill(0)
                        .map((_, colIndex) => (
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
              <h2>{viewMode === 'trades' ? 'All Trades' : 'Trading Journals'}</h2>
              <div className="chart-controls">
                {viewMode === 'trades' && (
                  <>
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
                  </>
                )}
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
                      onClick={() => {
                        setFromDate('');
                        setToDate('');
                      }}
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {viewMode === 'trades' ? (
              currentTrades.length === 0 ? (
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
                            <span style={{ fontWeight: 600, color: '#345c90' }}>
                              {trade.user_name}
                            </span>
                            <span style={{ fontSize: '0.8rem', color: '#666' }}>
                              {trade.user_email}
                            </span>
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
                        <StyledTableCell>
                          {trade.market_type === 'INDIAN' ? '₹' : '$'}
                          {Number(trade.entry_price).toFixed(2)}
                        </StyledTableCell>
                        <StyledTableCell>
                          {trade.market_type === 'INDIAN' ? '₹' : '$'}
                          {trade.exit_price ? Number(trade.exit_price).toFixed(2) : 'N/A'}
                        </StyledTableCell>
                        <StyledTableCell
                          className={Number(trade.profit_loss) >= 0 ? 'profit' : 'loss'}
                          style={{
                            color: Number(trade.profit_loss) >= 0 ? '#2e7d32' : '#d32f2f',
                            fontWeight: 600,
                          }}
                        >
                          {Number(trade.profit_loss) >= 0 ? '+' : ''}
                          {trade.market_type === 'INDIAN' ? '₹' : '$'}
                          {Number(trade.profit_loss).toFixed(2)}
                        </StyledTableCell>
                        <StyledTableCell>{formatDateDDMMYYYY(trade.trade_date)}</StyledTableCell>
                      </StyledTableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              )
            ) : (
              currentJournals.length === 0 ? (
                <div className="empty-state">
                  <p>No journals found matching the selected filters</p>
                </div>
              ) : (
                <TableContainer component={Paper}>
                  <Table sx={{ minWidth: 700 }} aria-label="journals table">
                    <TableHead>
                      <TableRow>
                        <StyledTableCell>Trader Name</StyledTableCell>
                        <StyledTableCell>Date</StyledTableCell>
                        <StyledTableCell>Market</StyledTableCell>
                        <StyledTableCell>Type</StyledTableCell>
                        <StyledTableCell>Journal Entry</StyledTableCell>
                        <StyledTableCell align="center" sx={{ position: 'sticky', right: 0, backgroundColor: '#345c90', zIndex: 1 }}>Actions</StyledTableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {currentJournals.map((journal) => (
                        <StyledTableRow key={journal.id}>
                          <StyledTableCell>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontWeight: 600, color: '#345c90' }}>
                                {journal.user_name}
                              </span>
                              <span style={{ fontSize: '0.8rem', color: '#666' }}>
                                {journal.user_email}
                              </span>
                            </div>
                          </StyledTableCell>
                          <StyledTableCell>{formatDateDDMMYYYY(journal.journal_date)}</StyledTableCell>
                          <StyledTableCell>
                            {journal.market_type ? (
                              <span className={`market-badge ${journal.market_type?.toLowerCase()}`}>
                                {journal.market_type}
                              </span>
                            ) : (
                              <span style={{ color: '#999', fontSize: '0.85rem' }}>N/A</span>
                            )}
                          </StyledTableCell>
                          <StyledTableCell>
                            <span className={`market-badge ${journal.trade_type?.toLowerCase()}`}>
                              {journal.trade_type === 'NT' ? 'NO TRADE' : journal.trade_type}
                            </span>
                          </StyledTableCell>
                          <StyledTableCell className="journal-text-cell">
                            {journal.journal_text}
                          </StyledTableCell>
                          <StyledTableCell align="center" sx={{ position: 'sticky', right: 0, backgroundColor: 'inherit', zIndex: 1 }}>
                            <IconButton
                              onClick={(e) => handleMenuClick(e, journal.id)}
                              size="small"
                              sx={{ 
                                color: '#345c90',
                                padding: '4px',
                                '&:hover': {
                                  backgroundColor: 'rgba(52, 92, 144, 0.08)'
                                }
                              }}
                            >
                              <MoreVertIcon sx={{ fontSize: '18px' }} />
                            </IconButton>
                          </StyledTableCell>
                        </StyledTableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )
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

      {/* 3-Dot Menu Dropdown */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          elevation: 2,
          sx: {
            minWidth: '110px',
            borderRadius: '8px',
            mt: 0.5,
            '& .MuiMenuItem-root': {
              fontSize: '0.875rem',
              minHeight: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              '&:hover': {
                backgroundColor: 'rgba(52, 92, 144, 0.08)',
              },
            },
            '& .MuiListItemIcon-root': {
              minWidth: '28px',
              display: 'flex',
              justifyContent: 'center',
            },
            '& .MuiListItemText-root': {
              margin: 0,
            },
          },
        }}
      >
        <MenuItem onClick={handleViewJournal}>
          <ListItemIcon>
            <VisibilityIcon sx={{ fontSize: '18px', color: '#345c90' }} />
          </ListItemIcon>
          <ListItemText primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }}>View</ListItemText>
        </MenuItem>
      </Menu>

      {/* Journal View Dialog */}
      <Dialog
        open={journalDialogOpen}
        onClose={() => setJournalDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 2.5, 
          pt: 3,
          px: 3,
          fontSize: '1.25rem',
          fontWeight: 600,
          color: '#345c90',
          borderBottom: '1px solid #e0e0e0',
          mb: 2
        }}>
          Journal Entry - {selectedJournal && formatDateDDMMYYYY(selectedJournal.journal_date)}
          <span className={`market-badge ${selectedJournal?.trade_type?.toLowerCase()}`} style={{ marginLeft: '12px', fontSize: '0.85rem' }}>
            {selectedJournal?.trade_type === 'NT' ? 'NO TRADE' : selectedJournal?.trade_type}
          </span>
        </DialogTitle>
        <DialogContent sx={{ px: 3, py: 3, pt: 3, overflow: 'visible' }}>
          <div style={{ 
            whiteSpace: 'pre-wrap', 
            padding: '20px', 
            fontSize: '14px', 
            lineHeight: '1.8',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #e9ecef',
            minHeight: '150px',
            maxHeight: 'none',
            overflow: 'visible',
            wordWrap: 'break-word'
          }}>
            {selectedJournal?.journal_text}
          </div>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, pt: 2, gap: 1 }}>
          <Button 
            onClick={() => setJournalDialogOpen(false)} 
            variant="contained" 
            sx={{
              backgroundColor: '#345c90',
              textTransform: 'none',
              px: 3,
              py: 1,
              borderRadius: '6px',
              '&:hover': {
                backgroundColor: '#2a4a73'
              }
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default AnalyseTrades;
