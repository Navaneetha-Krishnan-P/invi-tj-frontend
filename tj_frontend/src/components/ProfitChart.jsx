import { useEffect, useRef } from 'react';
import './ProfitChart.css';

const ProfitChart = ({ data, height = 300 }) => {
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
    const profits = data.map(d => parseFloat(d.totalProfit));
    const maxProfit = Math.max(...profits, 0);
    const minProfit = Math.min(...profits, 0);
    const range = maxProfit - minProfit || 1;

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
      const value = maxProfit - (range / 5) * i;
      ctx.fillStyle = '#7f8c8d';
      ctx.font = '12px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(`$${value.toFixed(0)}`, padding.left - 10, y + 4);
    }

    // Zero line (if applicable)
    if (minProfit < 0 && maxProfit > 0) {
      const zeroY = padding.top + ((maxProfit - 0) / range) * innerHeight;
      ctx.strokeStyle = '#34495e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(padding.left, zeroY);
      ctx.lineTo(width - padding.right, zeroY);
      ctx.stroke();
    }

    // Draw line chart
    if (data.length > 0) {
      // Handle single data point case
      const xStep = data.length === 1 ? 0 : chartWidth / (data.length - 1);

      // For single data point, center it
      const getSinglePointX = () => padding.left + chartWidth / 2;

      // Draw area under curve
      if (data.length > 1) {
        ctx.beginPath();
        ctx.moveTo(padding.left, padding.top + innerHeight);

        data.forEach((point, index) => {
          const x = padding.left + (index * xStep);
          const y = padding.top + ((maxProfit - parseFloat(point.totalProfit)) / range) * innerHeight;
          ctx.lineTo(x, y);
        });

        ctx.lineTo(padding.left + (data.length - 1) * xStep, padding.top + innerHeight);
        ctx.closePath();

        // Gradient fill
        const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + innerHeight);
        if (profits[profits.length - 1] >= 0) {
          gradient.addColorStop(0, 'rgba(39, 174, 96, 0.3)');
          gradient.addColorStop(1, 'rgba(39, 174, 96, 0.05)');
        } else {
          gradient.addColorStop(0, 'rgba(231, 76, 60, 0.3)');
          gradient.addColorStop(1, 'rgba(231, 76, 60, 0.05)');
        }
        ctx.fillStyle = gradient;
        ctx.fill();
      }

      // Draw line (only if more than 1 point)
      if (data.length > 1) {
        ctx.beginPath();
        data.forEach((point, index) => {
          const x = padding.left + (index * xStep);
          const y = padding.top + ((maxProfit - parseFloat(point.totalProfit)) / range) * innerHeight;
          
          if (index === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        });

        ctx.strokeStyle = profits[profits.length - 1] >= 0 ? '#27ae60' : '#e74c3c';
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      // Draw points
      data.forEach((point, index) => {
        const x = data.length === 1 ? getSinglePointX() : padding.left + (index * xStep);
        const y = padding.top + ((maxProfit - parseFloat(point.totalProfit)) / range) * innerHeight;
        
        ctx.beginPath();
        ctx.arc(x, y, data.length === 1 ? 8 : 4, 0, Math.PI * 2);
        ctx.fillStyle = parseFloat(point.totalProfit) >= 0 ? '#27ae60' : '#e74c3c';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
      });
    }

    // X-axis labels
    ctx.fillStyle = '#7f8c8d';
    ctx.font = '11px Arial';
    ctx.textAlign = 'center';
    
    if (data.length === 1) {
      // For single data point, center the label
      const x = padding.left + chartWidth / 2;
      ctx.fillText(data[0].period, x, chartHeight - padding.bottom + 20);
    } else {
      const labelStep = Math.ceil(data.length / 8); // Show max 8 labels
      data.forEach((point, index) => {
        if (index % labelStep === 0 || index === data.length - 1) {
          const x = padding.left + (index * (chartWidth / (data.length - 1)));
          ctx.fillText(point.period, x, chartHeight - padding.bottom + 20);
        }
      });
    }

  }, [data, height]);

  if (!data || data.length === 0) {
    return (
      <div className="profit-chart-container" style={{ height: `${height}px` }}>
        <div className="chart-empty">
          <p>No data available for the selected period</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profit-chart-container" style={{ height: `${height}px` }}>
      <canvas ref={canvasRef} className="profit-chart-canvas" />
    </div>
  );
};

export default ProfitChart;
