import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Dashboard from '../pages/Dashboard';
import Branches from '../pages/Branches';
import Transactions from '../pages/Transactions';
import CreateUser from '../pages/CreateUser';
import IpTracing from '../pages/IpTracing';
import TransactionDetails from '../pages/TransactionDetails';

export default function DashboardLayout() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedTransactionId, setSelectedTransactionId] = useState(null);

  useEffect(() => {
    // Check for deep linking param (transactionId)
    const params = new URLSearchParams(window.location.search);
    const transactionId = params.get('transactionId');
    if (transactionId) {
      setSelectedTransactionId(transactionId);
      setCurrentPage('transaction-details');
      // Clean up URL
      window.history.replaceState({}, '', '/');
    }
  }, []);

  const handleBackToDashboard = () => {
    setCurrentPage('dashboard');
    setSelectedTransactionId(null);
  };

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
      case 'ip-tracing':
        return <IpTracing />;
      case 'transaction-details':
        return <TransactionDetails
          transactionId={selectedTransactionId}
          onBack={handleBackToDashboard}
        />;
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
