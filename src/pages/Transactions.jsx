import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { Search, RotateCcw, Download, Check, Calendar, X, Plus } from 'lucide-react';
import { decrypt_number, decrypt_text } from "../utils/decrypt";
import { exportTableToPDF, formatNumber, formatDate } from '../utils/pdfExport';

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
    other_sender: ''
  });

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

  // Format date from YYYY-MM-DD to dd/mm/yy for API
  const formatDateForAPI = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  };

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const dateParam = selectedDate ? formatDateForAPI(selectedDate) : null;
      const response = await api.getAllTransactions(dateParam);
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
        // Sort by date desc
        decrypted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setTransactions(decrypted);
        setFilteredTransactions(decrypted);
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
      other_sender: ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCreateFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitTransaction = async (e) => {
    e.preventDefault();
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
        alert("Transaction created successfully!");
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

  const handleExportPDF = () => {
    const headers = ['Sr No', 'Date', 'Points', 'Receiver', 'Sender', 'From', 'To', 'Other From', 'Other To', 'Commission', 'Admin Approval', 'Status'];

    const data = filteredTransactions.map((t, index) => [
      index + 1,
      formatDate(t.createdAt),
      formatNumber(t.points),
      t.receiver_name,
      t.sender_name,
      t.sender_branch_name,
      t.receiver_branch_name,
      t.other_sender,
      t.other_receiver,
      formatNumber(t.commission),
      t.admin_permission ? 'Approved' : 'Not Approved',
      t.status ? 'Complete' : 'Pending'
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
      footer
    });
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Transactions</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={handleCreateTransaction}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center space-x-2 transition-colors shadow"
          >
            <Plus className="w-4 h-4" />
            <span>Create Transaction</span>
          </button>
          <button
            onClick={handleExportPDF}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center space-x-2 transition-colors shadow"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF</span>
          </button>
          <button
            onClick={fetchTransactions}
            className="p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 hover:text-blue-500 transition-colors"
            title="Refresh"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 flex flex-col h-[calc(100vh-140px)]">
        {/* Search Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search across all columns (Sender, Receiver, Branch, Points...)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Date Picker */}
            <div className="relative flex gap-2">
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={handleDateChange}
                  className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Select date"
                />
              </div>
              {selectedDate && (
                <button
                  onClick={handleClearDate}
                  className="px-3 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors flex items-center gap-1"
                  title="Clear date filter"
                >
                  <X className="w-4 h-4" />
                  <span className="hidden sm:inline">Clear</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-6 py-3 font-medium bg-gray-50 dark:bg-gray-700">Sr No</th>
                  <th className="px-6 py-3 font-medium bg-gray-50 dark:bg-gray-700">Date</th>
                  <th className="px-6 py-3 font-medium bg-gray-50 dark:bg-gray-700 text-right">Points</th>
                  <th className="px-6 py-3 font-medium bg-gray-50 dark:bg-gray-700">Receiver</th>
                  <th className="px-6 py-3 font-medium bg-gray-50 dark:bg-gray-700">Sender</th>
                  <th className="px-6 py-3 font-medium bg-gray-50 dark:bg-gray-700">From</th>
                  <th className="px-6 py-3 font-medium bg-gray-50 dark:bg-gray-700">To</th>
                  <th className="px-6 py-3 font-medium bg-gray-50 dark:bg-gray-700">Other From</th>
                  <th className="px-6 py-3 font-medium bg-gray-50 dark:bg-gray-700">Other To</th>
                  <th className="px-6 py-3 font-medium bg-gray-50 dark:bg-gray-700 text-right">Commission</th>
                  <th className="px-6 py-3 font-medium bg-gray-50 dark:bg-gray-700">Admin Approval</th>
                  <th className="px-6 py-3 font-medium bg-gray-50 dark:bg-gray-700">Status</th>
                  <th className="px-6 py-3 font-medium bg-gray-50 dark:bg-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((t, index) => (
                    <tr key={t._id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{index + 1}</td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {new Date(t.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white text-right">
                        {t.points.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                        <div className="font-medium text-gray-900 dark:text-white">{t.receiver_name}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                        <div className="font-medium text-gray-900 dark:text-white">{t.sender_name}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                          {t.sender_branch_name}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                          {t.receiver_branch_name}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                        <div className="font-medium text-gray-900 dark:text-white">{t.other_sender}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                        <div className="font-medium text-gray-900 dark:text-white">{t.other_receiver}</div>
                      </td>
                      <td className="px-6 py-4 font-medium text-green-600 dark:text-green-400 text-right">
                        {t.commission.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        {t.admin_permission ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            Approved
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                            Not Approved
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {t.status ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            Complete
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {!t.admin_permission && (
                          <button
                            onClick={() => handleApprove(t._id)}
                            disabled={approvingId === t._id}
                            className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-medium rounded-lg transition-colors disabled:cursor-not-allowed"
                          >
                            {approvingId === t._id ? (
                              <>
                                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1.5"></div>
                                Approving...
                              </>
                            ) : (
                              <>
                                <Check className="w-3 h-3 mr-1.5" />
                                Approve
                              </>
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="13" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      No transactions found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer Totals */}
        <div className="bg-gray-100 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="flex flex-col sm:flex-row justify-between items-center text-sm font-bold text-gray-900 dark:text-white px-2 gap-4 sm:gap-0">
            <span>Total Records: {filteredTransactions.length}</span>
            <div className="flex gap-8">
              <div className="flex gap-2">
                <span className="text-gray-500 dark:text-gray-400">Total Points:</span>
                <span>{totals.points.toLocaleString()}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-500 dark:text-gray-400">Total Commission:</span>
                <span className="text-green-600 dark:text-green-400">{totals.commission.toLocaleString()}</span>
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
                  {/* Branch Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Sender Branch</label>
                    <select
                      name="sender_branch"
                      value={createFormData.sender_branch}
                      onChange={handleInputChange}
                      required
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Sender Branch</option>
                      {branches.map(b => (
                        <option key={b._id} value={b._id}>{b.branch_name} ({b.location})</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Receiver Branch</label>
                    <select
                      name="receiver_branch"
                      value={createFormData.receiver_branch}
                      onChange={handleInputChange}
                      required
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Receiver Branch</option>
                      {branches.map(b => (
                        <option key={b._id} value={b._id}>{b.branch_name} ({b.location})</option>
                      ))}
                    </select>
                  </div>

                  {/* Amount & Commission */}
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
                  </div>

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
                  </div>

                  {/* Sender Details */}
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

                  {/* Receiver Details */}
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

                  {/* Other Fields */}
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
    </div >
  );
}
