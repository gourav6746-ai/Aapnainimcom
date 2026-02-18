
export type TransactionType = 'income' | 'expense';
export type PaymentMethod = 'cash' | 'bank';

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  date: string;
  description: string;
  type: TransactionType;
  category: string;
  paymentMethod: PaymentMethod;
  bankName?: string;
  bankAccountId?: string;
  createdAt: number;
}

export interface BankAccount {
  id: string;
  userId: string;
  bankId: string;
  bankName: string;
  accountNumberMasked: string;
  balance: number;
  status: 'active' | 'frozen';
  createdAt: number;
}

export interface BankMetadata {
  id: string;
  name: string;
  color: string;
  textColor: string;
}

export const SUPPORTED_BANKS: BankMetadata[] = [
  { id: 'hdfc', name: 'HDFC Bank', color: 'bg-[#004c8f]', textColor: 'text-white' },
  { id: 'sbi', name: 'State Bank of India', color: 'bg-[#29aae1]', textColor: 'text-white' },
  { id: 'icici', name: 'ICICI Bank', color: 'bg-[#f37021]', textColor: 'text-white' },
  { id: 'axis', name: 'Axis Bank', color: 'bg-[#97144d]', textColor: 'text-white' },
  { id: 'kotak', name: 'Kotak Mahindra', color: 'bg-[#ed1c24]', textColor: 'text-white' },
  { id: 'bob', name: 'Bank of Baroda', color: 'bg-[#fe5100]', textColor: 'text-white' },
  { id: 'pnb', name: 'Punjab National Bank', color: 'bg-[#a2192e]', textColor: 'text-white' },
  { id: 'canara', name: 'Canara Bank', color: 'bg-[#0091d3]', textColor: 'text-white' },
  { id: 'union', name: 'Union Bank', color: 'bg-[#e21e26]', textColor: 'text-white' },
  { id: 'indusind', name: 'IndusInd Bank', color: 'bg-[#91282c]', textColor: 'text-white' },
];

export const INCOME_CATEGORIES = [
  'Salary',
  'Freelance',
  'Investment',
  'Gift',
  'Bonus',
  'Other Income',
  'Adjustment'
];

export const EXPENSE_CATEGORIES = [
  'Food',
  'Rent',
  'Bills',
  'Transport',
  'Shopping',
  'Healthcare',
  'Education',
  'Entertainment',
  'Travel',
  'Other Expense',
  'Adjustment'
];

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}
