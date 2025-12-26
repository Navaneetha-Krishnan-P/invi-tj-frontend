import { useEffect, useRef } from 'react';
import './ProfitChart.css';

const ProfitChart = ({ data, height = 300 }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!data || data.length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    const padding = { top: 20, right: 20, bottom: 72, left: 60 };

    const formatLabel = (label) => {
      if (!label) return '';
      if (/^\d{4}-\d{2}-\d{2}$/.test(label)) {
        const d = new Date(label + 'T00:00:00');
        return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
      }
      if (/^\d{4}-\d{2}$/.test(label)) {
        const [y, m] = label.split('-');
        const d = new Date(Number(y), Number(m) - 1, 1);
        return d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
      }
      return label;
    };

    let resizeTimer = null;
    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const width = rect.width;
      const chartHeight = rect.height;

      ctx.clearRect(0, 0, width, chartHeight);

      const chartWidth = width - padding.left - padding.right;
      const innerHeight = chartHeight - padding.top - padding.bottom;

      // Find min and max values
      const profits = data.map(d => parseFloat(d.totalProfit || 0));
      const totalNet = profits.reduce((s, v) => s + (isNaN(v) ? 0 : v), 0);
      const maxProfit = Math.max(...profits, 0);
      const minProfit = Math.min(...profits, 0);
      const range = Math.max(maxProfit - minProfit, 1);

      // Grid lines
      ctx.strokeStyle = '#e1e8ed';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 5; i++) {
        const y = padding.top + (innerHeight / 5) * i;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.stroke();

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
        const xStep = data.length === 1 ? 0 : chartWidth / (data.length - 1);
        const getSinglePointX = () => padding.left + chartWidth / 2;

        if (data.length > 1) {
          ctx.beginPath();
          ctx.moveTo(padding.left, padding.top + innerHeight);

          data.forEach((point, index) => {
            const x = padding.left + (index * xStep);
            const y = padding.top + ((maxProfit - parseFloat(point.totalProfit || 0)) / range) * innerHeight;
            ctx.lineTo(x, y);
          });

          ctx.lineTo(padding.left + (data.length - 1) * xStep, padding.top + innerHeight);
          ctx.closePath();

          const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + innerHeight);
          if (totalNet >= 0) {
            gradient.addColorStop(0, 'rgba(39, 174, 96, 0.3)');
            gradient.addColorStop(1, 'rgba(39, 174, 96, 0.05)');
          } else {
            gradient.addColorStop(0, 'rgba(231, 76, 60, 0.3)');
            gradient.addColorStop(1, 'rgba(231, 76, 60, 0.05)');
          }
          ctx.fillStyle = gradient;
          ctx.fill();
        }

        if (data.length > 1) {
          ctx.beginPath();
          data.forEach((point, index) => {
            const x = padding.left + (index * xStep);
            const y = padding.top + ((maxProfit - parseFloat(point.totalProfit || 0)) / range) * innerHeight;
            if (index === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          });
            ctx.strokeStyle = totalNet >= 0 ? '#27ae60' : '#e74c3c';
          ctx.lineWidth = 3;
          ctx.stroke();
        }

        data.forEach((point, index) => {
          const x = data.length === 1 ? getSinglePointX() : padding.left + (index * xStep);
          const y = padding.top + ((maxProfit - parseFloat(point.totalProfit || 0)) / range) * innerHeight;
          ctx.beginPath();
          ctx.arc(x, y, data.length === 1 ? 8 : 4, 0, Math.PI * 2);
          ctx.fillStyle = parseFloat(point.totalProfit || 0) >= 0 ? '#27ae60' : '#e74c3c';
          ctx.fill();
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2;
          ctx.stroke();
        });
      }

      // X-axis labels
      ctx.fillStyle = '#7f8c8d';
      const availablePerBar = data.length > 0 ? chartWidth / Math.max(1, data.length) : chartWidth;
      const approxLabelWidth = 40;
      const maxLabels = Math.max(1, Math.floor(chartWidth / approxLabelWidth));
      const labelStep = Math.max(1, Math.ceil(data.length / maxLabels));

      if (data.length === 1) {
        const x = padding.left + chartWidth / 2;
        ctx.font = '11px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(formatLabel(data[0].period), x, chartHeight - padding.bottom + 20);
      } else {
        data.forEach((point, index) => {
          if (index % labelStep !== 0 && index !== data.length - 1) return;
          const x = padding.left + (index * (chartWidth / (data.length - 1)));
          const raw = point.period || '';
          const text = formatLabel(raw);

          // rotation strategy: vertical earlier for mobile
          let rotateAngle = 0;
          if (availablePerBar < 50) rotateAngle = -Math.PI / 2;
          else if (availablePerBar < 90) rotateAngle = -Math.PI / 4;

          if (availablePerBar < 40) ctx.font = '9px Arial';
          else if (availablePerBar < 70) ctx.font = '10px Arial';
          else ctx.font = '11px Arial';

          ctx.save();
          if (rotateAngle !== 0 && /^\d{4}-\d{2}-\d{2}$/.test(raw)) {
            ctx.textBaseline = 'middle';
            ctx.translate(x, chartHeight - padding.bottom + (rotateAngle === -Math.PI / 2 ? 36 : 22));
            ctx.rotate(rotateAngle);
            ctx.fillText(text, 0, 0);
            ctx.restore();
          } else {
            ctx.textBaseline = 'top';
            ctx.textAlign = 'center';
            ctx.fillText(text, x, chartHeight - padding.bottom + 18);
            ctx.restore();
          }
        });
      }
    };

    // initial draw
    draw();

    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => draw(), 120);
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      if (resizeTimer) clearTimeout(resizeTimer);
    };

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
