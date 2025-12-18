import { useState, useEffect } from 'react';
import { dashboardAPI } from '../services/api';
import Box from '@mui/material/Box';
import { BarPlot } from '@mui/x-charts/BarChart';
import { LineHighlightPlot, LinePlot } from '@mui/x-charts/LineChart';
import { ChartContainer } from '@mui/x-charts/ChartContainer';
import { ChartsXAxis } from '@mui/x-charts/ChartsXAxis';
import { ChartsYAxis } from '@mui/x-charts/ChartsYAxis';
import { ChartsTooltip } from '@mui/x-charts/ChartsTooltip';
import { ChartsAxisHighlight } from '@mui/x-charts/ChartsAxisHighlight';
import Skeleton from 'react-loading-skeleton';

export default function StockCombinedChart() {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTradeData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('authToken');
        if (!token) return;

        // Fetch both INDIAN and FOREX trades
        const [indianData, forexData] = await Promise.all([
          dashboardAPI.getTrades('INDIAN', 1000),
          dashboardAPI.getTrades('FOREX', 1000)
        ]);
        
        // Combine both arrays
        const allTrades = [...(indianData.trades || []), ...(forexData.trades || [])];
        
        // Group trades by date and calculate daily profit/loss
        const tradesByDate = {};
        allTrades.forEach(trade => {
          const date = new Date(trade.trade_date).toISOString().split('T')[0];
          if (!tradesByDate[date]) {
            tradesByDate[date] = {
              date,
              profit: 0,
              loss: 0,
              trades: 0
            };
          }
          const pl = Number(trade.profit_loss);
          if (pl > 0) {
            tradesByDate[date].profit += pl;
          } else {
            tradesByDate[date].loss += Math.abs(pl);
          }
          tradesByDate[date].trades += 1;
        });

        // Convert to array and sort by date
        const chartArray = Object.values(tradesByDate).sort((a, b) => 
          new Date(a.date) - new Date(b.date)
        );

        setChartData(chartArray);
      } catch (err) {
        console.error('Error fetching trade data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTradeData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ width: '100%', height: 400 }}>
        <Skeleton height={400} />
      </Box>
    );
  }

  if (chartData.length === 0) {
    return (
      <Box sx={{ width: '100%', height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#999' }}>No trade data available</p>
      </Box>
    );
  }

  const series = [
    {
      type: 'bar',
      yAxisId: 'trades',
      label: 'Number of Trades',
      color: '#9e9e9e',
      data: chartData.map((day) => day.trades),
      highlightScope: { highlight: 'item' },
    },
    {
      type: 'line',
      yAxisId: 'amount',
      color: '#e74c3c',
      label: 'Loss',
      data: chartData.map((day) => day.loss),
      highlightScope: { highlight: 'item' },
    },
    {
      type: 'line',
      yAxisId: 'amount',
      color: '#27ae60',
      label: 'Profit',
      data: chartData.map((day) => day.profit),
    },
  ];

  return (
    <Box sx={{ width: '100%', height: 400 }}>
      <ChartContainer
        series={series}
        xAxis={[
          {
            id: 'date',
            data: chartData.map((day) => new Date(day.date)),
            scaleType: 'band',
            valueFormatter: (value) => value.toLocaleDateString(),
            height: 40,
          },
        ]}
        yAxis={[
          { id: 'amount', scaleType: 'linear', position: 'left', width: 60 },
          {
            id: 'trades',
            scaleType: 'linear',
            position: 'right',
            width: 50,
          },
        ]}
      >
        <ChartsAxisHighlight x="line" />
        <BarPlot />
        <LinePlot />
        <LineHighlightPlot />
        <ChartsXAxis
          label="Date"
          axisId="date"
          tickInterval={(value, index) => {
            return index % Math.max(1, Math.floor(chartData.length / 10)) === 0;
          }}
          tickLabelStyle={{
            fontSize: 10,
          }}
        />
        <ChartsYAxis
          label="Profit/Loss Amount"
          axisId="amount"
          tickLabelStyle={{ fontSize: 10 }}
        />
        <ChartsYAxis
          label="Trade Count"
          axisId="trades"
          tickLabelStyle={{ fontSize: 10 }}
        />
        <ChartsTooltip />
      </ChartContainer>
    </Box>
  );
}
