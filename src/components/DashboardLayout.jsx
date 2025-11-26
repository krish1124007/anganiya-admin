import { useState } from 'react';
import Sidebar from './Sidebar';
import Dashboard from '../pages/Dashboard';
import Branches from '../pages/Branches';
import Transactions from '../pages/Transactions';
import CreateUser from '../pages/CreateUser';

export default function DashboardLayout() {
  const [currentPage, setCurrentPage] = useState('dashboard');

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'branches':
        return <Branches />;
      case 'transactions':
        return <Transactions />;
      case 'create-user':
        return <CreateUser />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <div className="flex-1 overflow-auto">
        {renderPage()}
      </div>
    </div>
  );
}
