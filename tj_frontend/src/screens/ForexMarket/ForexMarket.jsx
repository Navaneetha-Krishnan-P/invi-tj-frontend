import { useState, useRef } from 'react';
import { tradeAPI, imageAPI } from '../../services/api';
import ErrorSnackbar from '../../components/ErrorSnackbar';
import StyledTextField from '../../components/StyledTextField';
import './ForexMarket.css';
import { FaEdit } from 'react-icons/fa';
import { CgCloseR } from 'react-icons/cg';
import {
  MenuItem,
  Button,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Typography,
  FormControlLabel,
  Radio,
  RadioGroup,
  FormControl,
  FormLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';

const ForexMarket = () => {
  const fileInputRef = useRef(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('error');
  const [trades, setTrades] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [isTradeDay, setIsTradeDay] = useState(true);
  const [tradingJournal, setTradingJournal] = useState('');
  const [ntConflictDates, setNtConflictDates] = useState([]);
  const [showNTDialog, setShowNTDialog] = useState(false);
  const [pendingPayload, setPendingPayload] = useState(null);

  // Form fields for manual trade entry
  const [formData, setFormData] = useState({
    symbol: '',
    trade_type: '',
    lot_size: '',
    entry_price: '',
    exit_price: '',
    trade_date: '',
    profit_loss: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddTrade = (e) => {
    e.preventDefault();
    setSnackbarOpen(false);

    const trade = {
      user_id: localStorage.getItem('userId'),
      market_type: 'FOREX',
      symbol: formData.symbol.toUpperCase(),
      trade_type: formData.trade_type,
      lot_size: parseInt(formData.lot_size) || 1,
      entry_price: parseFloat(formData.entry_price) || 0,
      exit_price: formData.exit_price ? parseFloat(formData.exit_price) : null,
      profit_loss: parseFloat(formData.profit_loss) || 0,
      trade_date: formData.trade_date || new Date().toISOString().split('T')[0],
    };

    if (editingIndex !== null) {
      // Update existing trade
      const updatedTrades = [...trades];
      updatedTrades[editingIndex] = trade;
      setTrades(updatedTrades);
      const successMsg = `Trade updated! Total trades: ${trades.length}`;
      setSnackbarMessage(successMsg);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      setEditingIndex(null);
    } else {
      // Add new trade
      setTrades([...trades, trade]);
      const successMsg = `Trade added! Total trades: ${trades.length + 1}`;
      setSnackbarMessage(successMsg);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    }

    // Reset form
    setFormData({
      symbol: '',
      trade_type: 'BUY',
      lot_size: '',
      entry_price: '',
      exit_price: '',
      trade_date: '',
      profit_loss: '',
    });
  };

  const handleEditTrade = (index) => {
    const trade = trades[index];
    const isoDate = trade.trade_date ? trade.trade_date.split('T')[0] : '';

    setFormData({
      symbol: trade.symbol,
      trade_type: trade.trade_type,
      lot_size: trade.lot_size.toString(),
      entry_price: trade.entry_price.toString(),
      exit_price: trade.exit_price ? trade.exit_price.toString() : '',
      trade_date: isoDate,
      profit_loss: trade.profit_loss.toString(),
    });
    setEditingIndex(index);
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setFormData({
      symbol: '',
      trade_type: 'BUY',
      lot_size: '',
      entry_price: '',
      exit_price: '',
      trade_date: '',
      profit_loss: '',
    });
  };

  const handleSaveAllTrades = async () => {
    // Validate journal is filled
    if (!tradingJournal.trim()) {
      const errorMsg = 'Trading journal is required. Please write your journal entry before saving.';
      setSnackbarMessage(errorMsg);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    // If No Trade day, must have date
    if (!isTradeDay && !formData.trade_date) {
      const errorMsg = 'Please select a date for your journal entry.';
      setSnackbarMessage(errorMsg);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    // If Trade day, must have at least one trade
    if (isTradeDay && trades.length === 0) {
      const errorMsg = 'No trades to save. Please add at least one trade or select "No Trade".';
      setSnackbarMessage(errorMsg);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    setIsProcessing(true);
    try {
      // Collect all unique dates from trades list
      const uniqueTradeDates = isTradeDay && trades.length > 0 
        ? [...new Set(trades.map(t => t.trade_date.split('T')[0]))]
        : [];

      // Prepare payload - create journal entries for each unique trade date
      const payload = {
        trades: isTradeDay ? trades : [],
        journals: isTradeDay 
          ? uniqueTradeDates.map(date => ({
              user_id: localStorage.getItem('userId'),
              journal_date: date,
              journal_text: tradingJournal,
              trade_type: 'TRADE',
              market_type: 'FOREX'
            }))
          : [{
              user_id: localStorage.getItem('userId'),
              journal_date: formData.trade_date || new Date().toISOString().split('T')[0],
              journal_text: tradingJournal,
              trade_type: 'NT',
              market_type: 'FOREX'
            }]
      };

      // If Trade day, check for NT conflicts on all unique dates
      if (isTradeDay && trades.length > 0) {
        const checkResult = await tradeAPI.checkNTConflict(uniqueTradeDates, 'FOREX');
        
        if (checkResult.hasConflict && checkResult.ntDates.length > 0) {
          // Normalize dates to YYYY-MM-DD format
          const normalizedNtDates = checkResult.ntDates.map(d => {
            const dateStr = typeof d === 'string' ? d : new Date(d).toISOString();
            return dateStr.split('T')[0];
          });
                    
          // Show conflict dialog with ALL conflicting dates
          setNtConflictDates(normalizedNtDates);
          setPendingPayload(payload);
          setShowNTDialog(true);
          setIsProcessing(false);
          return;
        }
      }

      const data = await tradeAPI.saveTrades(payload);

      if (data.success) {
        const successMsg = isTradeDay 
          ? `Successfully saved ${trades.length} trade(s) and journal entry!` 
          : 'Successfully saved No Trade journal entry!';
        setSnackbarMessage(successMsg);
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        setTrades([]);
        setTradingJournal('');
        setFormData({
          symbol: '',
          trade_type: 'BUY',
          lot_size: '',
          entry_price: '',
          exit_price: '',
          trade_date: '',
          profit_loss: '',
        });
      } else {
        const errorMsg = data.error || 'Failed to save trades';
        setSnackbarMessage(errorMsg);
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    } catch (err) {
      console.error('Save trades error:', err);
      const errorMsg = 'Oops! Something went wrong';
      setSnackbarMessage(errorMsg);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteNT = async (date) => {
    try {
      // Ensure date is in YYYY-MM-DD format
      const dateStr = typeof date === 'string' ? date.split('T')[0] : new Date(date).toISOString().split('T')[0];      
      const result = await tradeAPI.deleteNTEntry(dateStr, 'FOREX');      
      setNtConflictDates(prev => prev.filter(d => {
        const dStr = typeof d === 'string' ? d.split('T')[0] : new Date(d).toISOString().split('T')[0];
        return dStr !== dateStr;
      }));
      
      setSnackbarMessage(`NT entry deleted for ${new Date(dateStr).toLocaleDateString()}`);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Delete NT error:', error);
      setSnackbarMessage('Failed to delete NT entry');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleProceedAfterNTDeletion = async () => {
    if (ntConflictDates.length > 0) {
      setSnackbarMessage('Please delete all NT entries before proceeding');
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
      return;
    }

    // Close dialog and save
    setShowNTDialog(false);
    setIsProcessing(true);

    try {
      const data = await tradeAPI.saveTrades(pendingPayload);

      if (data.success) {
        const successMsg = `Successfully saved ${pendingPayload.trades.length} trade(s) and journal entry!`;
        setSnackbarMessage(successMsg);
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        setTrades([]);
        setTradingJournal('');
        setFormData({
          symbol: '',
          trade_type: 'BUY',
          lot_size: '',
          entry_price: '',
          exit_price: '',
          trade_date: '',
          profit_loss: '',
        });
        setPendingPayload(null);
      } else {
        const errorMsg = data.error || 'Failed to save trades';
        setSnackbarMessage(errorMsg);
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    } catch (err) {
      console.error('Save trades error:', err);
      setSnackbarMessage('Oops! Something went wrong');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveTrade = (index) => {
    setTrades(trades.filter((_, i) => i !== index));
    if (editingIndex === index) {
      handleCancelEdit();
    } else if (editingIndex > index) {
      setEditingIndex(editingIndex - 1);
    }
    const successMsg = `Trade removed. Total trades: ${trades.length - 1}`;
    setSnackbarMessage(successMsg);
    setSnackbarSeverity('success');
    setSnackbarOpen(true);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type (images only)
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp'];
    if (!validTypes.includes(file.type)) {
      setSnackbarMessage('Please upload a valid image file (PNG, JPG, JPEG, GIF, BMP)');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setSnackbarMessage('File size should be less than 5MB');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setSelectedImage(file);
  };

  const processImage = async () => {
    if (!selectedImage) {
      setSnackbarMessage('Please select an image first');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    setIsProcessing(true);

    try {
      const data = await imageAPI.processImage(selectedImage);

      // Check if the response contains trades array
      if (data.trades && Array.isArray(data.trades) && data.trades.length > 0) {
        // Validate each trade for missing or invalid data
        const validTrades = [];
        const invalidTrades = [];

        data.trades.forEach((trade, index) => {
          const missingFields = [];

          // Check for missing or invalid required fields
          if (!trade.symbol || trade.symbol === '' || trade.symbol === null)
            missingFields.push('symbol');
          if (!trade.type || trade.type === '' || trade.type === null) missingFields.push('type');
          if (trade.lot === null || trade.lot === undefined || isNaN(parseFloat(trade.lot)))
            missingFields.push('lot');
          if (
            trade.price_in === null ||
            trade.price_in === undefined ||
            isNaN(parseFloat(trade.price_in))
          )
            missingFields.push('entry price');
          if (
            trade.price_out === null ||
            trade.price_out === undefined ||
            isNaN(parseFloat(trade.price_out))
          )
            missingFields.push('exit price');
          if (
            trade.profit === null ||
            trade.profit === undefined ||
            isNaN(parseFloat(trade.profit))
          )
            missingFields.push('profit');

          if (missingFields.length > 0) {
            invalidTrades.push({ index: index + 1, fields: missingFields });
          } else {
            // Parse datetime format "2025.12.08  12:31:11" to "2025-12-08"
            let dateOnly = '';
            if (trade.datetime) {
              const datePart = trade.datetime.split(' ')[0]; // Get "2025.12.08"
              dateOnly = datePart.replace(/\./g, '-'); // Convert to "2025-12-08"
            } else {
              dateOnly = new Date().toISOString().split('T')[0];
            }

            validTrades.push({
              user_id: localStorage.getItem('userId'),
              market_type: 'FOREX',
              symbol: trade.symbol.toUpperCase(),
              trade_type: trade.type.toUpperCase(),
              lot_size: parseFloat(trade.lot),
              entry_price: parseFloat(trade.price_in),
              exit_price: parseFloat(trade.price_out),
              profit_loss: parseFloat(trade.profit),
              trade_date: dateOnly,
            });
          }
        });

        if (invalidTrades.length > 0) {
          const errorDetails = invalidTrades
            .map((t) => `Trade ${t.index}: missing ${t.fields.join(', ')}`)
            .join('; ');
          const errorMsg = `Image quality issue! ${invalidTrades.length} trade(s) have missing data (${errorDetails}). Please upload a clear image or enter trades manually.`;
          setSnackbarMessage(errorMsg);
          setSnackbarSeverity('error');
          setSnackbarOpen(true);

          // Still add valid trades if any exist
          if (validTrades.length > 0) {
            setTrades([...trades, ...validTrades]);
            setTimeout(() => {
              const successMsg = `${validTrades.length} valid trade(s) were extracted. Please add the ${invalidTrades.length} incomplete trade(s) manually.`;
              setSnackbarMessage(successMsg);
              setSnackbarSeverity('success');
              setSnackbarOpen(true);
            }, 4000);
          }
        } else {
          // All trades are valid
          setTrades([...trades, ...validTrades]);
          const successMsg = `Successfully extracted ${validTrades.length} trade(s) from image! Review and edit if needed, then save.`;
          setSnackbarMessage(successMsg);
          setSnackbarSeverity('success');
          setSnackbarOpen(true);
        }
      } else {
        // No trades array found
        const errorMsg =
          'Unable to extract trade data from image. Please upload a clear image or enter trades manually.';
        setSnackbarMessage(errorMsg);
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }

      setSelectedImage(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      console.error('Image processing error:', err);
      setSnackbarMessage(
        'Unable to process image. Please upload a clear image or manually enter the trade data.'
      );
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="forex-market-screen">
      <div className="screen-header">
        <h2>Trade Entry</h2>
        <p>Manually enter your trade data or upload trade screenshot</p>
      </div>

      <div className="trade-entry-container">
        {/* Manual Trade Entry Form */}
        <div className="manual-entry-section">
          <h3>{editingIndex !== null ? 'Edit Trade' : 'Add Trade'}</h3>
          <br />
          
          {/* Trade/No Trade Selection */}
          <ToggleButtonGroup
            value={isTradeDay ? 'trade' : 'no-trade'}
            exclusive
            onChange={(e, newValue) => {
              if (newValue !== null) {
                setIsTradeDay(newValue === 'trade');
              }
            }}
            sx={{ mb: 3 }}
          >
            <ToggleButton 
              value="trade" 
              sx={{ 
                px: 2,
                py: 1,
                fontSize: '0.8rem',
                '&.Mui-selected': {
                  backgroundColor: '#345c90',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: '#345c90',
                  }
                }
              }}
            >
              Trade
            </ToggleButton>
            <ToggleButton 
              value="no-trade" 
              sx={{ 
                px: 2,
                py: 1,
                fontSize: '0.8rem',
                '&.Mui-selected': {
                  backgroundColor: '#345c90',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: '#345c90',
                  }
                }
              }}
            >
              No Trade
            </ToggleButton>
          </ToggleButtonGroup>

          {editingIndex !== null && (
            <Button variant="outlined" color="error" onClick={handleCancelEdit} sx={{ mb: 4 }}>
              Cancel Edit
            </Button>
          )}

          {/* Image Upload Feature - Optional - Only show for Trade days */}
          {isTradeDay && (
            <div className="image-upload-feature">
              <p className="feature-description">
                Upload a trade screenshot to auto-fill the form below. If any details are incorrect,
                you can manually edit them before saving.
              </p>
              <label className="upload-label-compact">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
                <div className="upload-box-compact">
                  {selectedImage ? (
                    <>
                      <span className="file-icon">📄</span>
                      <span className="file-name">{selectedImage.name}</span>
                    </>
                  ) : (
                    <>
                      <span className="upload-icon-small">📸</span>
                      <span>Click to upload screenshot</span>
                    </>
                  )}
                </div>
              </label>

              {selectedImage && (
                <Button
                  variant="contained"
                  onClick={processImage}
                  disabled={isProcessing}
                  sx={{ mt: 1 }}
                >
                  {isProcessing ? '⏳ Processing...' : '✨ Auto-Fill Form'}
                </Button>
              )}
            </div>
          )}

          <form onSubmit={handleAddTrade}>
            {isTradeDay && (
              <>
                <div style={{ display: 'flex', gap: '25px', marginBottom: '25px' }}>
                  <StyledTextField
                    label="Symbol"
                    name="symbol"
                    value={formData.symbol}
                    onChange={handleInputChange}
                    placeholder="e.g., GOLD, EURUSD"
                    required={isTradeDay}
                    disabled={!isTradeDay}
                  />

                  <StyledTextField
                    select
                    label="Trade Type"
                    name="trade_type"
                    value={formData.trade_type}
                    onChange={handleInputChange}
                    required={isTradeDay}
                    disabled={!isTradeDay}
                  >
                    <MenuItem value="BUY">Buy</MenuItem>
                    <MenuItem value="SELL">Sell</MenuItem>
                  </StyledTextField>
                </div>

                <div style={{ display: 'flex', gap: '25px', marginBottom: '25px' }}>
                  <StyledTextField
                    label="Entry Price"
                    name="entry_price"
                    type="number"
                    value={formData.entry_price}
                    onChange={handleInputChange}
                    placeholder="4207.84"
                    inputProps={{ step: '0.01' }}
                    required={isTradeDay}
                    disabled={!isTradeDay}
                  />

                  <StyledTextField
                    label="Exit Price"
                    name="exit_price"
                    type="number"
                    value={formData.exit_price}
                    onChange={handleInputChange}
                    placeholder="4201.61"
                    inputProps={{ step: '0.01' }}
                    required={isTradeDay}
                    disabled={!isTradeDay}
                  />
                </div>

                <div style={{ display: 'flex', gap: '25px', marginBottom: '25px' }}>
                  <StyledTextField
                    label="Lot Size"
                    name="lot_size"
                    type="number"
                    value={formData.lot_size}
                    onChange={handleInputChange}
                    placeholder="1"
                    inputProps={{ step: '1' }}
                    required={isTradeDay}
                    disabled={!isTradeDay}
                  />

                  <StyledTextField
                    label="Profit/Loss"
                    name="profit_loss"
                    type="number"
                    value={formData.profit_loss}
                    onChange={handleInputChange}
                    placeholder="155.75"
                    inputProps={{ step: '0.01' }}
                    required={isTradeDay}
                    disabled={!isTradeDay}
                  />
                </div>
              </>
            )}

            <div style={{ display: 'flex', gap: '25px', marginBottom: '25px' }}>
              <StyledTextField
                label="Date"
                name="trade_date"
                type="date"
                value={formData.trade_date}
                onChange={handleInputChange}
                required
                InputLabelProps={{ shrink: true }}
              />
            </div>

            {isTradeDay && (
              <>
                <div style={{ marginBottom: '10px' }}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    fullWidth
                    sx={{ mb: 1, backgroundColor: '#345c90' }}
                  >
                    {editingIndex !== null ? 'Update Trade' : 'Add Trade'}
                  </Button>
                </div>
              </>
            )}
          </form>
        </div>

        {/* Added Trades List */}
        <div className="trades-preview-section">
          <h3>Trades to be Saved ({trades.length})</h3>
          {trades.length === 0 ? (
            <div className="empty-trades-message">
              <p>No trades added yet. {isTradeDay ? 'Fill the form and click "Add Trade".' : ''}</p>
            </div>
          ) : (
            <div className="trades-preview-list">
              {trades.map((trade, index) => (
                <Card
                  key={index}
                  sx={{
                    mb: 1.5,
                    border: editingIndex === index ? '2px solid #1976d2' : '1px solid #e1e8ed',
                    backgroundColor: editingIndex === index ? 'whitesmoke' : 'rgb(237, 243, 255)',
                    boxShadow: 'none',
                  }}
                >
                  <CardContent sx={{ p: 1.2, '&:last-child': { pb: 1.2 } }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '12px',
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '4px',
                          }}
                        >
                          <Typography
                            variant="subtitle1"
                            component="span"
                            color="primary"
                            sx={{ fontWeight: 600 }}
                          >
                            #{index + 1}
                          </Typography>
                          <Typography variant="body2" fontWeight="600">
                            {trade.symbol} - {trade.trade_type}
                          </Typography>
                        </div>
                        <div
                          style={{ display: 'flex', gap: '16px', rowGap: '5px', flexWrap: 'wrap' }}
                        >
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ fontSize: '0.8rem' }}
                          >
                            Lot: {trade.lot_size}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ fontSize: '0.8rem' }}
                          >
                            Entry: ${trade.entry_price}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ fontSize: '0.8rem' }}
                          >
                            Exit: ${trade.exit_price || 'N/A'}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              color: trade.profit_loss >= 0 ? '#27ae60' : '#e74c3c',
                              fontWeight: 'bold',
                              fontSize: '0.85rem',
                            }}
                          >
                            P/L: ${trade.profit_loss.toFixed(2)}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ fontSize: '0.75rem' }}
                          >
                            {(() => {
                              // Parse date string directly to avoid timezone issues
                              const dateStr = trade.trade_date.split('T')[0]; // Get YYYY-MM-DD part
                              const [year, month, day] = dateStr.split('-');
                              return `${day}/${month}/${year}`;
                            })()}
                          </Typography>
                        </div>
                      </div>
                      <div>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleEditTrade(index)}
                          title="Edit trade"
                        >
                          <FaEdit />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          style={{ marginTop: '2px' }}
                          onClick={() => handleRemoveTrade(index)}
                          title="Remove trade"
                        >
                          <CgCloseR size={15} />
                        </IconButton>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          
          {/* Trading Journal - Mandatory Field */}
          <div className="trading-journal-section">
            <h3>Trading Journal *</h3>
            <textarea
              className="trading-journal-textarea"
              value={tradingJournal}
              onChange={(e) => setTradingJournal(e.target.value)}
              placeholder="Write your trading journal here... What went well? What could be improved? Market observations, emotions, lessons learned, etc."
              rows={8}
            />
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              {tradingJournal.length} characters
            </Typography>
          </div>

          {/* Save Button */}
          <Button
            type="button"
            variant="contained"
            color="success"
            fullWidth
            onClick={handleSaveAllTrades}
            disabled={isProcessing || !tradingJournal.trim()}
            sx={{ mt: 2 }}
          >
            {isProcessing ? 'Saving...' : isTradeDay ? `Save All (${trades.length} trades + journal)` : 'Save No Trade Journal'}
          </Button>
        </div>
      </div>

      <ErrorSnackbar
        open={snackbarOpen}
        message={snackbarMessage}
        severity={snackbarSeverity}
        onClose={() => setSnackbarOpen(false)}
      />

      {/* NT Conflict Dialog */}
      <Dialog 
        open={showNTDialog} 
        onClose={() => {
          setShowNTDialog(false);
          setPendingPayload(null);
          setIsProcessing(false);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ backgroundColor: '#ff9800', color: 'white', fontWeight: 600 }}>
          ⚠️ No Trade Conflict Detected
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Alert severity="warning" sx={{ mb: 2 }}>
            You have marked the following date(s) as "No Trade". Please delete the NT entries before adding new trades.
          </Alert>
          {ntConflictDates.map((date) => (
            <Card key={date} sx={{ mb: 1, border: '1px solid #ff9800' }}>
              <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, '&:last-child': { pb: 2 } }}>
                <Typography variant="body1" fontWeight={500}>
                  {(() => {
                    // Parse date string directly to avoid timezone issues
                    const dateStr = typeof date === 'string' ? date.split('T')[0] : date;
                    const [year, month, day] = dateStr.split('-');
                    return `${day}/${month}/${year}`;
                  })()}
                </Typography>
                <Button 
                  variant="outlined" 
                  color="error" 
                  size="small"
                  onClick={() => handleDeleteNT(date)}
                >
                  Delete NT
                </Button>
              </CardContent>
            </Card>
          ))}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={() => {
              setShowNTDialog(false);
              setPendingPayload(null);
              setIsProcessing(false);
            }}
            color="inherit"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleProceedAfterNTDeletion}
            variant="contained"
            color="success"
            disabled={ntConflictDates.length > 0}
          >
            Proceed to Save
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default ForexMarket;
