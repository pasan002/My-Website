import { useMemo } from 'react';

interface BarChartData {
  label: string;
  value: number;
  color: string;
}

interface BarChartProps {
  data: BarChartData[];
  maxHeight?: number;
  className?: string;
}

export default function BarChart({ data, className = '' }: BarChartProps) {
  const maxValue = useMemo(() => Math.max(...data.map(item => item.value)), [data]);
  
  return (
    <div className={`space-y-3 ${className}`}>
      {data.map((item, index) => {
        
        return (
          <div key={index} className="flex items-center gap-3">
            <div className="w-20 text-xs text-gray-600 truncate" title={item.label}>
              {item.label}
            </div>
            <div className="flex-1 flex items-center gap-2">
              <div className="flex-1 bg-gray-100 rounded-full h-4 relative overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    backgroundColor: item.color,
                    width: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%`,
                  }}
                />
              </div>
              <div className="w-16 text-xs text-gray-700 font-medium text-right">
                LKR {item.value.toLocaleString()}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
