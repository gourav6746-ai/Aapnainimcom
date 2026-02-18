
import React, { useState } from 'react';
import { Search, Trash2, ArrowUpRight, ArrowDownRight, Landmark, Banknote } from 'lucide-react';
import { Transaction, BankAccount } from '../types';
import { db, doc, deleteDoc, updateDoc } from '../firebase';

interface TransactionTableProps {
  transactions: Transaction[];
  bankAccounts: BankAccount[];
}

const TransactionTable: React.FC<TransactionTableProps> = ({ transactions, bankAccounts }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (t.bankName?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || t.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleDelete = async (transaction: Transaction) => {
    if (window.confirm('Kya aap is transaction ko delete karna chahte hain? Bank balance apne aap theek ho jayega.')) {
      try {
        // 1. Reconcile Balance if it was a bank transaction
        if (transaction.paymentMethod === 'bank' && transaction.bankAccountId) {
          const targetBank = bankAccounts.find(b => b.id === transaction.bankAccountId);
          if (targetBank) {
            const bankRef = doc(db, 'bankAccounts', targetBank.id);
            const currentBal = Number(targetBank.balance) || 0;
            const amount = Number(transaction.amount) || 0;
            
            // Logic: Reverse the operation. 
            // If we delete an income (which added money), we must subtract that money back.
            // If we delete an expense (which subtracted money), we must add that money back.
            const newBalance = transaction.type === 'income' 
              ? currentBal - amount 
              : currentBal + amount;
            
            await updateDoc(bankRef, { balance: newBalance });
          }
        }

        // 2. Delete the actual transaction document from Firestore
        const transactionRef = doc(db, 'transactions', transaction.id);
        await deleteDoc(transactionRef);
      } catch (err) {
        console.error("Delete transaction error:", err);
        alert("Transaction delete nahi ho paayi. Error check karein.");
      }
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(val);
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mt-8 transition-all hover:shadow-md">
      <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Transaction History</h2>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Auditing your records</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search history..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none w-full sm:w-48 transition-all"
            />
          </div>
          <div className="flex items-center space-x-1 bg-gray-50 p-1 rounded-xl border border-gray-100 shadow-inner">
            {(['all', 'income', 'expense'] as const).map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${filterType === type ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-400 text-[10px] uppercase tracking-widest font-black">
            <tr>
              <th className="px-6 py-4">Record</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Method</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4 text-right">Amount</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center text-gray-300 font-bold uppercase text-[10px] tracking-[0.2em]">
                  No history found in this view
                </td>
              </tr>
            ) : (
              filteredTransactions.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-xl shadow-sm ${t.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        {t.type === 'income' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900 text-sm group-hover:text-indigo-600 transition-colors">{t.description}</span>
                        {t.bankName && <span className="text-[9px] text-indigo-400 font-black uppercase tracking-tight">{t.bankName}</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded-lg text-[10px] font-black uppercase bg-gray-100 text-gray-500 shadow-sm border border-gray-200">
                      {t.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2 text-gray-400">
                      {t.paymentMethod === 'bank' ? <Landmark className="w-3.5 h-3.5" /> : <Banknote className="w-3.5 h-3.5" />}
                      <span className="text-[10px] font-bold uppercase tracking-tight">{t.paymentMethod}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[11px] font-bold text-gray-500">
                    {formatDate(t.date)}
                  </td>
                  <td className={`px-6 py-4 text-right font-black ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDelete(t)}
                      className="p-2 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all active:scale-90"
                      title="Delete Entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionTable;
