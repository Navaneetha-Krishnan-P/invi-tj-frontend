import { useEffect, useRef } from 'react';
import '../ProfitChart.css';

const BarChart = ({ data, height = 300 }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!data || data.length === 0) return;

    // Prepare paddedData for single-point datasets
    let paddedData = data;
    const desiredSlots = 7;
    if (data.length === 1) {
      const base = data[0];
      const center = Math.floor(desiredSlots / 2);
      paddedData = new Array(desiredSlots).fill(null);
      paddedData[center] = { ...base, _empty: false };
      const baseDate = new Date(base.period);
      const hasValidDate = !isNaN(baseDate.getTime());
      for (let i = 0; i < desiredSlots; i++) {
        if (!paddedData[i]) {
          let label = '';
          if (hasValidDate) {
            const d = new Date(baseDate);
            d.setDate(baseDate.getDate() + (i - center));
            label = d.toISOString().split('T')[0];
          }
          paddedData[i] = { period: label, totalProfit: 0, _empty: true };
        }
      }
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    const padding = { top: 20, right: 20, bottom: 70, left: 60 };

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
      if (/^\d{4}-Q[1-4]$/.test(label)) {
        const [y, q] = label.split('-Q');
        return `Q${q} ${y}`;
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

      const profits = paddedData.map(d => parseFloat(d.totalProfit || 0));
      const maxProfit = Math.max(...profits, 0);
      const minProfit = Math.min(...profits, 0);
      const range = Math.max(Math.abs(maxProfit), Math.abs(minProfit)) || 1;

      // Grid
      ctx.strokeStyle = '#e1e8ed';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 5; i++) {
        const y = padding.top + (innerHeight / 5) * i;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.stroke();

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

      const barWidth = (chartWidth / paddedData.length) * 0.7;
      const barGap = (chartWidth / paddedData.length) * 0.3;

      const availablePerBar = chartWidth / paddedData.length;
      const approxLabelWidth = 40;
      const maxLabels = Math.max(1, Math.floor(chartWidth / approxLabelWidth));
      const labelInterval = Math.max(1, Math.ceil(paddedData.length / maxLabels));

      paddedData.forEach((point, index) => {
        const profit = parseFloat(point.totalProfit || 0);
        const x = padding.left + (index * (barWidth + barGap)) + barGap / 2;
        const barHeight = (Math.abs(profit) / (range * 2)) * innerHeight;

        let y;
        if (profit >= 0) y = zeroY - barHeight;
        else y = zeroY;

        if (point._empty) {
          ctx.fillStyle = '#ecf0f1';
          ctx.fillRect(x, padding.top, barWidth, innerHeight);
          ctx.strokeStyle = '#bdc3c7';
          ctx.lineWidth = 1;
          ctx.strokeRect(x, padding.top, barWidth, innerHeight);
        } else {
          ctx.fillStyle = profit >= 0 ? '#27ae60' : '#e74c3c';
          ctx.fillRect(x, y, barWidth, barHeight);
        }

        if (index % labelInterval !== 0 && index !== paddedData.length - 1) return;

        const rawLabel = point.period || '';
        const labelText = formatLabel(rawLabel);
        ctx.fillStyle = '#7f8c8d';

        let rotateAngle = 0;
        if (availablePerBar < 50) rotateAngle = -Math.PI / 2;
        else if (availablePerBar < 90) rotateAngle = -Math.PI / 4;

        if (availablePerBar < 40) ctx.font = '9px Arial';
        else if (availablePerBar < 70) ctx.font = '10px Arial';
        else ctx.font = '11px Arial';

        ctx.textAlign = 'center';
        ctx.textBaseline = rotateAngle === 0 ? 'top' : 'middle';
        ctx.save();

        const labelY = chartHeight - padding.bottom + (rotateAngle === -Math.PI / 2 ? 34 : 18);
        ctx.translate(x + barWidth / 2, labelY);
        if (rotateAngle !== 0) ctx.rotate(rotateAngle);
        ctx.fillText(labelText, 0, 0);
        ctx.restore();
      });
    };

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
