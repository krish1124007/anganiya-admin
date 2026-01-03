import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { Search, RotateCcw, ArrowLeft, Calendar, X } from 'lucide-react';

export default function CommissionTransfer({ onBack }) {
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDate, setSelectedDate] = useState('');

    useEffect(() => {
        fetchBranchData();
    }, [selectedDate]);

    const fetchBranchData = async () => {
        setLoading(true);
        try {
            const res = await api.getAllBranches(selectedDate || null);
            if (res.success) {
                setBranches(res.data);
            }
        } catch (error) {
            console.error('Error fetching branch data:', error);
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

    const filteredBranches = branches.filter(b =>
        b.branch_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.location.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Calculate total commission (not including today's commission)
    const totalCommission = filteredBranches.reduce((sum, branch) => {
        return sum + (branch.commission || 0);
    }, 0);

    return (
        <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-full">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onBack}
                        className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Commission Transfer</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">View total commission for all branches</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchBranchData}
                        className="p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 hover:text-blue-500 transition-colors"
                        title="Refresh"
                    >
                        <RotateCcw className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 flex flex-col h-[calc(100vh-180px)]">
                {/* Search Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search branches..."
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
                                    <th className="px-6 py-3 font-medium bg-gray-50 dark:bg-gray-700">Branch Name</th>
                                    <th className="px-6 py-3 font-medium bg-gray-50 dark:bg-gray-700">Location</th>
                                    <th className="px-6 py-3 font-medium bg-gray-50 dark:bg-gray-700 text-right">Total Commission</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {filteredBranches.length > 0 ? (
                                    filteredBranches.map((branch, index) => {
                                        const commission = branch.commission || 0;

                                        return (
                                            <tr
                                                key={branch._id}
                                                className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                            >
                                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{index + 1}</td>
                                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                                    {branch.branch_name}
                                                </td>
                                                <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                                                    {branch.location}
                                                </td>
                                                <td className="px-6 py-4 text-right text-green-600 dark:text-green-400 font-semibold">
                                                    {commission.toLocaleString()}
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                            No branches found matching your search.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Sticky Footer - Total Commission */}
                <div className="sticky bottom-0 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-t-2 border-green-500 dark:border-green-600 p-4 shadow-lg">
                    <div className="flex items-center justify-between max-w-4xl mx-auto">
                        <div className="flex items-center gap-2">
                            <span className="text-gray-700 dark:text-gray-300 font-semibold text-lg">Total Branches:</span>
                            <span className="text-gray-900 dark:text-white font-bold text-xl">{filteredBranches.length}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-gray-700 dark:text-gray-300 font-semibold text-lg">Total Commission:</span>
                            <span className="text-green-600 dark:text-green-400 font-bold text-2xl">
                                ₹ {totalCommission.toLocaleString()}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
