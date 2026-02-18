
import React, { useState, useEffect } from 'react';
import { PlusCircle, X, Landmark, Banknote } from 'lucide-react';
import { TransactionType, PaymentMethod, INCOME_CATEGORIES, EXPENSE_CATEGORIES, BankAccount } from '../types';
import { addDoc, transactionsCollection, query, where, db, onSnapshot, doc, updateDoc, collection } from '../firebase';

interface TransactionFormProps {
  userId: string;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ userId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank');
  const [selectedBankAccountId, setSelectedBankAccountId] = useState('');
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [userBanks, setUserBanks] = useState<BankAccount[]>([]);

  useEffect(() => {
    if (!userId || !isOpen) return;
    const q = query(collection(db, 'bankAccounts'), where('userId', '==', userId));
    const unsub = onSnapshot(q, (snapshot) => {
      const banks: BankAccount[] = [];
      snapshot.forEach(doc => banks.push({ id: doc.id, ...doc.data() } as BankAccount));
      setUserBanks(banks);
      if (banks.length > 0 && !selectedBankAccountId) {
        setSelectedBankAccountId(banks[0].id);
      }
    });
    return unsub;
  }, [userId, isOpen, selectedBankAccountId]);

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || !description || !category || !date) return;

    let targetBank: BankAccount | undefined;
    if (paymentMethod === 'bank') {
      targetBank = userBanks.find(b => b.id === selectedBankAccountId);
      if (!targetBank) {
        alert("Please select a linked bank account first.");
        return;
      }
    }

    setLoading(true);
    try {
      // 1. Add Transaction
      await addDoc(transactionsCollection, {
        userId,
        amount: parsedAmount,
        description,
        type,
        category,
        paymentMethod,
        bankAccountId: paymentMethod === 'bank' ? selectedBankAccountId : null,
        bankName: paymentMethod === 'bank' && targetBank ? targetBank.bankName : '',
        date,
        createdAt: Date.now()
      });

      // 2. Adjust Bank Balance
      if (paymentMethod === 'bank' && targetBank) {
        const bankRef = doc(db, 'bankAccounts', targetBank.id);
        const currentBalance = Number(targetBank.balance) || 0;
        const newBalance = type === 'income' 
          ? currentBalance + parsedAmount 
          : currentBalance - parsedAmount;
        
        await updateDoc(bankRef, { balance: newBalance });
      }

      setAmount('');
      setDescription('');
      setIsOpen(false);
    } catch (err) {
      console.error("Submit error:", err);
      alert("Failed to save transaction.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 sm:static bg-indigo-600 text-white px-8 py-4 rounded-3xl shadow-2xl hover:bg-indigo-700 transition-all flex items-center space-x-3 font-black uppercase text-xs z-40"
      >
        <PlusCircle className="w-5 h-5" />
        <span>New Transaction</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="flex items-center justify-between p-8 border-b border-gray-50 bg-gray-50/50">
              <h2 className="text-2xl font-black text-gray-900 uppercase">Entry Form</h2>
              <button onClick={() => setIsOpen(false)} className="bg-white p-3 rounded-2xl shadow-sm text-gray-400 hover:text-gray-600 border border-gray-100">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
              <div className="flex p-1.5 bg-gray-100 rounded-2xl">
                <button
                  type="button"
                  onClick={() => { setType('expense'); setCategory(EXPENSE_CATEGORIES[0]); }}
                  className={`flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all ${type === 'expense' ? 'bg-white text-rose-600 shadow-md' : 'text-gray-400'}`}
                >
                  Expense
                </button>
                <button
                  type="button"
                  onClick={() => { setType('income'); setCategory(INCOME_CATEGORIES[0]); }}
                  className={`flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all ${type === 'income' ? 'bg-white text-emerald-600 shadow-md' : 'text-gray-400'}`}
                >
                  Income
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button type="button" onClick={() => setPaymentMethod('bank')} className={`flex flex-col items-center p-4 border-2 rounded-2xl transition-all gap-2 ${paymentMethod === 'bank' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-50 text-gray-400'}`}>
                  <Landmark className="w-6 h-6" />
                  <span className="text-[10px] font-black uppercase">Bank</span>
                </button>
                <button type="button" onClick={() => setPaymentMethod('cash')} className={`flex flex-col items-center p-4 border-2 rounded-2xl transition-all gap-2 ${paymentMethod === 'cash' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-50 text-gray-400'}`}>
                  <Banknote className="w-6 h-6" />
                  <span className="text-[10px] font-black uppercase">Cash</span>
                </button>
              </div>

              {paymentMethod === 'bank' && (
                <div className="space-y-2">
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Select Account</label>
                  {userBanks.length > 0 ? (
                    <select
                      value={selectedBankAccountId}
                      onChange={(e) => setSelectedBankAccountId(e.target.value)}
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none font-bold"
                    >
                      {userBanks.map(bank => (
                        <option key={bank.id} value={bank.id}>{bank.bankName} ({bank.accountNumberMasked.slice(-4)})</option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-xs text-rose-500 font-bold">No linked banks! Add one first.</p>
                  )}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase mb-2">Amount (₹)</label>
                  <input type="number" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-black text-3xl" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase mb-2">Description</label>
                  <input type="text" required value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold" placeholder="Reason for transaction" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase mb-2">Category</label>
                    <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold">
                      {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase mb-2">Date</label>
                    <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold" />
                  </div>
                </div>
              </div>

              <button type="submit" disabled={loading || (paymentMethod === 'bank' && userBanks.length === 0)} className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-lg hover:bg-indigo-700 transition-all shadow-xl disabled:opacity-50">
                {loading ? 'Processing...' : 'Save Entry'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default TransactionForm;
