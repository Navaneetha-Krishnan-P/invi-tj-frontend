import { useState, useEffect } from 'react';
import { dashboardAPI } from '../../services/api';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import ErrorSnackbar from '../../components/ErrorSnackbar';
import './TradeDetails.css';
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
import VisibilityIcon from '@mui/icons-material/Visibility';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';

const StyledTableCell = styled(TableCell)(() => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: '#345c90', 
    color: '#ffffff',
    fontSize: '0.813rem',
    fontWeight: 600
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: '0.8rem',
    fontWeight: 500
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

const TradeDetails = () => {
  const [trades, setTrades] = useState([]);
  const [journals, setJournals] = useState([]);
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
  const tradesPerPage = 10;
  const [journalDialogOpen, setJournalDialogOpen] = useState(false);
  const [selectedJournal, setSelectedJournal] = useState(null);
  
  // Menu state for dropdown
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedRowId, setSelectedRowId] = useState(null);
  
  // Edit dialog states
  const [editTradeDialogOpen, setEditTradeDialogOpen] = useState(false);
  const [editJournalDialogOpen, setEditJournalDialogOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState(null);
  const [editingJournal, setEditingJournal] = useState(null);

  useEffect(() => {
    fetchTrades();
    fetchJournals();
  }, []);

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

      // Fetch both INDIAN and FOREX trades
      const [indianData, forexData] = await Promise.all([
        dashboardAPI.getTrades('INDIAN', 100),
        dashboardAPI.getTrades('FOREX', 100)
      ]);
      
      // Combine both arrays
      const allTrades = [...(indianData.trades || []), ...(forexData.trades || [])];
      setTrades(allTrades);
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

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/journals`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch journals');
      
      const data = await response.json();
      setJournals(data.journals || []);
    } catch (err) {
      console.error('Error fetching journals:', err);
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

  const filteredJournals = journals.filter(journal => {
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
  }, [filter, marketFilter, fromDate, toDate, viewMode]);

  const formatDateDDMMYYYY = (dateInput) => {
    if (!dateInput) return '';
    const d = new Date(dateInput);
    if (!isFinite(d.getTime())) return '';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`; // DD/MM/YYYY
  };

  const formatDateForInput = (dateInput) => {
    if (!dateInput) return '';
    const d = new Date(dateInput);
    if (!isFinite(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`; // YYYY-MM-DD for input[type="date"]
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

  // Handle edit trade
  const handleEditTrade = () => {
    const trade = currentTrades.find(t => t.id === selectedRowId);
    if (trade) {
      setEditingTrade({
        ...trade,
        trade_date: formatDateForInput(trade.trade_date)
      });
      setEditTradeDialogOpen(true);
    }
    handleMenuClose();
  };

  // Handle edit journal
  const handleEditJournal = () => {
    const journal = currentJournals.find(j => j.id === selectedRowId);
    if (journal) {
      setEditingJournal({
        ...journal,
        journal_date: formatDateForInput(journal.journal_date)
      });
      setEditJournalDialogOpen(true);
    }
    handleMenuClose();
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

  // Save edited trade
  const handleSaveEditedTrade = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setSnackbarMessage('No authentication token found');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/trades/${editingTrade.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editingTrade)
      });

      if (!response.ok) throw new Error('Failed to update trade');

      setSnackbarMessage('Trade updated successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      setEditTradeDialogOpen(false);
      setEditingTrade(null);
      fetchTrades();
    } catch (err) {
      console.error('Error updating trade:', err);
      setSnackbarMessage('Failed to update trade');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  // Save edited journal
  const handleSaveEditedJournal = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setSnackbarMessage('No authentication token found');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/journals/${editingJournal.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editingJournal)
      });

      if (!response.ok) throw new Error('Failed to update journal');

      setSnackbarMessage('Journal updated successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      setEditJournalDialogOpen(false);
      setEditingJournal(null);
      fetchJournals();
    } catch (err) {
      console.error('Error updating journal:', err);
      setSnackbarMessage('Failed to update journal');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  return (
    <div className="trade-details-screen">
      <div className="screen-header">
        <h2>Trade Details</h2>
        <p>Complete history of all your trades and journals</p>
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
                      onClick={() => { setFromDate(''); setToDate(''); }}
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
                <TableContainer component={Paper} sx={{ maxWidth: '100%', overflowX: 'auto' }}>
                  <Table sx={{ minWidth: 700 }} aria-label="customized table">
                    <TableHead>
                      <TableRow>
                        <StyledTableCell>Market</StyledTableCell>
                        <StyledTableCell>Symbol</StyledTableCell>
                        <StyledTableCell>Type</StyledTableCell>
                        <StyledTableCell>Lot Size</StyledTableCell>
                        <StyledTableCell>Entry Price</StyledTableCell>
                        <StyledTableCell>Exit Price</StyledTableCell>
                        <StyledTableCell>P/L</StyledTableCell>
                        <StyledTableCell>Date</StyledTableCell>
                        <StyledTableCell align="center" sx={{ position: 'sticky', right: 0, backgroundColor: '#345c90', zIndex: 1 }}>Actions</StyledTableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {currentTrades.map((trade) => (
                        <StyledTableRow key={trade.id}>
                          <StyledTableCell>
                            <span className={`market-badge ${trade.market_type?.toLowerCase()}`}>
                              {trade.market_type}
                            </span>
                          </StyledTableCell>
                          <StyledTableCell>
                            {trade.trade_type === 'NT' ? 'N/A' : trade.symbol}
                          </StyledTableCell>
                          <StyledTableCell>
                            {trade.trade_type === 'NT' ? (
                              <span className="market-badge nt">NO TRADE</span>
                            ) : (
                              trade.trade_type
                            )}
                          </StyledTableCell>
                          <StyledTableCell>{trade.lot_size}</StyledTableCell>
                          <StyledTableCell>{trade.market_type === 'INDIAN' ? '₹' : '$'}{Number(trade.entry_price).toFixed(2)}</StyledTableCell>
                          <StyledTableCell>{trade.market_type === 'INDIAN' ? '₹' : '$'}{trade.exit_price ? Number(trade.exit_price).toFixed(2) : 'N/A'}</StyledTableCell>
                          <StyledTableCell className={Number(trade.profit_loss) >= 0 ? 'profit' : 'loss'}>
                            {Number(trade.profit_loss) >= 0 ? '+' : ''}{trade.market_type === 'INDIAN' ? '₹' : '$'}{Number(trade.profit_loss).toFixed(2)}
                          </StyledTableCell>
                          <StyledTableCell>{formatDateDDMMYYYY(trade.trade_date)}</StyledTableCell>
                          <StyledTableCell align="center" sx={{ position: 'sticky', right: 0, backgroundColor: 'inherit', zIndex: 1 }}>
                            <IconButton
                              onClick={(e) => handleMenuClick(e, trade.id)}
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
                        <StyledTableCell>Date</StyledTableCell>
                        <StyledTableCell>Market</StyledTableCell>
                        <StyledTableCell>Type</StyledTableCell>
                        <StyledTableCell>Journal Entry</StyledTableCell>
                        <StyledTableCell align="center" sx={{ position: 'sticky', right: 0, backgroundColor: '#345c90', zIndex: 1 }}>Action</StyledTableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {currentJournals.map((journal) => (
                        <StyledTableRow key={journal.id}>
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
        {viewMode === 'trades' ? (
          <MenuItem onClick={handleEditTrade}>
            <ListItemIcon>
              <EditIcon sx={{ fontSize: '18px', color: '#345c90' }} />
            </ListItemIcon>
            <ListItemText primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }}>Edit</ListItemText>
          </MenuItem>
        ) : (
          [
            <MenuItem key="view" onClick={handleViewJournal}>
              <ListItemIcon>
                <VisibilityIcon sx={{ fontSize: '18px', color: '#345c90' }} />
              </ListItemIcon>
              <ListItemText primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }}>View</ListItemText>
            </MenuItem>,
            <MenuItem key="edit" onClick={handleEditJournal}>
              <ListItemIcon>
                <EditIcon sx={{ fontSize: '18px', color: '#345c90' }} />
              </ListItemIcon>
              <ListItemText primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }}>Edit</ListItemText>
            </MenuItem>
          ]
        )}
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

      {/* Edit Trade Dialog */}
      <Dialog
        open={editTradeDialogOpen}
        onClose={() => {
          setEditTradeDialogOpen(false);
          setEditingTrade(null);
        }}
        maxWidth="sm"
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
          Edit Trade
        </DialogTitle>
        <DialogContent sx={{ px: 3, py: 3, pt: 3 }}>
          {editingTrade && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingTop: '8px' }}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ fontSize: '0.875rem' }}>Market Type</InputLabel>
                <Select
                  value={editingTrade.market_type || ''}
                  label="Market Type"
                  onChange={(e) => setEditingTrade({ ...editingTrade, market_type: e.target.value })}
                  sx={{ borderRadius: '8px', fontSize: '0.875rem' }}
                >
                  <MenuItem value="FOREX" sx={{ fontSize: '0.875rem' }}>FOREX</MenuItem>
                  <MenuItem value="INDIAN" sx={{ fontSize: '0.875rem' }}>INDIAN</MenuItem>
                </Select>
              </FormControl>

              <TextField
                label="Symbol"
                value={editingTrade.symbol || ''}
                onChange={(e) => setEditingTrade({ ...editingTrade, symbol: e.target.value })}
                fullWidth
                size="small"
                disabled={editingTrade.trade_type === 'NT'}
                InputLabelProps={{ sx: { fontSize: '0.875rem' } }}
                inputProps={{ style: { fontSize: '0.875rem' } }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
              />

              <FormControl fullWidth size="small">
                <InputLabel sx={{ fontSize: '0.875rem' }}>Trade Type</InputLabel>
                <Select
                  value={editingTrade.trade_type || ''}
                  label="Trade Type"
                  onChange={(e) => setEditingTrade({ ...editingTrade, trade_type: e.target.value })}
                  sx={{ borderRadius: '8px', fontSize: '0.875rem' }}
                >
                  <MenuItem value="BUY" sx={{ fontSize: '0.875rem' }}>BUY</MenuItem>
                  <MenuItem value="SELL" sx={{ fontSize: '0.875rem' }}>SELL</MenuItem>
                </Select>
              </FormControl>

              <TextField
                label="Lot Size"
                type="number"
                value={editingTrade.lot_size || ''}
                onChange={(e) => setEditingTrade({ ...editingTrade, lot_size: e.target.value })}
                fullWidth
                size="small"
                InputLabelProps={{ sx: { fontSize: '0.875rem' } }}
                inputProps={{ style: { fontSize: '0.875rem' } }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
              />

              <TextField
                label="Entry Price"
                type="number"
                value={editingTrade.entry_price || ''}
                onChange={(e) => setEditingTrade({ ...editingTrade, entry_price: e.target.value })}
                fullWidth
                size="small"
                InputLabelProps={{ sx: { fontSize: '0.875rem' } }}
                inputProps={{ style: { fontSize: '0.875rem' } }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
              />

              <TextField
                label="Exit Price"
                type="number"
                value={editingTrade.exit_price || ''}
                onChange={(e) => setEditingTrade({ ...editingTrade, exit_price: e.target.value })}
                fullWidth
                size="small"
                InputLabelProps={{ sx: { fontSize: '0.875rem' } }}
                inputProps={{ style: { fontSize: '0.875rem' } }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
              />

              <TextField
                label="Profit/Loss"
                type="number"
                value={editingTrade.profit_loss || ''}
                onChange={(e) => setEditingTrade({ ...editingTrade, profit_loss: e.target.value })}
                fullWidth
                size="small"
                InputLabelProps={{ sx: { fontSize: '0.875rem' } }}
                inputProps={{ style: { fontSize: '0.875rem' } }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
              />

              <TextField
                label="Trade Date"
                type="date"
                value={editingTrade.trade_date || ''}
                onChange={(e) => setEditingTrade({ ...editingTrade, trade_date: e.target.value })}
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true, sx: { fontSize: '0.875rem' } }}
                inputProps={{ style: { fontSize: '0.875rem' } }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
              />
            </div>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, pt: 2, gap: 1.5 }}>
          <Button 
            onClick={() => {
              setEditTradeDialogOpen(false);
              setEditingTrade(null);
            }}
            variant="outlined"
            sx={{
              textTransform: 'none',
              px: 3,
              py: 1,
              borderRadius: '6px',
              color: '#666',
              borderColor: '#d0d0d0',
              '&:hover': {
                backgroundColor: '#f5f5f5',
                borderColor: '#999'
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSaveEditedTrade} 
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
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Journal Dialog */}
      <Dialog
        open={editJournalDialogOpen}
        onClose={() => {
          setEditJournalDialogOpen(false);
          setEditingJournal(null);
        }}
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
          Edit Journal Entry
        </DialogTitle>
        <DialogContent sx={{ px: 3, py: 3, pt: 3 }}>
          {editingJournal && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingTop: '8px' }}>
              <TextField
                label="Journal Date"
                type="date"
                value={editingJournal.journal_date || ''}
                onChange={(e) => setEditingJournal({ ...editingJournal, journal_date: e.target.value })}
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true, sx: { fontSize: '0.875rem' } }}
                inputProps={{ style: { fontSize: '0.875rem' } }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
              />

              <FormControl fullWidth size="small">
                <InputLabel sx={{ fontSize: '0.875rem' }}>Market Type</InputLabel>
                <Select
                  value={editingJournal.market_type || ''}
                  label="Market Type"
                  onChange={(e) => setEditingJournal({ ...editingJournal, market_type: e.target.value })}
                  sx={{ borderRadius: '8px', fontSize: '0.875rem' }}
                >
                  <MenuItem value="FOREX" sx={{ fontSize: '0.875rem' }}>FOREX</MenuItem>
                  <MenuItem value="INDIAN" sx={{ fontSize: '0.875rem' }}>INDIAN</MenuItem>
                </Select>
              </FormControl>

              <TextField
                label="Type"
                value={editingJournal.trade_type === 'NT' ? 'No Trade' : 'Trade'}
                fullWidth
                size="small"
                disabled
                InputLabelProps={{ sx: { fontSize: '0.875rem' } }}
                inputProps={{ style: { fontSize: '0.875rem' } }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
              />

              <TextField
                label="Journal Entry"
                value={editingJournal.journal_text || ''}
                onChange={(e) => setEditingJournal({ ...editingJournal, journal_text: e.target.value })}
                fullWidth
                multiline
                rows={8}
                placeholder="Write your trading journal entry here..."
                InputLabelProps={{ sx: { fontSize: '0.875rem' } }}
                inputProps={{ style: { fontSize: '0.875rem' } }}
                sx={{ 
                  '& .MuiOutlinedInput-root': { 
                    borderRadius: '8px',
                    backgroundColor: '#f8f9fa',
                    '&:hover': {
                      backgroundColor: '#ffffff'
                    },
                    '&.Mui-focused': {
                      backgroundColor: '#ffffff'
                    }
                  }
                }}
              />
            </div>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, pt: 2, gap: 1.5 }}>
          <Button 
            onClick={() => {
              setEditJournalDialogOpen(false);
              setEditingJournal(null);
            }}
            variant="outlined"
            sx={{
              textTransform: 'none',
              px: 3,
              py: 1,
              borderRadius: '6px',
              color: '#666',
              borderColor: '#d0d0d0',
              '&:hover': {
                backgroundColor: '#f5f5f5',
                borderColor: '#999'
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSaveEditedJournal} 
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
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default TradeDetails;
