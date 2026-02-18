
import React, { useState } from 'react';
import { Building2, Plus, QrCode, X, Landmark, Trash2, ArrowUpCircle, ArrowDownCircle, Info, Snowflake, ShieldCheck, ShieldAlert } from 'lucide-react';
import { BankAccount, UserProfile, SUPPORTED_BANKS } from '../types';
import { addDoc, db, deleteDoc, doc, updateDoc, banksCollection, collection } from '../firebase';

interface BankDashboardProps {
  user: UserProfile;
  bankAccounts: BankAccount[];
}

const BankDashboard: React.FC<BankDashboardProps> = ({ user, bankAccounts }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [isReceiving, setIsReceiving] = useState(false);
  const [selectedBankId, setSelectedBankId] = useState(SUPPORTED_BANKS[0].id);
  const [accountNumber, setAccountNumber] = useState('');
  const [openingBalance, setOpeningBalance] = useState('');
  const [activeBank, setActiveBank] = useState<BankAccount | null>(null);

  const handleAddBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountNumber) return;
    const bankMeta = SUPPORTED_BANKS.find(b => b.id === selectedBankId);
    if (!bankMeta) return;

    const startBalance = parseFloat(openingBalance) || 0;

    try {
      await addDoc(banksCollection, {
        userId: user.uid,
        bankId: bankMeta.id,
        bankName: bankMeta.name,
        accountNumberMasked: `**** **** **** ${accountNumber.slice(-4)}`,
        balance: startBalance,
        status: 'active',
        createdAt: Date.now()
      });
      setIsAdding(false);
      setAccountNumber('');
      setOpeningBalance('');
    } catch (err) {
      console.error("Add Bank error:", err);
      alert("Error linking bank. Check permissions.");
    }
  };

  const toggleFreeze = async (bankId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'frozen' : 'active';
    try {
      const bankRef = doc(db, 'bankAccounts', bankId);
      await updateDoc(bankRef, { status: newStatus });
    } catch (err) {
      console.error("Toggle freeze error:", err);
    }
  };

  const adjustBalance = async (bank: BankAccount, type: 'deposit' | 'withdraw') => {
    if (bank.status === 'frozen') {
      alert("This account is FROZEN. Please unfreeze to perform transactions.");
      return;
    }

    const actionLabel = type === 'deposit' ? 'DEPOSIT (Jama)' : 'WITHDRAW (Nikalna)';
    const amountStr = window.prompt(`Enter amount to ${actionLabel}:`);
    
    if (amountStr === null || amountStr.trim() === "") return;
    
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    const currentBal = Number(bank.balance) || 0;
    const newBalance = type === 'deposit' ? currentBal + amount : currentBal - amount;
    
    if (newBalance < 0) {
      alert("Insufficient funds in this bank account.");
      return;
    }

    try {
      const bankRef = doc(db, 'bankAccounts', bank.id);
      
      // 1. Atomic Balance Update
      await updateDoc(bankRef, { balance: newBalance });

      // 2. Synchronize with Transaction Ledger
      await addDoc(collection(db, 'transactions'), {
        userId: user.uid,
        amount: amount,
        description: `Manual Bank ${type === 'deposit' ? 'Deposit' : 'Withdrawal'}`,
        type: type === 'deposit' ? 'income' : 'expense',
        category: 'Adjustment',
        paymentMethod: 'bank',
        bankAccountId: bank.id,
        bankName: bank.bankName,
        date: new Date().toISOString().split('T')[0],
        createdAt: Date.now()
      });

    } catch (err) {
      console.error("Adjustment error:", err);
      alert("System sync failed.");
    }
  };

  const removeBank = async (id: string) => {
    if (window.confirm('WARNING: Deleting this card will remove it from your dashboard permanently. Transactions will remain in history. Proceed?')) {
      try {
        await deleteDoc(doc(db, 'bankAccounts', id));
      } catch (err) {
        alert("Delete failed.");
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-gray-900 flex items-center gap-3 uppercase tracking-tight">
          <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-100">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          Bank Management
        </h2>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95"
        >
          <Plus className="w-4 h-4" /> Link Account
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {bankAccounts.length === 0 ? (
          <div className="col-span-full py-24 border-2 border-dashed border-gray-200 rounded-[3rem] flex flex-col items-center justify-center text-gray-400 bg-white/50 backdrop-blur-sm">
            <Landmark className="w-20 h-20 mb-4 opacity-10 text-indigo-900" />
            <p className="font-black uppercase tracking-widest text-xs">No active bank links</p>
            <button onClick={() => setIsAdding(true)} className="mt-6 px-6 py-2 bg-indigo-50 text-indigo-600 rounded-full font-bold text-[10px] uppercase hover:bg-indigo-100 transition-all">Link Now</button>
          </div>
        ) : (
          bankAccounts.map((bank) => {
            const meta = SUPPORTED_BANKS.find(b => b.id === bank.bankId) || SUPPORTED_BANKS[0];
            const isFrozen = bank.status === 'frozen';

            return (
              <div 
                key={bank.id}
                className={`group relative overflow-hidden rounded-[2.5rem] shadow-2xl transition-all p-8 flex flex-col justify-between h-72 ${meta.color} text-white ${isFrozen ? 'grayscale opacity-80' : 'hover:-translate-y-2'}`}
              >
                {/* Visual Decorative Layer */}
                <div className="absolute -right-12 -top-12 opacity-10 group-hover:rotate-12 transition-transform duration-700">
                  <Landmark className="w-64 h-64" />
                </div>
                
                {isFrozen && (
                  <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-[2px] z-20 flex items-center justify-center flex-col gap-2">
                    <Snowflake className="w-12 h-12 text-blue-200 animate-pulse" />
                    <span className="font-black uppercase tracking-[0.3em] text-[10px]">Account Frozen</span>
                  </div>
                )}

                <div className="flex justify-between items-start relative z-10">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">{meta.name}</p>
                    <p className="text-xl font-mono font-bold tracking-widest">{bank.accountNumberMasked}</p>
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => toggleFreeze(bank.id, bank.status)}
                      className={`p-3 rounded-2xl transition-all border backdrop-blur-md shadow-lg ${isFrozen ? 'bg-blue-500 border-blue-400' : 'bg-white/10 border-white/20 hover:bg-blue-500'}`}
                      title={isFrozen ? "Unfreeze" : "Freeze"}
                    >
                      {isFrozen ? <ShieldAlert className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                    </button>
                    <button 
                      onClick={() => removeBank(bank.id)}
                      className="p-3 bg-white/10 hover:bg-rose-600 rounded-2xl transition-all border border-white/20 backdrop-blur-md shadow-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="relative z-10 mt-auto">
                  <p className="text-[10px] uppercase font-black tracking-widest opacity-80 mb-1">Total Balance</p>
                  <div className="flex items-end gap-3">
                    <h3 className="text-4xl font-black tracking-tighter">₹{Number(bank.balance).toLocaleString('en-IN')}</h3>
                  </div>
                </div>
                
                <div className="flex gap-2 relative z-10 pt-6">
                  <button 
                    disabled={isFrozen}
                    onClick={() => adjustBalance(bank, 'deposit')} 
                    className="flex-1 py-3.5 bg-white/20 hover:bg-white/40 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all border border-white/20 backdrop-blur-md disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ArrowUpCircle className="w-4 h-4" /> Deposit
                  </button>
                  <button 
                    disabled={isFrozen}
                    onClick={() => adjustBalance(bank, 'withdraw')} 
                    className="flex-1 py-3.5 bg-white/20 hover:bg-white/40 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all border border-white/20 backdrop-blur-md disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ArrowDownCircle className="w-4 h-4" /> Withdraw
                  </button>
                  <button 
                    onClick={() => { setActiveBank(bank); setIsReceiving(true); }} 
                    className="p-3.5 bg-white/20 hover:bg-white/40 rounded-2xl transition-all border border-white/20 backdrop-blur-md"
                  >
                    <QrCode className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-indigo-600 text-white">
              <div className="flex items-center gap-3">
                <Landmark className="w-6 h-6" />
                <h3 className="text-lg font-black uppercase tracking-tight">Setup New Card</h3>
              </div>
              <button onClick={() => setIsAdding(false)} className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition-all"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleAddBank} className="p-8 space-y-6">
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Select Partner Bank</label>
                <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-2 custom-scrollbar p-1">
                  {SUPPORTED_BANKS.map(bank => (
                    <button
                      key={bank.id}
                      type="button"
                      onClick={() => setSelectedBankId(bank.id)}
                      className={`p-4 text-left rounded-2xl border-2 transition-all flex flex-col gap-1 ${selectedBankId === bank.id ? 'border-indigo-600 bg-indigo-50 shadow-inner' : 'border-gray-50 hover:border-gray-200'}`}
                    >
                      <span className={`text-[11px] font-black uppercase ${selectedBankId === bank.id ? 'text-indigo-700' : 'text-gray-500'}`}>{bank.name}</span>
                      <div className={`h-1.5 w-8 rounded-full ${bank.color}`}></div>
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Card Last 4 Digits</label>
                  <input 
                    type="text" 
                    maxLength={4} 
                    placeholder="8888" 
                    value={accountNumber} 
                    onChange={e => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-mono text-2xl tracking-[0.5em] text-center focus:ring-4 focus:ring-indigo-100 transition-all"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Initial Balance (INR)</label>
                  <input 
                    type="number" 
                    placeholder="₹0.00" 
                    value={openingBalance} 
                    onChange={e => setOpeningBalance(e.target.value)}
                    className="w-full px-6 py-5 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-black text-2xl text-center focus:ring-4 focus:ring-indigo-100 transition-all"
                  />
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-2xl flex gap-3 text-blue-700 border border-blue-100">
                <Info className="w-5 h-5 flex-shrink-0" />
                <p className="text-[10px] uppercase font-bold leading-relaxed">System syncs with your global dashboard automatically upon deposit/withdrawal.</p>
              </div>

              <button className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 uppercase tracking-[0.2em] active:scale-95">
                Confirm & Sync
              </button>
            </form>
          </div>
        </div>
      )}

      {isReceiving && activeBank && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-sm overflow-hidden p-12 text-center animate-in zoom-in duration-300">
             <div className="flex justify-between items-center mb-8">
                <h3 className="font-black text-gray-900 uppercase tracking-widest text-[10px]">Merchant UPI QR</h3>
                <button onClick={() => setIsReceiving(false)} className="text-gray-400 hover:text-gray-900 bg-gray-50 p-2 rounded-full transition-colors"><X className="w-5 h-5" /></button>
             </div>
             <div className="p-10 bg-gray-50 rounded-[3rem] mb-10 border border-gray-100 flex items-center justify-center shadow-inner">
                <QrCode className="w-48 h-48 text-indigo-900" />
             </div>
             <div className="space-y-2">
               <p className="text-2xl font-black text-gray-900">{activeBank.bankName}</p>
               <div className="bg-indigo-50 px-4 py-2 rounded-full inline-block">
                <p className="text-xs text-indigo-600 font-mono font-bold">{user.email?.split('@')[0]}@ok{activeBank.bankId}</p>
               </div>
             </div>
             <button onClick={() => setIsReceiving(false)} className="mt-12 w-full py-5 bg-gray-900 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-[0.3em] hover:bg-black transition-all">Dismiss</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BankDashboard;
