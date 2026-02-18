
import React from 'react';
import { ArrowUpCircle, ArrowDownCircle, Banknote } from 'lucide-react';

interface SummaryCardsProps {
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
}

const SummaryCards: React.FC<SummaryCardsProps> = ({ totalBalance, totalIncome, totalExpense }) => {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(val);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Balance Card */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="p-2 bg-indigo-50 rounded-lg">
            <Banknote className="w-6 h-6 text-indigo-600" />
          </div>
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Current Balance</span>
        </div>
        <h3 className={`text-3xl font-bold ${totalBalance >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
          {formatCurrency(totalBalance)}
        </h3>
      </div>

      {/* Income Card */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="p-2 bg-emerald-50 rounded-lg">
            <ArrowUpCircle className="w-6 h-6 text-emerald-600" />
          </div>
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Income</span>
        </div>
        <h3 className="text-3xl font-bold text-emerald-600">
          {formatCurrency(totalIncome)}
        </h3>
      </div>

      {/* Expense Card */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="p-2 bg-rose-50 rounded-lg">
            <ArrowDownCircle className="w-6 h-6 text-rose-600" />
          </div>
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Expenses</span>
        </div>
        <h3 className="text-3xl font-bold text-rose-600">
          {formatCurrency(totalExpense)}
        </h3>
      </div>
    </div>
  );
};

export default SummaryCards;
