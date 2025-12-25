import { useState, useEffect } from 'react';
import Navbar from './Navbar';
import Branches from '../pages/Branches';
import AllBranches from '../pages/AllBranches';
import BranchCommissionReport from '../pages/BranchCommissionReport';
import Transactions from '../pages/Transactions';
import CreateUser from '../pages/CreateUser';
import IpTracing from '../pages/IpTracing';
import TransactionDetails from '../pages/TransactionDetails';
import BranchDetails from '../pages/BranchDetails';
import { api } from '../utils/api'; // For search if needed, or pass prop

export default function DashboardLayout() {
  const [currentPage, setCurrentPage] = useState('transactions'); // Default to transactions with sidebar
  const [selectedTransactionId, setSelectedTransactionId] = useState(null);
  const [selectedBranchId, setSelectedBranchId] = useState(null); // For branch details
  const [branchSearchQuery, setBranchSearchQuery] = useState('');

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
    setCurrentPage('transactions');
    setSelectedTransactionId(null);
    setSelectedBranchId(null);
  };

  const handleBranchClick = (branchId) => {
    setSelectedBranchId(branchId);
    setCurrentPage('branch-details');
  };



  const renderPage = () => {
    switch (currentPage) {
      case 'all-branches':
        return <AllBranches onBranchClick={handleBranchClick} initialSearch={branchSearchQuery} />;
      case 'commission-report':
        return <BranchCommissionReport />;
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
      case 'branch-details':
        return <BranchDetails
          branchId={selectedBranchId}
          onBack={() => setCurrentPage('all-branches')}
        />;
      default:
        return <Transactions />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />
      <div className="flex-1 overflow-auto">
        {renderPage()}
      </div>
    </div>
  );
}
