import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { Search, RotateCcw, Plus, Edit2, Trash2, Power, PowerOff, Save, X, Download, Calendar } from 'lucide-react';
import { decrypt_number } from '../utils/decrypt';
import { exportTableToPDF, formatNumber } from '../utils/pdfExport';

export default function AllBranches({ onBranchClick, initialSearch = '' }) {
    const [branches, setBranches] = useState([]);
    const [branchStats, setBranchStats] = useState({}); // Map of branchId -> { totalCommission, todayCommission }
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState(initialSearch);
    const [selectedDate, setSelectedDate] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingBranch, setEditingBranch] = useState(null);
    const [formData, setFormData] = useState({
        branch_name: '',
        location: '',
        opening_balance: ''
    });
    const [showRelationshipModal, setShowRelationshipModal] = useState(false);
    const [relationshipForm, setRelationshipForm] = useState({
        branch1_id: '',
        branch2_id: '',
        branch1_commission: '',
        branch2_commission: ''
    });

    useEffect(() => {
        setSearchTerm(initialSearch);
    }, [initialSearch]);

    useEffect(() => {
        fetchAllData();
    }, [selectedDate]);


    const fetchAllData = async () => {
        setLoading(true);
        try {
            // Pass date directly in YYYY-MM-DD format if selected
            const branchesRes = await api.getAllBranches(selectedDate || null);

            if (branchesRes.success) {
                console.log(branchesRes.data);
                setBranches(branchesRes.data);

                // Backend now provides commission data directly in branch objects
                // No need to calculate from transactions
            }

        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDateChange = (e) => {
        setSelectedDate(e.target.value);
    };

    const handleClearDate = () => {
        setSelectedDate('');
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const response = await api.createBranch({
                branch_name: formData.branch_name,
                location: formData.location,
                opening_balance: Number(formData.opening_balance)
            });
            if (response.success) {
                setShowCreateModal(false);
                setFormData({ branch_name: '', location: '', opening_balance: '' });
                fetchAllData();
            }
        } catch (error) {
            console.error('Error creating branch:', error);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const response = await api.updateBranch(editingBranch._id, {
                branch_name: formData.branch_name,
                location: formData.location,
                opening_balance: Number(formData.opening_balance)
            });
            if (response.success) {
                setEditingBranch(null);
                setFormData({ branch_name: '', location: '', opening_balance: '' });
                fetchAllData();
            }
        } catch (error) {
            console.error('Error updating branch:', error);
        }
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this branch?')) {
            try {
                const response = await api.deleteBranch(id);
                if (response.success) {
                    fetchAllData();
                }
            } catch (error) {
                console.error('Error deleting branch:', error);
            }
        }
    };

    const handleDisableBranch = async (id, e) => {
        e.stopPropagation();
        try {
            const response = await api.disableBranch(id);
            if (response.success) {
                fetchAllData();
            }
        } catch (error) {
            console.error('Error disabling branch:', error);
        }
    };

    const handleEnableBranch = async (id, e) => {
        e.stopPropagation();
        try {
            const response = await api.enableBranch(id);
            if (response.success) {
                fetchAllData();
            }
        } catch (error) {
            console.error('Error enabling branch:', error);
        }
    };

    const handleDisableAll = async () => {
        if (window.confirm('Are you sure you want to disable all branches?')) {
            try {
                const response = await api.disableAllBranches();
                if (response.success) {
                    fetchAllData();
                }
            } catch (error) {
                console.error('Error disabling all branches:', error);
            }
        }
    };

    const handleEnableAll = async () => {
        try {
            const response = await api.enableAllBranches();
            if (response.success) {
                fetchAllData();
            }
        } catch (error) {
            console.error('Error enabling all branches:', error);
        }
    };

    const startEdit = (branch, e) => {
        e.stopPropagation();
        setEditingBranch(branch);
        setFormData({
            branch_name: branch.branch_name,
            location: branch.location,
            opening_balance: branch.opening_balance
        });
    };

    const handleCreateRelationship = async (e) => {
        e.preventDefault();

        // Validate branches are different
        if (relationshipForm.branch1_id === relationshipForm.branch2_id) {
            alert('Please select different branches');
            return;
        }

        // Validate fields are filled
        if (!relationshipForm.branch1_id || !relationshipForm.branch2_id ||
            relationshipForm.branch1_commission === '' || relationshipForm.branch2_commission === '') {
            alert('Please fill in all fields');
            return;
        }

        try {
            const response = await api.createRelationship({
                branch1_id: relationshipForm.branch1_id,
                branch2_id: relationshipForm.branch2_id,
                branch1_commission: Number(relationshipForm.branch1_commission),
                branch2_commission: Number(relationshipForm.branch2_commission)
            });

            if (response.success) {
                alert('Relationship created successfully!');
                setShowRelationshipModal(false);
                setRelationshipForm({
                    branch1_id: '',
                    branch2_id: '',
                    branch1_commission: '',
                    branch2_commission: ''
                });
            } else {
                alert(response.message || 'Failed to create relationship');
            }
        } catch (error) {
            console.error('Error creating relationship:', error);
            alert('Error creating relationship');
        }
    };

    const filteredBranches = branches.filter(b =>
        b.branch_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Calculate Footer Totals using backend data
    const footerTotals = filteredBranches.reduce((acc, branch) => {
        const openingBalance = branch.opening_balance || 0;
        const commission = branch.commission || 0;
        const todayCommission = branch.today_commission || 0;
        const total = openingBalance + commission;

        return {
            openingBalance: acc.openingBalance + openingBalance,
            commission: acc.commission + commission,
            total: acc.total + total,
            todayCommission: acc.todayCommission + todayCommission
        };
    }, { openingBalance: 0, commission: 0, total: 0, todayCommission: 0 });


    const handleExportPDF = () => {
        const headers = ['Sr No', 'City Name', 'Status', 'Opening Balance', 'Total Commission', 'Total', "Today's Commission"];

        const data = filteredBranches.map((branch, index) => {
            const openingBalance = branch.opening_balance || 0;
            const commission = branch.commission || 0;
            const todayCommission = branch.today_commission || 0;
            const total = openingBalance + commission;

            return [
                index + 1,
                branch.branch_name,
                branch.active ? 'Active' : 'Inactive',
                formatNumber(openingBalance),
                formatNumber(commission),
                formatNumber(total),
                formatNumber(todayCommission)
            ];
        });

        const footer = {
            "Total Opening Balance": formatNumber(footerTotals.openingBalance),
            "Total Commission": formatNumber(footerTotals.commission),
            "Grand Total": formatNumber(footerTotals.total),
            "Total Today's Commission": formatNumber(footerTotals.todayCommission)
        };

        exportTableToPDF({
            title: 'Branch Management Report',
            headers,
            data,
            filename: `branch-management-${new Date().toISOString().split('T')[0]}`,
            footer
        });
    };

    return (
        <div className="p-4 bg-gray-50 dark:bg-gray-900 min-h-full">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col h-[calc(100vh-90px)]">
                {/* Single Line Header with All Controls */}
                <div className="p-2.5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                    <div className="flex items-center gap-2">
                        {/* Search Bar */}
                        <div className="relative w-48 group">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search branches..."
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

                        {/* Clear Date Button */}
                        {selectedDate && (
                            <button
                                onClick={handleClearDate}
                                className="px-2.5 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl transition-all"
                                title="Clear date filter"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}

                        {/* Spacer */}
                        <div className="flex-1"></div>

                        {/* Action Buttons */}
                        <button
                            onClick={handleDisableAll}
                            className="px-2.5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg flex items-center gap-1.5 transition-colors text-xs font-semibold"
                        >
                            <PowerOff className="w-3.5 h-3.5" />
                            <span className="hidden xl:inline">Disable All</span>
                        </button>
                        <button
                            onClick={handleEnableAll}
                            className="px-2.5 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center gap-1.5 transition-colors text-xs font-semibold"
                        >
                            <Power className="w-3.5 h-3.5" />
                            <span className="hidden xl:inline">Enable All</span>
                        </button>
                        <button
                            onClick={handleExportPDF}
                            className="px-2.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-1.5 transition-colors text-xs font-semibold"
                        >
                            <Download className="w-3.5 h-3.5" />
                            <span className="hidden xl:inline">PDF</span>
                        </button>
                        <button
                            onClick={() => setShowRelationshipModal(true)}
                            className="px-2.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-1.5 transition-colors text-xs font-semibold"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span className="hidden xl:inline">Relationship</span>
                        </button>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="px-2.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-1.5 transition-colors text-xs font-semibold"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span className="hidden xl:inline">Branch</span>
                        </button>
                        <button
                            onClick={fetchAllData}
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
                                    <th className="px-2 py-1.5 bg-gray-50 dark:bg-gray-700">Sr</th>
                                    <th className="px-2 py-1.5 bg-gray-50 dark:bg-gray-700">City Name</th>
                                    <th className="px-2 py-1.5 bg-gray-50 dark:bg-gray-700">Status</th>
                                    <th className="px-2 py-1.5 bg-gray-50 dark:bg-gray-700 text-right">Opening Balance</th>
                                    <th className="px-2 py-1.5 bg-gray-50 dark:bg-gray-700 text-right">Total Commission</th>
                                    <th className="px-2 py-1.5 bg-gray-50 dark:bg-gray-700 text-right">Total</th>
                                    <th className="px-2 py-1.5 bg-gray-50 dark:bg-gray-700 text-right">Today's Commission</th>
                                    <th className="px-2 py-1.5 bg-gray-50 dark:bg-gray-700 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                                {filteredBranches.length > 0 ? (
                                    filteredBranches.map((branch, index) => {
                                        const openingBalance = branch.opening_balance || 0;
                                        const commission = branch.commission || 0;
                                        const todayCommission = branch.today_commission || 0;
                                        const total = openingBalance + commission;

                                        return (
                                            <tr
                                                key={branch._id}
                                                onClick={() => onBranchClick && onBranchClick(branch._id)}
                                                className="bg-gray-50 dark:bg-gray-700/30 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors cursor-pointer"
                                            >
                                                <td className="px-2 py-1.5 text-2xs font-medium text-gray-500 dark:text-gray-400">{index + 1}</td>
                                                <td className="px-2 py-1.5 text-2xs font-semibold text-gray-900 dark:text-white">
                                                    {branch.branch_name}
                                                </td>
                                                <td className="px-2 py-1.5">
                                                    <span
                                                        className={`px-1.5 py-0.5 rounded-full text-[9px] font-semibold ${branch.active
                                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                                            }`}
                                                    >
                                                        {branch.active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="px-2 py-1.5 text-right text-2xs text-gray-900 dark:text-white numeric">
                                                    {openingBalance.toLocaleString('en-IN')}
                                                </td>
                                                <td className="px-2 py-1.5 text-right text-2xs text-green-600 dark:text-green-400 font-medium numeric">
                                                    {commission.toLocaleString('en-IN')}
                                                </td>
                                                <td className="px-2 py-1.5 text-right text-2xs font-bold text-gray-900 dark:text-white numeric">
                                                    {total.toLocaleString('en-IN')}
                                                </td>
                                                <td className="px-2 py-1.5 text-right text-2xs text-blue-600 dark:text-blue-400 font-medium numeric">
                                                    {todayCommission.toLocaleString('en-IN')}
                                                </td>
                                                <td className="px-2 py-1.5">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button
                                                            onClick={(e) => startEdit(branch, e)}
                                                            className="p-1 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
                                                            title="Edit"
                                                        >
                                                            <Edit2 className="w-3 h-3" />
                                                        </button>
                                                        {branch.active ? (
                                                            <button
                                                                onClick={(e) => handleDisableBranch(branch._id, e)}
                                                                className="p-1 bg-orange-500 hover:bg-orange-600 text-white rounded transition-colors"
                                                                title="Disable"
                                                            >
                                                                <PowerOff className="w-3 h-3" />
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={(e) => handleEnableBranch(branch._id, e)}
                                                                className="p-1 bg-green-500 hover:bg-green-600 text-white rounded transition-colors"
                                                                title="Enable"
                                                            >
                                                                <Power className="w-3 h-3" />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={(e) => handleDelete(branch._id, e)}
                                                            className="p-1 bg-red-500 hover:bg-red-600 text-white rounded transition-colors"
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="8" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                            No branches found matching your search.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Footer Totals */}
                <div className="bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 px-3 py-2">
                    <div className="grid grid-cols-4 gap-3 text-2xs">
                        <div className="flex flex-col">
                            <span className="font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Opening Balance</span>
                            <span className="text-xs font-bold text-gray-900 dark:text-white numeric mt-0.5">{footerTotals.openingBalance.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Total Commission</span>
                            <span className="text-xs font-bold text-green-600 dark:text-green-400 numeric mt-0.5">{footerTotals.commission.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Total</span>
                            <span className="text-xs font-bold text-gray-900 dark:text-white numeric mt-0.5">{footerTotals.total.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Today's Commission</span>
                            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 numeric mt-0.5">{footerTotals.todayCommission.toLocaleString('en-IN')}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Create/Edit Branch Modal */}
            {(showCreateModal || editingBranch) && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {editingBranch ? 'Edit Branch' : 'Create Branch'}
                            </h2>
                            <button
                                onClick={() => {
                                    setShowCreateModal(false);
                                    setEditingBranch(null);
                                    setFormData({ branch_name: '', location: '', opening_balance: '' });
                                }}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={editingBranch ? handleUpdate : handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Branch Name
                                </label>
                                <input
                                    type="text"
                                    value={formData.branch_name}
                                    onChange={(e) => setFormData({ ...formData, branch_name: e.target.value })}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Location
                                </label>
                                <input
                                    type="text"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Opening Balance
                                </label>
                                <input
                                    type="number"
                                    value={formData.opening_balance}
                                    onChange={(e) => setFormData({ ...formData, opening_balance: e.target.value })}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                                {formData.opening_balance && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        Formatted: {Number(formData.opening_balance).toLocaleString('en-IN')}
                                    </p>
                                )}
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 shadow"
                            >
                                <Save className="w-5 h-5" />
                                <span>{editingBranch ? 'Update Branch' : 'Create Branch'}</span>
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Create Relationship Modal */}
            {showRelationshipModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                Create Branch Relationship
                            </h2>
                            <button
                                onClick={() => {
                                    setShowRelationshipModal(false);
                                    setRelationshipForm({
                                        branch1_id: '',
                                        branch2_id: '',
                                        branch1_commission: '',
                                        branch2_commission: ''
                                    });
                                }}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateRelationship} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Branch 1
                                </label>
                                <select
                                    value={relationshipForm.branch1_id}
                                    onChange={(e) => setRelationshipForm({ ...relationshipForm, branch1_id: e.target.value })}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                >
                                    <option value="">Select Branch 1</option>
                                    {branches.map(branch => (
                                        <option key={branch._id} value={branch._id}>
                                            {branch.branch_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Branch 1 Commission
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={relationshipForm.branch1_commission}
                                    onChange={(e) => setRelationshipForm({ ...relationshipForm, branch1_commission: e.target.value })}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    placeholder="0.00"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Branch 2
                                </label>
                                <select
                                    value={relationshipForm.branch2_id}
                                    onChange={(e) => setRelationshipForm({ ...relationshipForm, branch2_id: e.target.value })}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                >
                                    <option value="">Select Branch 2</option>
                                    {branches
                                        .filter(branch => branch._id !== relationshipForm.branch1_id)
                                        .map(branch => (
                                            <option key={branch._id} value={branch._id}>
                                                {branch.branch_name}
                                            </option>
                                        ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Branch 2 Commission
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={relationshipForm.branch2_commission}
                                    onChange={(e) => setRelationshipForm({ ...relationshipForm, branch2_commission: e.target.value })}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    placeholder="0.00"
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 shadow"
                            >
                                <Save className="w-5 h-5" />
                                <span>Create Relationship</span>
                            </button>
                        </form>
                    </div >
                </div >
            )
            }
        </div >
    );
}
