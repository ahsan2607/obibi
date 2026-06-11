import React from "react";
import { TrendingUp } from "lucide-react";

interface AdherenceChartData {
  date: string;
  percent: number;
}

interface AdherenceChartProps {
  data: AdherenceChartData[];
}

/**
 * Renders a bar chart showing medication adherence over the last 7 days.
 * 
 * Initial state: Component receives an array of adherence data objects.
 * Final state: Returns a styled bar chart with tooltips and percentage labels.
 */
export const AdherenceChart: React.FC<AdherenceChartProps> = ({ data }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-500" />
          Adherence Analysis (Last 7 Days)
        </h2>
      </div>
      
      <div className="relative h-64 w-full mt-4">
        <div className="absolute left-0 top-0 bottom-8 w-12 flex flex-col justify-between text-xs text-gray-400 text-right pr-4">
          <span>100%</span>
          <span>75%</span>
          <span>50%</span>
          <span>25%</span>
          <span>0%</span>
        </div>
        
        <div className="absolute left-12 right-0 top-0 bottom-8 flex justify-between items-end gap-2 border-l border-b border-gray-200 pb-1">
          <div className="absolute left-0 right-0 bottom-0 top-0 flex flex-col justify-between pointer-events-none">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-full border-t border-gray-100 border-dashed" />
            ))}
          </div>

          {data.map((item, index) => (
            <div key={index} className="relative flex flex-col items-center w-full group z-10 h-full justify-end">
              <span className="text-xs font-medium text-gray-600 mb-2">{item.percent}%</span>
              <div 
                className={`w-full max-w-[3rem] rounded-t-md transition-all duration-500 hover:opacity-80
                  ${item.percent >= 80 ? 'bg-gradient-to-t from-green-500 to-green-400' : 
                    item.percent >= 50 ? 'bg-gradient-to-t from-yellow-500 to-yellow-400' : 
                    'bg-gradient-to-t from-red-500 to-red-400'}`}
                style={{ height: `${item.percent}%` }}
              ></div>
            </div>
          ))}
        </div>
        
        <div className="absolute left-12 right-0 bottom-0 h-8 flex justify-between items-end pt-2">
          {data.map((item, index) => (
            <div key={index} className="w-full text-center text-xs text-gray-500 font-medium truncate px-1">
              {item.date}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
