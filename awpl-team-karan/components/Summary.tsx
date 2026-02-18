
import React from 'react';
import { Totals } from '../types';

interface SummaryProps {
  totals: Totals;
}

const Summary: React.FC<SummaryProps> = ({ totals }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* 1. Total MRP Price */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-6 rounded-xl shadow-md text-white flex flex-col justify-center transform hover:scale-[1.02] transition-transform">
        <p className="text-xs font-bold text-blue-100 uppercase tracking-wider mb-1">Total MRP Price</p>
        <p className="text-2xl font-black">₹{totals.totalMRP.toFixed(2)}</p>
      </div>

      {/* 2. Total DP Price */}
      <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-gray-400 flex flex-col justify-center">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Total DP Price</p>
        <p className="text-2xl font-black text-gray-800">₹{totals.totalDP.toFixed(2)}</p>
      </div>

      {/* 3. Total SP (Points) */}
      <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-purple-500 flex flex-col justify-center">
        <p className="text-xs font-bold text-purple-500 uppercase tracking-wider mb-1">Total Points (SP)</p>
        <p className="text-2xl font-black text-gray-800">{totals.totalSP.toFixed(2)}</p>
      </div>

      {/* 4. Total Profit (Gap) */}
      <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-emerald-500 flex flex-col justify-center">
        <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-1">Total Net Profit</p>
        <p className="text-2xl font-black text-emerald-700">₹{totals.gap.toFixed(2)}</p>
      </div>
    </div>
  );
};

export default Summary;
