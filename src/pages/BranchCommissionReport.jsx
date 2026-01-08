import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { Search, RotateCcw, Download, Calendar, X, ArrowRight } from 'lucide-react';
import { exportTableToPDF, formatNumber } from '../utils/pdfExport';
import CommissionTransfer from './CommissionTransfer';

export default function BranchCommissionReport() {
    const [branches, setBranches] = useState([]);
    const [branchStats, setBranchStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const [showTransferPage, setShowTransferPage] = useState(false);
    const [transferLoading, setTransferLoading] = useState(false);

    useEffect(() => {
        fetchAllData();
    }, []);

    // Format date from YYYY-MM-DD to dd/mm/yy for API
    const formatDateForAPI = (dateString) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = String(date.getFullYear()).slice(-2);
        return `${year}-${month}-${day}`;
    };

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const dateParam = selectedDate ? formatDateForAPI(selectedDate) : null;
            const branchesRes = await api.getAllBranches(dateParam);

            if (branchesRes.success) {
                setBranches(branchesRes.data);
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

    // Fetch data when date changes
    useEffect(() => {
        fetchAllData();
    }, [selectedDate]);

    const filteredBranches = branches.filter(b =>
        b.branch_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Calculate Footer Totals
    const footerTotals = filteredBranches.reduce((acc, branch) => {
        return {
            todayCommission: acc.todayCommission + (branch.today_commission || 0),
            totalCommission: acc.totalCommission + (branch.commission || 0)
        };
    }, { todayCommission: 0, totalCommission: 0 });

    const handleExportPDF = () => {
        const headers = ['Sr No', 'Branch Name', "Today's Commission", 'Total Commission'];

        const data = filteredBranches.map((branch, index) => {
            return [
                index + 1,
                branch.branch_name,
                formatNumber(branch.today_commission || 0),
                formatNumber(branch.commission || 0)
            ];
        });

        const footer = {
            "Total Today's Commission": formatNumber(footerTotals.todayCommission),
            "Total Commission": formatNumber(footerTotals.totalCommission)
        };

        exportTableToPDF({
            title: 'Branch Commission Report',
            headers,
            data,
            filename: `branch-commission-report-${new Date().toISOString().split('T')[0]}`,
            footer
        });
    };

    const handleTransfer = async () => {
        // Prompt for password
        const password = prompt("Enter admin password to transfer commissions:");

        if (password === null) {
            // User cancelled
            return;
        }

        if (password !== "admin") {
            alert("Incorrect password!");
            return;
        }

        // Password is correct, proceed with transfer
        setTransferLoading(true);
        try {
            const response = await api.transferCommissions();

            if (response.success) {
                alert(`Successfully transferred commissions!\n\nTransactions Created: ${response.data.transactions_created}\nTotal Amount: ₹${response.data.total_amount.toLocaleString('en-IN')}\nBranches Processed: ${response.data.branches_processed}`);
                // Refresh data
                fetchAllData();
            } else {
                alert(`Failed to transfer commissions: ${response.message}`);
            }
        } catch (error) {
            console.error("Error transferring commissions:", error);
            alert("Error transferring commissions. Please try again.");
        } finally {
            setTransferLoading(false);
        }
    };

    // If showing transfer page, render it instead
    if (showTransferPage) {
        return <CommissionTransfer onBack={() => setShowTransferPage(false)} />;
    }

    return (
        <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-full">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Branch Commission Report</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">View commission overview for all branches</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleTransfer}
                        disabled={transferLoading}
                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg flex items-center space-x-2 transition-colors shadow disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {transferLoading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Transferring...</span>
                            </>
                        ) : (
                            <>
                                <ArrowRight className="w-4 h-4" />
                                <span>Transfer</span>
                            </>
                        )}
                    </button>
                    <button
                        onClick={handleExportPDF}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center space-x-2 transition-colors shadow"
                    >
                        <Download className="w-4 h-4" />
                        <span>Download PDF</span>
                    </button>
                    <button
                        onClick={fetchAllData}
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
                        <table className="w-full text-xs text-left">
                            <thead className="text-[10px] text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="px-2 py-2 font-medium bg-gray-50 dark:bg-gray-700">Sr No</th>
                                    <th className="px-2 py-2 font-medium bg-gray-50 dark:bg-gray-700">Branch Name</th>
                                    <th className="px-2 py-2 font-medium bg-gray-50 dark:bg-gray-700 text-right">Today's Commission</th>
                                    <th className="px-2 py-2 font-medium bg-gray-50 dark:bg-gray-700 text-right">Total Commission</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {filteredBranches.length > 0 ? (
                                    filteredBranches.map((branch, index) => {
                                        return (
                                            <tr
                                                key={branch._id}
                                                className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                            >
                                                <td className="px-2 py-2 font-medium text-gray-900 dark:text-white">{index + 1}</td>
                                                <td className="px-2 py-2 font-medium text-gray-900 dark:text-white">
                                                    {branch.branch_name}
                                                </td>
                                                <td className="px-2 py-2 text-right text-blue-600 dark:text-blue-400 font-semibold">
                                                    {(branch.today_commission || 0).toLocaleString()}
                                                </td>
                                                <td className="px-2 py-2 text-right text-green-600 dark:text-green-400 font-semibold">
                                                    {(branch.commission || 0).toLocaleString()}
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

                {/* Footer Totals */}
                <div className="bg-gray-100 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-4">
                    <div className="grid grid-cols-2 gap-4 text-sm font-bold text-gray-900 dark:text-white">
                        <div className="flex flex-col">
                            <span className="text-gray-500 dark:text-gray-400 text-xs uppercase">Total Today's Commission</span>
                            <span className="text-blue-600 dark:text-blue-400 text-lg">{footerTotals.todayCommission.toLocaleString()}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-gray-500 dark:text-gray-400 text-xs uppercase">Total Commission</span>
                            <span className="text-green-600 dark:text-green-400 text-lg">{footerTotals.totalCommission.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
