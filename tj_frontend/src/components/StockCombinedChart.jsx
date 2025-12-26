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
  const [period, setPeriod] = useState('days'); // 'days' | 'weeks' | 'months' | 'quarters'
  const [rawMap, setRawMap] = useState({}); // keyed by YYYY-MM-DD

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
        
        // Group trades by date and calculate daily profit/loss split by market (INR vs USD)
        const tradesByDate = {};

        (indianData.trades || []).forEach(trade => {
          const date = new Date(trade.trade_date).toISOString().split('T')[0];
          if (!tradesByDate[date]) {
            tradesByDate[date] = {
              date,
              profit_INR: 0,
              loss_INR: 0,
              profit_USD: 0,
              loss_USD: 0,
              trades: 0,
            };
          }
          const pl = Number(trade.profit_loss);
          if (pl > 0) tradesByDate[date].profit_INR += pl;
          else tradesByDate[date].loss_INR += Math.abs(pl);
          tradesByDate[date].trades += 1;
        });

        (forexData.trades || []).forEach(trade => {
          const date = new Date(trade.trade_date).toISOString().split('T')[0];
          if (!tradesByDate[date]) {
            tradesByDate[date] = {
              date,
              profit_INR: 0,
              loss_INR: 0,
              profit_USD: 0,
              loss_USD: 0,
              trades: 0,
            };
          }
          const pl = Number(trade.profit_loss);
          if (pl > 0) tradesByDate[date].profit_USD += pl;
          else tradesByDate[date].loss_USD += Math.abs(pl);
          tradesByDate[date].trades += 1;
        });

        // keep the raw map for dynamic aggregations
        setRawMap(tradesByDate);
      } catch (err) {
        console.error('Error fetching trade data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTradeData();
  }, []);

  // Recompute chartData whenever rawMap or period changes
  useEffect(() => {
    if (!rawMap || Object.keys(rawMap).length === 0) return;

    const formatDate = (d) => d.toISOString().split('T')[0];

    const sumRange = (start, end) => {
      const res = { date: '', profit_INR: 0, loss_INR: 0, profit_USD: 0, loss_USD: 0, trades: 0 };
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const key = formatDate(new Date(d));
        if (rawMap[key]) {
          res.profit_INR += rawMap[key].profit_INR || 0;
          res.loss_INR += rawMap[key].loss_INR || 0;
          res.profit_USD += rawMap[key].profit_USD || 0;
          res.loss_USD += rawMap[key].loss_USD || 0;
          res.trades += rawMap[key].trades || 0;
        }
      }
      return res;
    };

    const today = new Date();
    let filled = [];

    if (period === 'days') {
      const DAYS = 30; // show last 30 days
      for (let i = DAYS - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const key = formatDate(d);
        if (rawMap[key]) {
          filled.push(rawMap[key]);
        } else {
          filled.push({ date: key, profit_INR: 0, loss_INR: 0, profit_USD: 0, loss_USD: 0, trades: 0 });
        }
      }
    } else if (period === 'weeks') {
      const WEEKS = 12; // last 12 weeks
      // find start of current week (Monday)
      const cur = new Date(today);
      const day = cur.getDay();
      const diffToMon = (day + 6) % 7; // 0->Mon
      const startOfThisWeek = new Date(cur);
      startOfThisWeek.setDate(cur.getDate() - diffToMon);

      for (let i = WEEKS - 1; i >= 0; i--) {
        const weekStart = new Date(startOfThisWeek);
        weekStart.setDate(startOfThisWeek.getDate() - i * 7);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        const sum = sumRange(weekStart, weekEnd);
        sum.date = formatDate(weekStart);
        filled.push(sum);
      }
    } else if (period === 'months') {
      const MONTHS = 12; // last 12 months
      for (let i = MONTHS - 1; i >= 0; i--) {
        const m = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const start = new Date(m.getFullYear(), m.getMonth(), 1);
        const end = new Date(m.getFullYear(), m.getMonth() + 1, 0);
        const sum = sumRange(start, end);
        sum.date = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`;
        filled.push(sum);
      }
    } else if (period === 'quarters') {
      const QUARTERS = 8; // last 8 quarters
      const curYear = today.getFullYear();
      const curQuarter = Math.floor(today.getMonth() / 3) + 1;
      for (let i = QUARTERS - 1; i >= 0; i--) {
        const qIndex = (curQuarter - i - 1);
        const yearOffset = Math.floor(qIndex / 4);
        const quarter = ((qIndex % 4) + 4) % 4 + 1;
        const year = curYear + yearOffset;
        const startMonth = (quarter - 1) * 3;
        const start = new Date(year, startMonth, 1);
        const end = new Date(year, startMonth + 3, 0);
        const sum = sumRange(start, end);
        sum.date = `${year}-Q${quarter}`;
        filled.push(sum);
      }
    }

    setChartData(filled);
  }, [rawMap, period]);

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
    // USD series (Forex)
    {
      type: 'line',
      yAxisId: 'amount',
      color: '#e74c3c',
      label: 'Loss (USD)',
      data: chartData.map((day) => day.loss_USD || 0),
      highlightScope: { highlight: 'item' },
    },
    {
      type: 'line',
      yAxisId: 'amount',
      color: '#27ae60',
      label: 'Profit (USD)',
      data: chartData.map((day) => day.profit_USD || 0),
    },
    // INR series (Indian market)
    {
      type: 'line',
      yAxisId: 'amount',
      color: '#c0392b',
      label: 'Loss (INR)',
      data: chartData.map((day) => day.loss_INR || 0),
      highlightScope: { highlight: 'item' },
    },
    {
      type: 'line',
      yAxisId: 'amount',
      color: '#2ecc71',
      label: 'Profit (INR)',
      data: chartData.map((day) => day.profit_INR || 0),
    },
  ];

  return (
    <Box sx={{ width: '100%', height: 400 }}>
      <div className="chart-controls" style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <label style={{ marginRight: 8, whiteSpace: 'nowrap' }}>Period:</label>
          <select value={period} onChange={(e) => setPeriod(e.target.value)} className="filter-select">
            <option value="days">Last 30 Days</option>
            <option value="weeks">Last 12 Weeks</option>
            <option value="months">Last 12 Months</option>
            <option value="quarters">Last 8 Quarters</option>
          </select>
        </div>
      </div>
      {
        // compute responsive tick sizing/interval based on current window width
      }
      <ChartContainer
        series={series}
        xAxis={[
          {
            id: 'date',
            data: chartData.map((day) => day.date),
            scaleType: 'band',
            valueFormatter: (value) => value,
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
            try {
              const w = typeof window !== 'undefined' ? window.innerWidth : 800;
              // increase target label width on narrow screens to reduce drawn ticks
              let approxLabelWidth = Math.max(60, Math.floor(w / 12));
              if (w <= 480) approxLabelWidth = Math.max(approxLabelWidth, 120);
              if (w <= 360) approxLabelWidth = Math.max(approxLabelWidth, 160);
              const maxLabels = Math.max(1, Math.floor(w / approxLabelWidth));
              const interval = Math.max(1, Math.ceil(chartData.length / maxLabels));
              return index % interval === 0 || index === chartData.length - 1;
            } catch (e) {
              return index % Math.max(1, Math.floor(chartData.length / 10)) === 0;
            }
          }}
          tickLabelStyle={{
            fontSize: typeof window !== 'undefined' ? (window.innerWidth <= 480 ? 9 : 10) : 10,
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
