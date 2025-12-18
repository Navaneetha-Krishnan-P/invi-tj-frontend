import { useEffect, useRef } from 'react';
import './ProfitChart.css';

const BarChart = ({ data, height = 300 }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!data || data.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    
    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const chartHeight = rect.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, chartHeight);

    // Chart padding
    const padding = { top: 20, right: 20, bottom: 60, left: 60 };
    const chartWidth = width - padding.left - padding.right;
    const innerHeight = chartHeight - padding.top - padding.bottom;

    // Find min and max values
    const profits = data.map(d => parseFloat(d.totalProfit || 0));
    const maxProfit = Math.max(...profits, 0);
    const minProfit = Math.min(...profits, 0);
    const range = Math.max(Math.abs(maxProfit), Math.abs(minProfit)) || 1;

    // Draw grid lines
    ctx.strokeStyle = '#e1e8ed';
    ctx.lineWidth = 1;
    
    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (innerHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      // Y-axis labels
      const value = range - (range * 2 / 5) * i;
      ctx.fillStyle = '#7f8c8d';
      ctx.font = '12px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(`${value.toFixed(0)}`, padding.left - 10, y + 4);
    }

    // Zero line
    const zeroY = padding.top + (range / (range * 2)) * innerHeight;
    ctx.strokeStyle = '#34495e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding.left, zeroY);
    ctx.lineTo(width - padding.right, zeroY);
    ctx.stroke();

    // Draw bars
    const barWidth = (chartWidth / data.length) * 0.7;
    const barGap = (chartWidth / data.length) * 0.3;

    data.forEach((point, index) => {
      const profit = parseFloat(point.totalProfit || 0);
      const x = padding.left + (index * (barWidth + barGap)) + barGap / 2;
      const barHeight = (Math.abs(profit) / (range * 2)) * innerHeight;
      
      let y;
      if (profit >= 0) {
        y = zeroY - barHeight;
      } else {
        y = zeroY;
      }

      // Bar color
      ctx.fillStyle = profit >= 0 ? '#27ae60' : '#e74c3c';
      ctx.fillRect(x, y, barWidth, barHeight);

      // X-axis labels
      ctx.fillStyle = '#7f8c8d';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.save();
      ctx.translate(x + barWidth / 2, chartHeight - padding.bottom + 15);
      ctx.rotate(-Math.PI / 4);
      ctx.fillText(point.period || '', 0, 0);
      ctx.restore();
    });

  }, [data, height]);

  if (!data || data.length === 0) {
    return (
      <div className="chart-placeholder" style={{ height }}>
        <p>No data available</p>
      </div>
    );
  }

  return (
    <div className="chart-wrapper">
      <canvas ref={canvasRef} style={{ width: '100%', height: `${height}px` }} />
    </div>
  );
};

export default BarChart;
