import { CheckCircle2, Circle, TrendingUp, AlertCircle } from "lucide-react";

export default function LaporanKepatuhanPage() {
  const chartData = [
    { date: "7 Ags", percent: 56 },
    { date: "8 Ags", percent: 78 },
    { date: "9 Ags", percent: 83 },
    { date: "10 Ags", percent: 100 },
    { date: "11 Ags", percent: 45 },
    { date: "12 Ags", percent: 90 },
    { date: "13 Ags", percent: 75 },
  ];

  const todayMedicines = [
    { id: 1, name: "Amlodipine 5mg", dosage: "1 tablet, Sesudah makan", time: "Pagi (08:00)", status: "taken" },
    { id: 2, name: "Metformin 500mg", dosage: "1 tablet, Sesudah makan", time: "Siang (13:00)", status: "pending" },
    { id: 3, name: "Simvastatin 20mg", dosage: "1 tablet, Malam sebelum tidur", time: "Malam (20:00)", status: "pending" },
  ];

  return (
    <div className="flex-1 p-6 lg:p-8 overflow-y-auto bg-gray-50/50">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Laporan Kepatuhan</h1>
          <p className="text-gray-500 mt-2">Pantau tingkat kepatuhan minum obat Anda setiap hari.</p>
        </div>

        {/* Chart Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              Analisis 7 hari terakhir patuh minum obat
            </h2>
          </div>
          
          <div className="relative h-64 w-full mt-4">
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 bottom-8 w-12 flex flex-col justify-between text-xs text-gray-400 text-right pr-4">
              <span>100%</span>
              <span>75%</span>
              <span>50%</span>
              <span>25%</span>
              <span>0%</span>
            </div>
            
            {/* Chart Area */}
            <div className="absolute left-12 right-0 top-0 bottom-8 flex justify-between items-end gap-2 border-l border-b border-gray-200 pb-1">
              {/* Horizontal grid lines */}
              <div className="absolute left-0 right-0 bottom-0 top-0 flex flex-col justify-between pointer-events-none">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-full border-t border-gray-100 border-dashed" />
                ))}
              </div>

              {/* Bars */}
              {chartData.map((item, index) => (
                <div key={index} className="relative flex flex-col items-center w-full group z-10 h-full justify-end">
                  {/* Tooltip on Hover */}
                  <div className="absolute -top-10 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-20">
                    {item.percent}% Patuh
                  </div>
                  
                  {/* Percentage above bar */}
                  <span className="text-xs font-medium text-gray-600 mb-2">{item.percent}%</span>
                  
                  {/* Bar */}
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
            
            {/* X-axis labels */}
            <div className="absolute left-12 right-0 bottom-0 h-8 flex justify-between items-end pt-2">
              {chartData.map((item, index) => (
                <div key={index} className="w-full text-center text-xs text-gray-500 font-medium truncate px-1">
                  {item.date}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Medications List Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-500" />
              Obat yang harus di minum hari ini:
            </h2>
          </div>
          
          <div className="space-y-4">
            {todayMedicines.map((med) => (
              <div 
                key={med.id} 
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors gap-4"
              >
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">{med.name}</h3>
                  <div className="text-sm text-gray-500 mt-1 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                    <span>{med.dosage}</span>
                    <span className="hidden sm:inline text-gray-300">•</span>
                    <span className="text-blue-600 font-medium">{med.time}</span>
                  </div>
                </div>
                
                <button 
                  className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 shrink-0
                    ${med.status === 'taken' 
                      ? 'bg-green-50 text-green-700 border border-green-200 cursor-default' 
                      : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow active:scale-95'}`}
                >
                  {med.status === 'taken' ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Sudah diminum
                    </>
                  ) : (
                    <>
                      <Circle className="w-4 h-4" />
                      Tandai sudah minum
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
