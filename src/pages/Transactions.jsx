import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { Search, RotateCcw, Download, Check, Calendar, X, Plus, Edit, Trash, Copy, Printer } from 'lucide-react';
import { decrypt_number, decrypt_text } from "../utils/decrypt";
import { exportTableToPDF, printTableToPDF, formatNumber, formatDate } from '../utils/pdfExport';

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [approvingId, setApprovingId] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [branches, setBranches] = useState([]);
  const [createFormData, setCreateFormData] = useState({
    sender_branch: '',
    receiver_branch: '',
    points: '',
    receiver_name: '',
    receiver_mobile: '',
    sender_name: '',
    sender_mobile: '',
    commission: '',
    other_receiver: '',
    other_sender: '',
    narration: ''
  });
  const [receiverBranchSearch, setReceiverBranchSearch] = useState('');
  const [senderBranchSearch, setSenderBranchSearch] = useState('');
  const [showReceiverDropdown, setShowReceiverDropdown] = useState(false);
  const [showSenderDropdown, setShowSenderDropdown] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [editFormData, setEditFormData] = useState({
    points: '',
    receiver_name: '',
    receiver_mobile: '',
    sender_name: '',
    sender_mobile: '',
    commission: '',
    other_receiver: '',
    other_sender: '',
    sender_branch: '',
    receiver_branch: ''
  });

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      const response = await api.getAllBranches();
      if (response.success) {
        setBranches(response.data);
      }
    } catch (error) {
      console.error("Error fetching branches:", error);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.receiver-branch-container')) {
        setShowReceiverDropdown(false);
      }
      if (!event.target.closest('.sender-branch-container')) {
        setShowSenderDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      const filtered = transactions.filter(t =>
        (t.sender_name || '').toLowerCase().includes(lowerTerm) ||
        (t.receiver_name || '').toLowerCase().includes(lowerTerm) ||
        (t.sender_branch_name || '').toLowerCase().includes(lowerTerm) ||
        (t.receiver_branch_name || '').toLowerCase().includes(lowerTerm) ||
        (String(t.points) || '').includes(lowerTerm) ||
        (String(t.commission) || '').includes(lowerTerm) ||
        new Date(t.createdAt).toLocaleDateString().includes(lowerTerm)
      );
      setFilteredTransactions(filtered);
    } else {
      setFilteredTransactions(transactions);
    }
  }, [searchTerm, transactions]);


  const fetchTransactions = async () => {
    setLoading(true);
    try {
      // Pass date directly in YYYY-MM-DD format if selected
      const response = await api.getAllTransactions(selectedDate || null);
      if (response.success) {
        // Handle potentially missing data gracefully
        const decrypted = response.data.map((t) => ({
          ...t,
          sender_name: t.sender_name ? decrypt_text(t.sender_name) : '-',
          receiver_name: t.receiver_name ? decrypt_text(t.receiver_name) : '-',
          sender_mobile: t.sender_mobile ? decrypt_number(t.sender_mobile) : '-',
          receiver_mobile: t.receiver_mobile ? decrypt_number(t.receiver_mobile) : '-',
          points: t.points ? Number(decrypt_number(t.points)) : 0,
          commission: t.commission ? Number(t.commission) : 0,
          other_receiver: t.other_receiver || '-',
          other_sender: t.other_sender || '-',
        }));

        // ✅ FRONTEND FILTER: If no date selected, filter to show only today's transactions
        let filteredData = decrypted;
        if (!selectedDate) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const todayEnd = new Date();
          todayEnd.setHours(23, 59, 59, 999);

          filteredData = decrypted.filter(t => {
            const txDate = new Date(t.date || t.createdAt);
            return txDate >= today && txDate <= todayEnd;
          });
        }

        // Sort by date desc
        filteredData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).reverse();
        setTransactions(filteredData);
        setFilteredTransactions(filteredData);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (transactionId) => {
    setApprovingId(transactionId);
    try {
      const response = await api.giveTransactionPermission(transactionId);
      if (response.success) {
        // Refresh transactions to reflect the update
        await fetchTransactions();
        alert('Transaction approved successfully!');
      } else {
        alert(response.message || 'Failed to approve transaction');
      }
    } catch (error) {
      console.error("Error approving transaction:", error);
      alert('Error approving transaction');
    } finally {
      setApprovingId(null);
    }
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  const handleClearDate = () => {
    setSelectedDate('');
  };

  // Fetch transactions when date changes
  useEffect(() => {
    fetchTransactions();
  }, [selectedDate]);

  const calculateTotals = () => {
    return filteredTransactions.reduce((acc, t) => ({
      points: acc.points + (Number(t.points) || 0),
      commission: acc.commission + (Number(t.commission) || 0)
    }), { points: 0, commission: 0 });
  };

  const totals = calculateTotals();



  const handleCreateTransaction = () => {
    setShowCreateModal(true);
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setCreateFormData({
      sender_branch: '',
      receiver_branch: '',
      points: '',
      receiver_name: '',
      receiver_mobile: '',
      sender_name: '',
      sender_mobile: '',
      commission: '',
      other_receiver: '',
      other_sender: '',
      narration: ''
    });
    setReceiverBranchSearch('');
    setSenderBranchSearch('');
    setShowReceiverDropdown(false);
    setShowSenderDropdown(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCreateFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleReceiverBranchSelect = (branchId, branchName) => {
    setCreateFormData(prev => ({
      ...prev,
      receiver_branch: branchId
    }));
    setReceiverBranchSearch(branchName);
    setShowReceiverDropdown(false);
  };

  const handleSenderBranchSelect = (branchId, branchName) => {
    setCreateFormData(prev => ({
      ...prev,
      sender_branch: branchId
    }));
    setSenderBranchSearch(branchName);
    setShowSenderDropdown(false);
  };

  const getFilteredReceiverBranches = () => {
    if (!receiverBranchSearch) return branches;
    return branches.filter(b =>
      b.branch_name.toLowerCase().includes(receiverBranchSearch.toLowerCase())
    );
  };

  const getFilteredSenderBranches = () => {
    if (!senderBranchSearch) return branches;
    return branches.filter(b =>
      b.branch_name.toLowerCase().includes(senderBranchSearch.toLowerCase())
    );
  };

  const handleSubmitTransaction = async (e) => {
    e.preventDefault();

    // Validate that sender and receiver branches exist
    const senderBranchExists = branches.find(b => b._id === createFormData.sender_branch);
    const receiverBranchExists = branches.find(b => b._id === createFormData.receiver_branch);

    if (!senderBranchExists) {
      alert("❌ Error: Please select a valid Sender Branch from the dropdown list. The branch name you entered does not exist.");
      return;
    }

    if (!receiverBranchExists) {
      alert("❌ Error: Please select a valid Receiver Branch from the dropdown list. The branch name you entered does not exist.");
      return;
    }

    setLoading(true);
    try {
      // Ensure numeric values are numbers
      const payload = {
        ...createFormData,
        points: Number(createFormData.points),
        commission: Number(createFormData.commission),
        receiver_mobile: Number(createFormData.receiver_mobile),
        sender_mobile: Number(createFormData.sender_mobile)
      };

      const response = await api.createTransaction(payload);
      if (response.success) {
        const senderBranch = senderBranchExists.branch_name;
        const receiverBranch = receiverBranchExists.branch_name;

        const formattedMessage = `${createFormData.points} ${createFormData.receiver_mobile} ${createFormData.receiver_name} , ${receiverBranch} ${createFormData.other_receiver} ${senderBranch} ${createFormData.other_sender} , ${createFormData.sender_name} , ${createFormData.sender_mobile} ${createFormData.commission} ${createFormData.narration}`;

        setSuccessMessage(formattedMessage);
        setShowSuccessModal(true);
        handleCloseModal();
        fetchTransactions();
      } else {
        alert(response.message || "Failed to create transaction");
      }
    } catch (error) {
      console.error("Error creating transaction:", error);
      alert("Error creating transaction");
    } finally {
      setLoading(false);
    }
  };

  const handleEditTransaction = (transaction) => {
    setEditingTransaction(transaction);
    setEditFormData({
      points: String(transaction.points),
      receiver_name: transaction.receiver_name,
      receiver_mobile: String(transaction.receiver_mobile),
      sender_name: transaction.sender_name,
      sender_mobile: String(transaction.sender_mobile),
      commission: String(transaction.commission),
      other_receiver: transaction.other_receiver || '',
      other_sender: transaction.other_sender || '',
      sender_branch: transaction.sender_branch,
      receiver_branch: transaction.receiver_branch
    });
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingTransaction(null);
    setEditFormData({
      points: '',
      receiver_name: '',
      receiver_mobile: '',
      sender_name: '',
      sender_mobile: '',
      commission: '',
      other_receiver: '',
      other_sender: '',
      sender_branch: '',
      receiver_branch: ''
    });
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();

    // Validate that sender and receiver branches exist
    const senderBranchExists = branches.find(b => b._id === editFormData.sender_branch);
    const receiverBranchExists = branches.find(b => b._id === editFormData.receiver_branch);

    if (!senderBranchExists) {
      alert("❌ Error: Please select a valid Sender Branch from the dropdown list. The branch name you entered does not exist.");
      return;
    }

    if (!receiverBranchExists) {
      alert("❌ Error: Please select a valid Receiver Branch from the dropdown list. The branch name you entered does not exist.");
      return;
    }

    setLoading(true);
    try {
      // Prepare update data - only send fields that can be updated
      const update_data = {
        points: Number(editFormData.points),
        receiver_name: editFormData.receiver_name,
        receiver_mobile: Number(editFormData.receiver_mobile),
        sender_name: editFormData.sender_name,
        sender_mobile: Number(editFormData.sender_mobile),
        commission: Number(editFormData.commission),
        other_receiver: editFormData.other_receiver,
        other_sender: editFormData.other_sender,
        sender_branch: editFormData.sender_branch,
        receiver_branch: editFormData.receiver_branch
      };

      const response = await api.editTransaction(editingTransaction._id, update_data);
      if (response.success) {
        alert("Transaction updated successfully!");
        handleCloseEditModal();
        fetchTransactions();
      } else {
        alert(response.message || "Failed to update transaction");
      }
    } catch (error) {
      console.error("Error updating transaction:", error);
      alert("Error updating transaction");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTransaction = async (transactionId) => {
    if (!window.confirm("Are you sure you want to delete this transaction? This action will reverse any balance changes if the transaction was approved.")) {
      return;
    }

    setLoading(true);
    try {
      const response = await api.deleteTransaction(transactionId);
      if (response.success) {
        alert("Transaction deleted successfully!");
        fetchTransactions();
      } else {
        alert(response.message || "Failed to delete transaction");
      }
    } catch (error) {
      console.error("Error deleting transaction:", error);
      alert("Error deleting transaction");
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    const headers = ['Sr', 'Date', 'Points', 'Receiver', 'Other To', 'To', 'Other From', 'From', 'Comm', 'Receiver #', 'Sender', 'Approval', 'Status'];

    const data = filteredTransactions.map((t, index) => [
      index + 1,
      new Date(t.createdAt).toLocaleDateString('en-IN'),
      formatNumber(t.points),
      t.receiver_name,
      t.other_receiver || '-',
      t.receiver_branch_name,
      t.other_sender || '-',
      t.sender_branch_name,
      formatNumber(t.commission),
      t.receiver_mobile,
      t.sender_name,
      t.admin_permission ? 'Yes' : 'No',
      t.status ? 'Done' : 'Pending'
    ]);

    const footer = {
      "Total Records": filteredTransactions.length,
      "Total Points": formatNumber(totals.points),
      "Total Commission": formatNumber(totals.commission)
    };

    exportTableToPDF({
      title: 'All Transactions Report',
      headers,
      data,
      filename: `transactions-report-${new Date().toISOString().split('T')[0]}`,
      footer,
      landscape: true,
      columnStyles: {
        0: { cellWidth: 8 },   // Sr
        1: { cellWidth: 20 },  // Date
        2: { cellWidth: 18 },  // Points
        3: { cellWidth: 22 },  // Receiver
        4: { cellWidth: 18 },  // Other To
        5: { cellWidth: 28 },  // To
        6: { cellWidth: 18 },  // Other From
        7: { cellWidth: 28 },  // From
        8: { cellWidth: 15 },  // Comm
        9: { cellWidth: 22 },  // Receiver #
        10: { cellWidth: 22 }, // Sender
        11: { cellWidth: 15 }, // Approval
        12: { cellWidth: 15 }  // Status
      }
    });
  };

  const handlePrintPDF = () => {
    const headers = ['Sr', 'Date', 'Points', 'Receiver', 'Other To', 'To', 'Other From', 'From', 'Comm', 'Receiver #', 'Sender', 'Approval', 'Status'];

    const data = filteredTransactions.map((t, index) => [
      index + 1,
      new Date(t.createdAt).toLocaleDateString('en-IN'),
      formatNumber(t.points),
      t.receiver_name,
      t.other_receiver || '-',
      t.receiver_branch_name,
      t.other_sender || '-',
      t.sender_branch_name,
      formatNumber(t.commission),
      t.receiver_mobile,
      t.sender_name,
      t.admin_permission ? 'Yes' : 'No',
      t.status ? 'Done' : 'Pending'
    ]);

    const footer = {
      "Total Records": filteredTransactions.length,
      "Total Points": formatNumber(totals.points),
      "Total Commission": formatNumber(totals.commission)
    };

    printTableToPDF({
      title: 'All Transactions Report',
      headers,
      data,
      filename: `transactions-report-${new Date().toISOString().split('T')[0]}`,
      footer,
      landscape: true,
      columnStyles: {
        0: { cellWidth: 8 },   // Sr
        1: { cellWidth: 20 },  // Date
        2: { cellWidth: 18 },  // Points
        3: { cellWidth: 22 },  // Receiver
        4: { cellWidth: 18 },  // Other To
        5: { cellWidth: 28 },  // To
        6: { cellWidth: 18 },  // Other From
        7: { cellWidth: 28 },  // From
        8: { cellWidth: 15 },  // Comm
        9: { cellWidth: 22 },  // Receiver #
        10: { cellWidth: 22 }, // Sender
        11: { cellWidth: 15 }, // Approval
        12: { cellWidth: 15 }  // Status
      }
    });
  };

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-900 min-h-full">
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col h-[calc(100vh-90px)]">
        {/* Single Line Header with All Controls */}
        <div className="p-2.5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex items-center gap-2">
            {/* Title */}
            <div className="flex flex-col">
              <h1 className="text-sm font-bold text-gray-900 dark:text-white">Transactions</h1>
              <p className="text-2xs text-gray-500 dark:text-gray-400">All Transaction Records</p>
            </div>

            {/* Search Bar */}
            <div className="relative w-64 group ml-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border-2 border-gray-100 dark:border-gray-700 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-all outline-none"
              />
            </div>

            {/* Date Picker */}
            <div className="relative group w-40">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors pointer-events-none" />
              <input
                type="date"
                value={selectedDate}
                onChange={handleDateChange}
                className="w-full pl-9 pr-3 py-2 text-xs border-2 border-gray-100 dark:border-gray-700 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-all outline-none"
              />
            </div>

            {/* Clear Date */}
            {selectedDate && (
              <button
                onClick={handleClearDate}
                className="px-2.5 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl transition-all"
                title="Clear date"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Spacer */}
            <div className="flex-1"></div>

            {/* Action Buttons */}
            <button
              onClick={handleCreateTransaction}
              className="px-2.5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-1.5 transition-all text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Create</span>
            </button>
            <button
              onClick={handleExportPDF}
              className="px-2.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-1.5 transition-all text-xs font-semibold"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Export PDF</span>
            </button>
            <button
              onClick={handlePrintPDF}
              className="px-2.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-1.5 transition-all text-xs font-semibold"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Print PDF</span>
            </button>
            <button
              onClick={fetchTransactions}
              className="p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 hover:text-blue-600 hover:border-blue-500 transition-all"
              title="Refresh"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <table className="w-full text-2xs text-left">
              <thead className="table-header bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
                <tr>
                  <th className="px-2 py-1.5 text-left">Sr</th>
                  <th className="px-2 py-1.5 text-left">Date</th>
                  <th className="px-2 py-1.5 text-right">Points</th>
                  <th className="px-2 py-1.5 text-left">Receiver</th>
                  <th className="px-2 py-1.5 text-left">Other To</th>
                  <th className="px-2 py-1.5 text-left">To</th>
                  <th className="px-2 py-1.5 text-left">Other From</th>
                  <th className="px-2 py-1.5 text-left">From</th>
                  <th className="px-2 py-1.5 text-right">Comm</th>
                  <th className="px-2 py-1.5 text-left">Receiver #</th>
                  <th className="px-2 py-1.5 text-left">Sender</th>
                  <th className="px-2 py-1.5 text-left">Approval</th>
                  <th className="px-2 py-1.5 text-left">Status</th>
                  <th className="px-2 py-1.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((t, index) => (
                    <tr key={t._id} className="bg-gray-50 dark:bg-gray-700/30 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                      <td className="px-2 py-1 text-2xs text-gray-500 dark:text-gray-400">{index + 1}</td>
                      <td className="px-2 py-1 text-2xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {new Date(t.createdAt).toLocaleDateString('en-IN')} {new Date(t.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-2 py-1 text-right text-2xs font-semibold text-gray-900 dark:text-white numeric">
                        {t.points.toLocaleString('en-IN')}
                      </td>
                      <td className="px-2 py-1 text-2xs font-medium text-gray-900 dark:text-white">{t.receiver_name}</td>
                      <td className="px-2 py-1 text-2xs text-gray-500 dark:text-gray-400">{t.other_receiver || '-'}</td>
                      <td className="px-2 py-1">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                          {t.receiver_branch_name}
                        </span>
                      </td>
                      <td className="px-2 py-1 text-2xs text-gray-500 dark:text-gray-400">{t.other_sender || '-'}</td>
                      <td className="px-2 py-1">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                          {t.sender_branch_name}
                        </span>
                      </td>
                      <td className="px-2 py-1 text-right text-2xs font-semibold text-green-600 dark:text-green-400 numeric">
                        {t.commission.toLocaleString('en-IN')}
                      </td>
                      <td className="px-2 py-1 text-2xs text-gray-500 dark:text-gray-400">{t.receiver_mobile}</td>
                      <td className="px-2 py-1 text-2xs font-medium text-gray-900 dark:text-white">{t.sender_name}</td>
                      <td className="px-2 py-1">
                        {t.admin_permission ? (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            Approved
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                            Not Approved
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-1">
                        {t.status ? (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            Complete
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-1">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleEditTransaction(t)}
                            className="inline-flex items-center px-1.5 py-0.5 bg-orange-600 hover:bg-orange-700 text-white text-[9px] font-semibold rounded transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-2.5 h-2.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteTransaction(t._id)}
                            className="inline-flex items-center px-1.5 py-0.5 bg-red-600 hover:bg-red-700 text-white text-[9px] font-semibold rounded transition-colors"
                            title="Delete"
                          >
                            <Trash className="w-2.5 h-2.5" />
                          </button>
                          {!t.admin_permission && (
                            <button
                              onClick={() => handleApprove(t._id)}
                              disabled={approvingId === t._id}
                              className="inline-flex items-center px-1.5 py-0.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-[9px] font-semibold rounded transition-colors disabled:cursor-not-allowed"
                            >
                              {approvingId === t._id ? (
                                <div className="w-2.5 h-2.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <Check className="w-2.5 h-2.5" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="14" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      No transactions found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer Totals */}
        <div className="bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 px-3 py-2">
          <div className="flex justify-between items-center">
            <span className="text-2xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Total Records: {filteredTransactions.length}</span>
            <div className="flex gap-6">
              <div className="flex flex-col items-end">
                <span className="text-2xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Points</span>
                <span className="text-xs font-bold text-gray-900 dark:text-white numeric mt-0.5">{totals.points.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-2xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Commission</span>
                <span className="text-xs font-bold text-green-600 dark:text-green-400 numeric mt-0.5">{totals.commission.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Create Transaction Modal */}
      {
        showCreateModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/50 rounded-t-lg">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create New Transaction</h2>
                <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmitTransaction} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 1. Points (Amount) - First */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Points (Amount)</label>
                    <input
                      type="number"
                      name="points"
                      value={createFormData.points}
                      onChange={handleInputChange}
                      required
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                    {createFormData.points && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Formatted: {Number(createFormData.points).toLocaleString('en-IN')}
                      </p>
                    )}
                  </div>

                  {/* 2. Receiver Mobile - Second */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Receiver Mobile</label>
                    <input
                      type="number"
                      name="receiver_mobile"
                      value={createFormData.receiver_mobile}
                      onChange={handleInputChange}
                      required
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* 3. Receiver Name - Third */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Receiver Name</label>
                    <input
                      type="text"
                      name="receiver_name"
                      value={createFormData.receiver_name}
                      onChange={handleInputChange}
                      required
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* 4. Receiver Branch - Fourth */}
                  <div className="space-y-2 relative receiver-branch-container">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Receiver Branch</label>
                    <input
                      type="text"
                      value={receiverBranchSearch}
                      onChange={(e) => {
                        setReceiverBranchSearch(e.target.value);
                        setShowReceiverDropdown(true);
                      }}
                      onFocus={() => setShowReceiverDropdown(true)}
                      placeholder="Search receiver branch..."
                      required={!createFormData.receiver_branch}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                    {showReceiverDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {getFilteredReceiverBranches().length > 0 ? (
                          getFilteredReceiverBranches().map(b => (
                            <div
                              key={b._id}
                              onClick={() => handleReceiverBranchSelect(b._id, b.branch_name)}
                              className="px-4 py-2 hover:bg-blue-50 dark:hover:bg-gray-600 cursor-pointer text-gray-900 dark:text-white transition-colors"
                            >
                              {b.branch_name}
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-2 text-gray-500 dark:text-gray-400">
                            No branches found
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 5. Sender Branch - Fifth */}
                  <div className="space-y-2 relative sender-branch-container">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Sender Branch</label>
                    <input
                      type="text"
                      value={senderBranchSearch}
                      onChange={(e) => {
                        setSenderBranchSearch(e.target.value);
                        setShowSenderDropdown(true);
                      }}
                      onFocus={() => setShowSenderDropdown(true)}
                      placeholder="Search sender branch..."
                      required={!createFormData.sender_branch}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                    {showSenderDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {getFilteredSenderBranches().length > 0 ? (
                          getFilteredSenderBranches().map(b => (
                            <div
                              key={b._id}
                              onClick={() => handleSenderBranchSelect(b._id, b.branch_name)}
                              className="px-4 py-2 hover:bg-blue-50 dark:hover:bg-gray-600 cursor-pointer text-gray-900 dark:text-white transition-colors"
                            >
                              {b.branch_name}
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-2 text-gray-500 dark:text-gray-400">
                            No branches found
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 6. Sender Name - Sixth */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Sender Name</label>
                    <input
                      type="text"
                      name="sender_name"
                      value={createFormData.sender_name}
                      onChange={handleInputChange}
                      required
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* 7. Sender Mobile - Seventh */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Sender Mobile</label>
                    <input
                      type="number"
                      name="sender_mobile"
                      value={createFormData.sender_mobile}
                      onChange={handleInputChange}
                      required
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* 8. Commission - Eighth */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Commission</label>
                    <input
                      type="number"
                      name="commission"
                      value={createFormData.commission}
                      onChange={handleInputChange}
                      required
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                    {createFormData.commission && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Formatted: {Number(createFormData.commission).toLocaleString('en-IN')}
                      </p>
                    )}
                  </div>

                  {/* 9. Other Receiver (Optional) - Ninth */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Other Receiver (Optional)</label>
                    <input
                      type="text"
                      name="other_receiver"
                      value={createFormData.other_receiver}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* 10. Other Sender (Optional) - Tenth */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Other Sender (Optional)</label>
                    <input
                      type="text"
                      name="other_sender"
                      value={createFormData.other_sender}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* 11. Narration - Last */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Narration (Optional)</label>
                    <input
                      type="text"
                      name="narration"
                      value={createFormData.narration}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {loading ? 'Creating...' : 'Create Transaction'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )
      }

      {/* Edit Transaction Modal */}
      {
        showEditModal && editingTransaction && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-orange-50 dark:bg-orange-900/20 rounded-t-lg">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit Transaction</h2>
                <button onClick={handleCloseEditModal} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmitEdit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Branch Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Sender Branch</label>
                    <select
                      name="sender_branch"
                      value={editFormData.sender_branch}
                      onChange={handleEditInputChange}
                      required
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Select Sender Branch</option>
                      {branches.map(b => (
                        <option key={b._id} value={b._id}>{b.branch_name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Receiver Branch</label>
                    <select
                      name="receiver_branch"
                      value={editFormData.receiver_branch}
                      onChange={handleEditInputChange}
                      required
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Select Receiver Branch</option>
                      {branches.map(b => (
                        <option key={b._id} value={b._id}>{b.branch_name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Amount & Commission */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Points (Amount)</label>
                    <input
                      type="number"
                      name="points"
                      value={editFormData.points}
                      onChange={handleEditInputChange}
                      required
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                    />
                    {editFormData.points && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Formatted: {Number(editFormData.points).toLocaleString('en-IN')}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Commission</label>
                    <input
                      type="number"
                      name="commission"
                      value={editFormData.commission}
                      onChange={handleEditInputChange}
                      required
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                    />
                    {editFormData.commission && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Formatted: {Number(editFormData.commission).toLocaleString('en-IN')}
                      </p>
                    )}
                  </div>

                  {/* Sender Details */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Sender Name</label>
                    <input
                      type="text"
                      name="sender_name"
                      value={editFormData.sender_name}
                      onChange={handleEditInputChange}
                      required
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Sender Mobile</label>
                    <input
                      type="number"
                      name="sender_mobile"
                      value={editFormData.sender_mobile}
                      onChange={handleEditInputChange}
                      required
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  {/* Receiver Details */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Receiver Name</label>
                    <input
                      type="text"
                      name="receiver_name"
                      value={editFormData.receiver_name}
                      onChange={handleEditInputChange}
                      required
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Receiver Mobile</label>
                    <input
                      type="number"
                      name="receiver_mobile"
                      value={editFormData.receiver_mobile}
                      onChange={handleEditInputChange}
                      required
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  {/* Other Fields */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Other Sender (Optional)</label>
                    <input
                      type="text"
                      name="other_sender"
                      value={editFormData.other_sender}
                      onChange={handleEditInputChange}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Other Receiver (Optional)</label>
                    <input
                      type="text"
                      name="other_receiver"
                      value={editFormData.other_receiver}
                      onChange={handleEditInputChange}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={handleCloseEditModal}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {loading ? 'Updating...' : 'Update Transaction'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )
      }
      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-green-50 dark:bg-green-900/20 rounded-t-lg">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Transaction Created</h2>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Transaction created successfully! Copy the details below:
              </p>

              <div className="relative">
                <textarea
                  className="w-full h-32 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm resize-none focus:ring-2 focus:ring-green-500"
                  readOnly
                  value={successMessage}
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(successMessage);
                    alert('Copied to clipboard!');
                  }}
                  className="absolute top-2 right-2 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  title="Copy to clipboard"
                >
                  <Copy className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div >
  );
}
