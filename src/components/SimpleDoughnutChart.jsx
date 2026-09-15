import { useMemo } from 'react';

export default function SimpleDoughnutChart({ data, darkMode }) {
  const { slices, total } = useMemo(() => {
    const entries = Object.entries(data || {});
    const total = entries.reduce((sum, [, value]) => sum + (Number(value) || 0), 0) || 1;
    let startAngle = 0;
    const slices = entries.map(([label, value], index) => {
      const fraction = (Number(value) || 0) / total;
      const angle = fraction * 360;
      const slice = {
        label,
        value: Number(value) || 0,
        fraction,
        startAngle,
        endAngle: startAngle + angle,
        color: ['#f59e0b', '#3b82f6', '#10b981'][index % 3],
      };
      startAngle += angle;
      return slice;
    });
    return { slices, total };
  }, [data]);

  const size = 200;
  const strokeWidth = 28;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  const textColor = darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)';

  let offset = 0;

  return (
    <div className="flex flex-col items-center">
      <svg viewBox={`0 0 ${size} ${size}`} className="w-48 h-48 sm:w-56 sm:h-56">
        {slices.map((slice, i) => {
          const dashArray = `${slice.fraction * circumference} ${circumference}`;
          const dashOffset = -offset;
          offset += slice.fraction * circumference;
          return (
            <circle
              key={i}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={slice.color}
              strokeWidth={strokeWidth}
              strokeDasharray={dashArray}
              strokeDashoffset={dashOffset}
              transform={`rotate(-90 ${center} ${center})`}
              strokeLinecap="round"
            />
          );
        })}
        <text x={center} y={center - 6} textAnchor="middle" fontSize="20" fontWeight="bold" fill={darkMode ? '#fff' : '#1a1a1a'}>
          {total}
        </text>
        <text x={center} y={center + 14} textAnchor="middle" fontSize="10" fill={textColor}>
          Orders
        </text>
      </svg>

      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {slices.map((slice, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: slice.color }} />
            <span className="capitalize text-gray-600 dark:text-gray-300">{slice.label}</span>
            <span className="font-semibold">{slice.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
