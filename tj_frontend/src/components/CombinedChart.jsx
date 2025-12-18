import Box from '@mui/material/Box';
import { BarChart } from '@mui/x-charts/BarChart';
import { LineChart } from '@mui/x-charts/LineChart';

const CombinedChart = ({ profitData = [], lossData = [] }) => {
  if (!profitData.length && !lossData.length) {
    return (
      <div style={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#7f8c8d' }}>No data available</p>
      </div>
    );
  }

  // Combine and prepare data
  const allDates = [...new Set([...profitData.map(d => d.period), ...lossData.map(d => d.period)])].sort();
  
  const profitValues = allDates.map(date => {
    const item = profitData.find(d => d.period === date);
    return item ? Math.abs(parseFloat(item.totalProfit)) : 0;
  });

  const lossValues = allDates.map(date => {
    const item = lossData.find(d => d.period === date);
    return item ? Math.abs(parseFloat(item.totalProfit)) : 0;
  });

  return (
    <Box sx={{ width: '100%', height: 400 }}>
      <BarChart
        xAxis={[{ 
          scaleType: 'band', 
          data: allDates,
          label: 'Period',
        }]}
        yAxis={[{ 
          label: 'Amount (USD/INR)',
        }]}
        series={[
          { 
            data: profitValues, 
            label: 'Profit', 
            color: '#27ae60',
            stack: 'total',
          },
          { 
            data: lossValues, 
            label: 'Loss', 
            color: '#e74c3c',
            stack: 'total',
          },
        ]}
        height={400}
        margin={{ top: 20, right: 20, bottom: 60, left: 80 }}
        slotProps={{
          legend: {
            direction: 'row',
            position: { vertical: 'top', horizontal: 'right' },
            padding: 0,
          },
        }}
      />
    </Box>
  );
};

export default CombinedChart;
