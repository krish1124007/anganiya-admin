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
        <div className="p-4 bg-gray-50 dark:bg-gray-900 min-h-full">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col h-[calc(100vh-90px)] overflow-hidden">
                {/* Single Line Header with All Controls */}
                <div className="p-2.5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                    <div className="flex items-center gap-2">
                        {/* Search Bar */}
                        <div className="relative w-52 group">
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

                        {/* Transfer Button */}
                        <button
                            onClick={handleTransfer}
                            disabled={transferLoading}
                            className="px-3 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg flex items-center gap-1.5 transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-xs font-semibold"
                        >
                            {transferLoading ? (
                                <>
                                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>Transferring...</span>
                                </>
                            ) : (
                                <>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                    <span>Transfer</span>
                                </>
                            )}
                        </button>

                        {/* Download PDF Button */}
                        <button
                            onClick={handleExportPDF}
                            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-1.5 transition-all shadow-md hover:shadow-lg text-xs font-semibold"
                        >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download PDF</span>
                        </button>

                        {/* Refresh Button */}
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
                        <div className="w-full px-3 py-3">
                            <table className="w-full text-left border-separate border-spacing-y-1">
                                <thead className="table-header">
                                    <tr>
                                        <th className="px-3 py-1.5 w-14 text-2xs">No.</th>
                                        <th className="px-3 py-1.5 text-2xs">Branch Name</th>
                                        <th className="px-3 py-1.5 text-right text-2xs">Commission</th>
                                    </tr>
                                </thead>
                                <tbody className="">
                                    {filteredBranches.length > 0 ? (
                                        filteredBranches.map((branch, index) => {
                                            return (
                                                <tr
                                                    key={branch._id}
                                                    className="group bg-gray-50 dark:bg-gray-700/30 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 border border-gray-100 dark:border-gray-700/50 rounded-lg"
                                                >
                                                    <td className="px-4 py-2 text-2xs text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300 font-medium transition-colors first:rounded-l-lg">
                                                        {String(index + 1).padStart(2, '0')}
                                                    </td>
                                                    <td className="px-4 py-2 text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-tight transition-colors">
                                                        {branch.branch_name}
                                                    </td>
                                                    <td className="px-4 py-2 text-right last:rounded-r-lg">
                                                        <span className="inline-block px-2.5 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 rounded-md text-2xs font-semibold numeric transition-all duration-200">
                                                            {(branch.today_commission || 0).toLocaleString('en-IN')}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="3" className="px-6 py-12 text-center text-sm md:text-base text-gray-500 dark:text-gray-400">
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
                <div className="bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 px-4 py-2">
                    <div className="flex justify-between items-center">
                        <div className="flex flex-col">
                            <span className="text-2xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Total Branches</span>
                            <span className="text-sm font-bold text-gray-900 dark:text-white numeric mt-0.5">{filteredBranches.length}</span>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-2xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Total Today's Commission</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-blue-500 dark:text-blue-400 text-sm font-bold">₹</span>
                                <span className="text-sm font-bold text-blue-600 dark:text-blue-400 numeric">
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
