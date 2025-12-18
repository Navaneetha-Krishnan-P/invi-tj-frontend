import { useEffect, useRef } from 'react';
import './ProfitChart.css';

const PieChart = ({ data, height = 300 }) => {
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

    // Calculate totals
    const winningTrades = data.filter(t => Number(t.profit_loss) > 0).length;
    const losingTrades = data.filter(t => Number(t.profit_loss) < 0).length;
    const total = winningTrades + losingTrades;

    if (total === 0) return;

    // Center and radius
    const centerX = width / 2;
    const centerY = chartHeight / 2;
    const radius = Math.min(width, chartHeight) / 3;

    // Draw slices
    const colors = ['#27ae60', '#e74c3c'];
    const labels = ['Winning', 'Losing'];
    const values = [winningTrades, losingTrades];
    
    let startAngle = -Math.PI / 2;

    values.forEach((value, index) => {
      const sliceAngle = (value / total) * Math.PI * 2;
      
      // Draw slice
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
      ctx.lineTo(centerX, centerY);
      ctx.fillStyle = colors[index];
      ctx.fill();
      
      // Draw border
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw label
      const labelAngle = startAngle + sliceAngle / 2;
      const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7);
      const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7);
      
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${value}`, labelX, labelY);
      
      startAngle += sliceAngle;
    });

    // Draw legend
    const legendX = centerX + radius + 40;
    let legendY = centerY - 30;
    
    labels.forEach((label, index) => {
      // Color box
      ctx.fillStyle = colors[index];
      ctx.fillRect(legendX, legendY - 8, 15, 15);
      
      // Label text
      ctx.fillStyle = '#2c3e50';
      ctx.font = '12px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`${label}: ${values[index]} (${((values[index] / total) * 100).toFixed(1)}%)`, legendX + 20, legendY);
      
      legendY += 25;
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

export default PieChart;
