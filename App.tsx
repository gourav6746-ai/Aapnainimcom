
import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { query, where, onSnapshot, collection } from 'firebase/firestore';
import { auth, db, transactionsCollection } from './firebase';
import { UserProfile, Transaction, BankAccount } from './types';
import Auth from './components/Auth';
import Layout from './components/Layout';
import SummaryCards from './components/SummaryCards';
import CategoryChart from './components/CategoryChart';
import TransactionForm from './components/TransactionForm';
import TransactionTable from './components/TransactionTable';
import BankDashboard from './components/BankDashboard';
import { Loader2, AlertCircle, Sparkles } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);

  // Listen for Auth changes and the custom 'enter-demo-mode' event
  useEffect(() => {
    const handleDemoMode = () => {
      setIsDemo(true);
      setUser({
        uid: 'demo-user-id',
        email: 'demo@aapnaincom.com',
        displayName: 'Guest Explorer',
        photoURL: null
      });
    };

    window.addEventListener('enter-demo-mode', handleDemoMode);

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL
        });
        setIsDemo(false);
      } else if (!isDemo) {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      window.removeEventListener('enter-demo-mode', handleDemoMode);
    };
  }, [isDemo]);

  // Real-time Firestore updates or Demo Mocking
  useEffect(() => {
    if (!user) {
      setTransactions([]);
      setBankAccounts([]);
      return;
    }

    if (isDemo) {
      setTransactions([
        {
          id: 't1',
          userId: user.uid,
          amount: 75000,
          date: new Date().toISOString().split('T')[0],
          description: 'Investment Profit',
          type: 'income',
          category: 'Investment',
          paymentMethod: 'bank',
          bankName: 'SBI Bank',
          createdAt: Date.now()
        },
        {
          id: 't2',
          userId: user.uid,
          amount: 2400,
          date: new Date().toISOString().split('T')[0],
          description: 'Smart Gadget',
          type: 'expense',
          category: 'Shopping',
          paymentMethod: 'bank',
          bankName: 'HDFC Bank',
          createdAt: Date.now() - 1000
        },
        {
          id: 't3',
          userId: user.uid,
          amount: 500,
          date: new Date().toISOString().split('T')[0],
          description: 'Street Food',
          type: 'expense',
          category: 'Food',
          paymentMethod: 'cash',
          createdAt: Date.now() - 2000
        }
      ]);
      setBankAccounts([
        {
          id: 'b1',
          userId: user.uid,
          bankId: 'sbi',
          bankName: 'SBI Bank',
          accountNumberMasked: '**** **** **** 8821',
          balance: 125000,
          status: 'active',
          createdAt: Date.now()
        },
        {
          id: 'b2',
          userId: user.uid,
          bankId: 'hdfc',
          bankName: 'HDFC Bank',
          accountNumberMasked: '**** **** **** 4410',
          balance: 62000,
          status: 'frozen',
          createdAt: Date.now()
        }
      ]);
      return;
    }

    // Transactions listener
    const tQuery = query(transactionsCollection, where('userId', '==', user.uid));
    const unsubscribeT = onSnapshot(tQuery, (snapshot) => {
      const data: Transaction[] = [];
      snapshot.forEach((doc) => data.push({ id: doc.id, ...doc.data() } as Transaction));
      setTransactions(data.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
    });

    // Bank accounts listener
    const bQuery = query(collection(db, 'bankAccounts'), where('userId', '==', user.uid));
    const unsubscribeB = onSnapshot(bQuery, (snapshot) => {
      const data: BankAccount[] = [];
      snapshot.forEach((doc) => data.push({ id: doc.id, ...doc.data() } as BankAccount));
      setBankAccounts(data);
    }, (err) => {
      console.error("Firestore Bank sync error:", err);
      if (err.code !== 'permission-denied') {
        setError("Database sync restricted. Check rules.");
      }
    });

    return () => {
      unsubscribeT();
      unsubscribeB();
    };
  }, [user, isDemo]);

  // Totals
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const totalBalance = totalIncome - totalExpense;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
          <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">Aapnaincom Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Auth />;

  return (
    <Layout user={user}>
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-12 pb-24">
        {isDemo && (
          <div className="p-4 bg-indigo-600 text-white rounded-[1.5rem] flex items-center justify-between shadow-xl shadow-indigo-100 border border-indigo-400">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 animate-pulse" />
              <div className="flex flex-col">
                <p className="text-[10px] font-black uppercase tracking-widest">Demo Mode Active</p>
                <p className="text-[9px] font-bold opacity-80 leading-none">Database interactions are simulated for this preview.</p>
              </div>
            </div>
            <button 
              onClick={() => window.location.reload()} 
              className="text-[9px] font-black uppercase tracking-widest bg-white/20 px-4 py-2 rounded-xl hover:bg-white/30 transition-all border border-white/20"
            >
              Exit Demo
            </button>
          </div>
        )}

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center space-x-3 text-rose-600">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-xs font-bold uppercase tracking-wider">{error}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight uppercase">Dashboard</h1>
            <p className="text-gray-400 font-bold text-lg">Greetings, {user.displayName?.split(' ')[0] || 'Friend'}.</p>
          </div>
          {!isDemo && <TransactionForm userId={user.uid} />}
        </div>

        <SummaryCards
          totalBalance={totalBalance}
          totalIncome={totalIncome}
          totalExpense={totalExpense}
        />

        <BankDashboard user={user} bankAccounts={bankAccounts} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <CategoryChart transactions={transactions} />
          
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 min-h-[400px]">
            <h2 className="text-xl font-black text-gray-900 mb-8 uppercase tracking-widest flex items-center justify-between">
              <span>Financial Vitals</span>
              <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full tracking-[0.2em]">LIVE REPORT</span>
            </h2>
            <div className="space-y-8">
              <div className="p-6 bg-indigo-50/50 rounded-3xl border border-indigo-100">
                <p className="text-xs font-black text-indigo-900 mb-4 uppercase tracking-widest">Savings Retention Rate</p>
                <div className="flex items-center space-x-6">
                  <div className="flex-1 bg-white h-4 rounded-full overflow-hidden shadow-inner">
                    <div 
                      className="bg-indigo-600 h-full transition-all duration-1000 shadow-[0_0_15px_rgba(79,70,229,0.3)]" 
                      style={{ width: `${Math.min(100, Math.max(0, (totalBalance / (totalIncome || 1)) * 100))}%` }}
                    />
                  </div>
                  <span className="text-xl font-black text-indigo-600">
                    {totalIncome > 0 ? Math.round((totalBalance / totalIncome) * 100) : 0}%
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2">Activities</p>
                  <p className="text-3xl font-black text-gray-900">{transactions.length}</p>
                </div>
                <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2">Avg Spent</p>
                  <p className="text-3xl font-black text-gray-900">
                    ₹{Math.round(totalExpense / (transactions.filter(t => t.type === 'expense').length || 1)).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className={`p-6 rounded-3xl border-2 font-black text-sm uppercase tracking-widest text-center transition-all ${totalBalance > 0 ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'}`}>
                {totalBalance > 0 
                  ? "Surplus Detected: Keep Investing" 
                  : "Deficit Warning: Audit Your Spends"}
              </div>
            </div>
          </div>
        </div>

        <TransactionTable transactions={transactions} bankAccounts={bankAccounts} />
      </div>
    </Layout>
  );
};

export default App;
