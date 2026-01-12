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
        b.branch_name.toLowerCase().includes(searchTerm.toLowerCase()) && (b.today_commission || 0) !== 0
    );

    // Calculate Footer Totals
    const footerTotals = filteredBranches.reduce((acc, branch) => {
        return {
            todayCommission: acc.todayCommission + (branch.today_commission || 0)
        };
    }, { todayCommission: 0 });

    const handleExportPDF = () => {
        const headers = ['Sr No', 'Branch Name', "Today's Commission"];

        const data = filteredBranches.map((branch, index) => {
            return [
                index + 1,
                branch.branch_name,
                formatNumber(branch.today_commission || 0)
            ];
        });

        const footer = {
            "Total Today's Commission": formatNumber(footerTotals.todayCommission)
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

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col h-[calc(100vh-200px)] overflow-hidden">
                {/* Search Header */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-700/50 bg-gray-50/30 dark:bg-gray-800/50">
                    <div className="flex flex-col sm:flex-row gap-4 max-w-7xl mx-auto">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search branches..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 border-2 border-gray-100 dark:border-gray-700 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-all outline-none font-medium"
                            />
                        </div>

                        {/* Date Picker */}
                        <div className="relative flex gap-2">
                            <div className="relative group">
                                <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors pointer-events-none" />
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={handleDateChange}
                                    className="pl-12 pr-4 py-3 border-2 border-gray-100 dark:border-gray-700 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-all outline-none font-medium"
                                />
                            </div>
                            {selectedDate && (
                                <button
                                    onClick={handleClearDate}
                                    className="px-4 py-3 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl transition-all flex items-center gap-2 font-bold"
                                    title="Clear date filter"
                                >
                                    <X className="w-5 h-5" />
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
                        <div className="max-w-4xl mx-auto w-full px-4 py-4">
                            <table className="w-full text-sm text-left border-separate border-spacing-y-2">
                                <thead className="text-xs text-gray-500 uppercase tracking-widest">
                                    <tr>
                                        <th className="px-4 py-2 font-bold w-20">No.</th>
                                        <th className="px-4 py-2 font-bold">Branch Name</th>
                                        <th className="px-4 py-2 font-bold text-right">Commission</th>
                                    </tr>
                                </thead>
                                <tbody className="">
                                    {filteredBranches.length > 0 ? (
                                        filteredBranches.map((branch, index) => {
                                            return (
                                                <tr
                                                    key={branch._id}
                                                    className="group bg-white dark:bg-gray-800 hover:bg-blue-600 dark:hover:bg-blue-500 transition-all duration-300 shadow-sm hover:shadow-blue-500/25 rounded-xl border border-gray-100 dark:border-gray-700"
                                                >
                                                    <td className="px-6 py-4 text-gray-400 group-hover:text-blue-100 font-bold transition-colors first:rounded-l-xl">
                                                        {String(index + 1).padStart(2, '0')}
                                                    </td>
                                                    <td className="px-6 py-4 font-black text-gray-900 dark:text-white group-hover:text-white uppercase tracking-tight transition-colors">
                                                        {branch.branch_name}
                                                    </td>
                                                    <td className="px-6 py-4 text-right last:rounded-r-xl">
                                                        <span className="inline-block px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 group-hover:bg-white group-hover:text-blue-600 rounded-lg font-black text-lg shadow-sm transition-all duration-300">
                                                            {(branch.today_commission || 0).toLocaleString()}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="3" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                                No branches found matching your search.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Footer Totals */}
                <div className="bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex justify-between items-center max-w-7xl mx-auto">
                        <div className="flex flex-col">
                            <span className="text-gray-400 dark:text-gray-500 text-xs uppercase font-bold tracking-widest mb-1">Total Branches</span>
                            <span className="text-gray-900 dark:text-white text-2xl font-black">{filteredBranches.length}</span>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-gray-400 dark:text-gray-500 text-xs uppercase font-bold tracking-widest mb-1">Total Today's Commission</span>
                            <div className="flex items-center gap-2">
                                <span className="text-blue-500 dark:text-blue-400 text-3xl font-black italic">₹</span>
                                <span className="text-blue-600 dark:text-blue-400 text-4xl font-black truncate">
                                    {footerTotals.todayCommission.toLocaleString('en-IN')}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
