import { useMemo } from 'react';
import { formatCurrency } from '../lib/utils.js';

export default function SimpleLineChart({ data, darkMode }) {
  const { labels, values, max } = useMemo(() => {
    const entries = Object.entries(data || {});
    const labels = entries.map(([date]) => {
      const d = new Date(date);
      return `${d.getDate()}/${d.getMonth() + 1}`;
    });
    const values = entries.map(([, value]) => Number(value) || 0);
    const max = Math.max(...values, 1);
    return { labels, values, max };
  }, [data]);

  if (!values.length) return null;

  const width = 600;
  const height = 240;
  const padding = { top: 20, right: 16, bottom: 40, left: 56 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const getX = (i) => padding.left + (i / (values.length - 1 || 1)) * chartWidth;
  const getY = (value) => padding.top + chartHeight - (value / max) * chartHeight;

  const pathD = values
    .map((value, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(value)}`)
    .join(' ');

  const areaD = `${pathD} L ${getX(values.length - 1)} ${height - padding.bottom} L ${getX(0)} ${height - padding.bottom} Z`;

  const gridColor = darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const textColor = darkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';
  const axisColor = darkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)';

  const yTicks = 5;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#d4af37" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#d4af37" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {Array.from({ length: yTicks + 1 }).map((_, i) => {
        const y = padding.top + (i / yTicks) * chartHeight;
        return (
          <line
            key={i}
            x1={padding.left}
            y1={y}
            x2={width - padding.right}
            y2={y}
            stroke={gridColor}
            strokeWidth={1}
          />
        );
      })}

      {/* Y-axis labels */}
      {Array.from({ length: yTicks + 1 }).map((_, i) => {
        const value = max - (i / yTicks) * max;
        const y = padding.top + (i / yTicks) * chartHeight;
        return (
          <text
            key={i}
            x={padding.left - 10}
            y={y + 4}
            textAnchor="end"
            fontSize="10"
            fill={textColor}
          >
            {formatCurrency(value).replace('₦', '')}k
          </text>
        );
      })}

      {/* X-axis labels */}
      {labels.map((label, i) => {
        if (i % 2 !== 0 && labels.length > 8) return null;
        return (
          <text
            key={i}
            x={getX(i)}
            y={height - padding.bottom + 18}
            textAnchor="middle"
            fontSize="10"
            fill={textColor}
          >
            {label}
          </text>
        );
      })}

      {/* Axes */}
      <line
        x1={padding.left}
        y1={padding.top}
        x2={padding.left}
        y2={height - padding.bottom}
        stroke={axisColor}
        strokeWidth={1}
      />
      <line
        x1={padding.left}
        y1={height - padding.bottom}
        x2={width - padding.right}
        y2={height - padding.bottom}
        stroke={axisColor}
        strokeWidth={1}
      />

      {/* Area */}
      <path d={areaD} fill="url(#lineGradient)" />

      {/* Line */}
      <path
        d={pathD}
        fill="none"
        stroke="#d4af37"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Points */}
      {values.map((value, i) => (
        <circle
          key={i}
          cx={getX(i)}
          cy={getY(value)}
          r={3}
          fill="#d4af37"
          stroke={darkMode ? '#1a1a1a' : '#fff'}
          strokeWidth={1.5}
        />
      ))}

      {/* Tooltip-like title on hover would require state; keeping simple */}
    </svg>
  );
}
