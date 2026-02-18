
import React from 'react';
import { LogOut, LayoutDashboard, Wallet, User as UserIcon } from 'lucide-react';
import { UserProfile } from '../types';
import { logout } from '../firebase';

interface LayoutProps {
  children: React.ReactNode;
  user: UserProfile;
}

const Layout: React.FC<LayoutProps> = ({ children, user }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-2">
              <Wallet className="w-8 h-8 text-indigo-600" />
              <span className="text-2xl font-bold text-gray-900 tracking-tight">Aapnaincom</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-2 mr-4">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="User" className="w-8 h-8 rounded-full border border-gray-200" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                    <UserIcon className="w-5 h-5 text-indigo-600" />
                  </div>
                )}
                <span className="text-sm font-medium text-gray-700">{user.displayName || user.email}</span>
              </div>
              
              <button
                onClick={logout}
                className="flex items-center space-x-2 text-gray-500 hover:text-red-600 transition-colors text-sm font-medium"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8">
        {children}
      </main>
      
      <footer className="bg-white border-t border-gray-100 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-400">
          © {new Date().getFullYear()} Aapnaincom. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Layout;
