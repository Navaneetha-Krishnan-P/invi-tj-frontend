import { useState } from 'react';
import { tradeAPI, imageAPI } from '../../services/api';
import ErrorSnackbar from '../../components/ErrorSnackbar';
import StyledTextField from '../../components/StyledTextField';
import './ForexMarket.css';
import { FaEdit } from "react-icons/fa";
import { CgCloseR } from "react-icons/cg";
import { MenuItem, Button, Card, CardContent, CardActions, IconButton, Typography } from '@mui/material';

const ForexMarket = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('error');
  const [trades, setTrades] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  
  // Form fields for manual trade entry
  const [formData, setFormData] = useState({
    symbol: '',
    trade_type: '',
    lot_size: '',
    entry_price: '',
    exit_price: '',
    trade_date: '',
    profit_loss: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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
      trade_date: formData.trade_date || new Date().toISOString(),
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
      profit_loss: ''
    });
  };

  const handleEditTrade = (index) => {
    const trade = trades[index];
    setFormData({
      symbol: trade.symbol,
      trade_type: trade.trade_type,
      lot_size: trade.lot_size.toString(),
      entry_price: trade.entry_price.toString(),
      exit_price: trade.exit_price ? trade.exit_price.toString() : '',
      trade_date: trade.trade_date ? trade.trade_date.split('T')[0] : '',
      profit_loss: trade.profit_loss.toString()
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
      profit_loss: ''
    });
  };

  const handleSaveAllTrades = async () => {
    if (trades.length === 0) {
      const errorMsg = 'No trades to save. Please add at least one trade.';
      setSnackbarMessage(errorMsg);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    setIsProcessing(true);
    try {
      const data = await tradeAPI.saveTrades(trades);

      if (data.success) {
        const successMsg = `Successfully saved ${trades.length} trade(s)!`;
        setSnackbarMessage(successMsg);
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        setTrades([]);
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
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setSnackbarMessage('File size should be less than 5MB');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
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
          if (!trade.symbol || trade.symbol === '' || trade.symbol === null) missingFields.push('symbol');
          if (!trade.type || trade.type === '' || trade.type === null) missingFields.push('type');
          if (trade.lot === null || trade.lot === undefined || isNaN(parseFloat(trade.lot))) missingFields.push('lot');
          if (trade.price_in === null || trade.price_in === undefined || isNaN(parseFloat(trade.price_in))) missingFields.push('entry price');
          if (trade.price_out === null || trade.price_out === undefined || isNaN(parseFloat(trade.price_out))) missingFields.push('exit price');
          if (trade.profit === null || trade.profit === undefined || isNaN(parseFloat(trade.profit))) missingFields.push('profit');

          if (missingFields.length > 0) {
            invalidTrades.push({ index: index + 1, fields: missingFields });
          } else {
            validTrades.push({
              user_id: localStorage.getItem('userId'),
              market_type: 'FOREX',
              symbol: trade.symbol.toUpperCase(),
              trade_type: trade.type.toUpperCase(),
              lot_size: parseFloat(trade.lot),
              entry_price: parseFloat(trade.price_in),
              exit_price: parseFloat(trade.price_out),
              profit_loss: parseFloat(trade.profit),
              trade_date: trade.datetime ? new Date(trade.datetime.replace(/\s+/g, ' ').replace(/\./g, '-')).toISOString() : new Date().toISOString()
            });
          }
        });

        if (invalidTrades.length > 0) {
          const errorDetails = invalidTrades.map(t => `Trade ${t.index}: missing ${t.fields.join(', ')}`).join('; ');
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
        const errorMsg = 'Unable to extract trade data from image. Please upload a clear image or enter trades manually.';
        setSnackbarMessage(errorMsg);
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
      
      setSelectedImage(null);

    } catch (err) {
      console.error('Image processing error:', err);
      setSnackbarMessage('Unable to process image. Please upload a clear image or manually enter the trade data.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setIsProcessing(false);
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
          <h3>{editingIndex !== null ? 'Edit Trade' : 'Add Trade'}</h3><br/>
          {editingIndex !== null && (
            <Button 
              variant="outlined" 
              color="error" 
              onClick={handleCancelEdit}
              sx={{ mb: 4 }}
            >
              Cancel Edit
            </Button>
          )}
          
          {/* Image Upload Feature - Optional */}
          <div className="image-upload-feature">
            <p className="feature-description">
              Upload a trade screenshot to auto-fill the form below. If any details are incorrect, you can manually edit them before saving.
            </p>
            <label className="upload-label-compact">
              <input
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

          <form onSubmit={handleAddTrade}>
            <div style={{ display: 'flex', gap: '25px', marginBottom: '25px' }}>
              <StyledTextField
                label="Symbol"
                name="symbol"
                value={formData.symbol}
                onChange={handleInputChange}
                placeholder="e.g., GOLD, EURUSD"
                required
              />

              <StyledTextField
                select
                label="Trade Type"
                name="trade_type"
                value={formData.trade_type}
                onChange={handleInputChange}
                required
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
                inputProps={{ step: "0.01" }}
                required
              />

              <StyledTextField
                label="Exit Price"
                name="exit_price"
                type="number"
                value={formData.exit_price}
                onChange={handleInputChange}
                placeholder="4201.61"
                inputProps={{ step: "0.01" }}
                required
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
                inputProps={{ step: "1" }}
                required
              />

              <StyledTextField
                label="Profit/Loss"
                name="profit_loss"
                type="number"
                value={formData.profit_loss}
                onChange={handleInputChange}
                placeholder="155.75"
                inputProps={{ step: "0.01" }}
                required
              />
            </div>

            <div style={{ display: 'flex', gap: '25px', marginBottom: '25px' }}>
              <StyledTextField
                label="Date"
                name="trade_date"
                type="datetime-local"
                value={formData.trade_date ? formData.trade_date.slice(0, 16) : ''}
                onChange={handleInputChange}
                required
                InputLabelProps={{ shrink: true }}
              />
            </div>

            <div style={{marginBottom: "10px"}}>
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
            <Button 
              type="button" 
              variant="contained"
              color="success"
              fullWidth
              onClick={handleSaveAllTrades}
              disabled={isProcessing || trades.length === 0}
            >
              {isProcessing ? 'Saving...' : `Save All Trades (${trades.length})`}
            </Button>
          </form>
        </div>

        {/* Added Trades List */}
        <div className="trades-preview-section">
          <h3>Trades to be Saved ({trades.length})</h3>
          {trades.length === 0 ? (
            <div className="empty-trades-message">
              <p>No trades added yet. Fill the form and click "Add Trade".</p>
            </div>
          ) : (
            <div className="trades-preview-list">
              {trades.map((trade, index) => (
                <Card 
                  key={index} 
                  sx={{ 
                    mb: 1.5, 
                    border: editingIndex === index ? '2px solid #1976d2' : '1px solid #e1e8ed',
                    backgroundColor : editingIndex === index ? 'whitesmoke' : 'rgb(237, 243, 255)',
                    boxShadow: 'none'
                  }}
                >
                  <CardContent sx={{ p: 1.2, '&:last-child': { pb: 1.2 } }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <Typography variant="subtitle1" component="span" color="primary" sx={{ fontWeight: 600 }}>
                            #{index + 1}
                          </Typography>
                          <Typography variant="body2" fontWeight="600">
                            {trade.symbol} - {trade.trade_type}
                          </Typography>
                        </div>
                        <div style={{ display: 'flex', gap: '16px', rowGap: '5px',  flexWrap: 'wrap' }}>
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                            Lot: {trade.lot_size}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                            Entry: ${trade.entry_price}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                            Exit: ${trade.exit_price || 'N/A'}
                          </Typography>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: trade.profit_loss >= 0 ? '#27ae60' : '#e74c3c',
                              fontWeight: 'bold',
                              fontSize: '0.85rem'
                            }}
                          >
                            P/L: ${trade.profit_loss.toFixed(2)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                            {new Date(trade.trade_date).toLocaleString('en-US', { 
                              month: 'short', 
                              day: 'numeric', 
                              year: 'numeric', 
                              hour: '2-digit', 
                              minute: '2-digit'
                            })}
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
                          style={{marginTop : "2px"}}
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
        </div>

      </div>
      
      <ErrorSnackbar
        open={snackbarOpen}
        message={snackbarMessage}
        severity={snackbarSeverity}
        onClose={() => setSnackbarOpen(false)}
      />
    </div>
  );
};

export default ForexMarket;
