import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { Search, RotateCcw, Download, Calendar, X, ShieldCheck, Printer } from 'lucide-react';
import { exportSplitTableToPDF, printSplitTableToPDF, formatNumber } from '../utils/pdfExport';

export default function HOBranchLeader() {
    const [branches, setBranches] = useState([]);
    const [negativeBranches, setNegativeBranches] = useState([]);
    const [positiveBranches, setPositiveBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const [finalizing, setFinalizing] = useState(false);

    useEffect(() => {
        fetchBranchData();
    }, [selectedDate]);

    useEffect(() => {
        // Filter branches: Exclude branches with transaction_balance of 0
        const filteredBranches = branches.filter(b => (b.transaction_balance || 0) !== 0);

        // Split branches based on transaction balance
        // Fallback to 0 if undefined, though backend should guarantee a value
        const negative = filteredBranches.filter(b => (b.transaction_balance || 0) < 0);
        const positive = filteredBranches.filter(b => (b.transaction_balance || 0) > 0);

        // Apply search filter
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            const filterFunc = b =>
                (b.branch_name || '').toLowerCase().includes(lower);

            setNegativeBranches(negative.filter(filterFunc));
            setPositiveBranches(positive.filter(filterFunc));
        } else {
            setNegativeBranches(negative);
            setPositiveBranches(positive);
        }
    }, [branches, searchTerm]);

    const formatDateForAPI = (dateString) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = String(date.getFullYear()).slice(-2);
        return `${year}-${month}-${day}`;
    };

    const fetchBranchData = async () => {
        setLoading(true);
        try {
            const dateParam = selectedDate ? formatDateForAPI(selectedDate) : null;
            const res = await api.getAllBranches(dateParam);
            if (res.success) {
                setBranches(res.data);
            }
        } catch (error) {
            console.error('Error fetching branch data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFinalize = async () => {
        if (!window.confirm("Are you sure you want to finalize today's commission? This will transfer all today's earnings to the COMMISSION account and reset branch daily counters.")) return;

        setFinalizing(true);
        try {
            const res = await api.finalizeCommission();
            if (res.success) {
                alert(`Successfully finalized! Total commission transferred: ₹${res.data.total_commission.toLocaleString('en-IN')}`);
                fetchBranchData();
            } else {
                alert("Failed to finalize: " + res.message);
            }
        } catch (error) {
            console.error("Finalize error:", error);
            alert("Error finalizing commission");
        } finally {
            setFinalizing(false);
        }
    };

    const calculateTotals = (branchList) => {
        return branchList.reduce(
            (acc, branch) => {
                // Use transaction_balance instead of opening_balance
                const openingBalance = branch.transaction_balance || 0;
                const commission = branch.remaining_transfer_commission || 0;
                const total = openingBalance + commission;

                acc.openingBalance += openingBalance;
                acc.commission += commission;
                acc.total += total;
                acc.count += 1;

                return acc;
            },
            {
                openingBalance: 0,
                commission: 0,
                total: 0,
                count: 0
            }
        );
    };

    const negativeTotals = calculateTotals(negativeBranches);
    const positiveTotals = calculateTotals(positiveBranches);

    // Calculate HO Balance according to formula:
    // HO Balance = Positive Total - Negative Total - Both Commissions
    const calculateHOBalance = () => {
        const positiveTotal = positiveTotals.total;
        const negativeTotal = negativeTotals.total;
        const bothCommission = positiveTotals.commission + negativeTotals.commission;

        return positiveTotal + negativeTotal - bothCommission;
    };

    const hoBalance = calculateHOBalance();

    const handleExportPDF = () => {
        const headers = ['Sr No', 'City Name', 'Balance', 'Commission', 'Total'];

        const negativeData = negativeBranches.map((branch, index) => {
            const commission = branch.remaining_transfer_commission || 0;
            const openingBalance = branch.transaction_balance || 0;
            const total = openingBalance + commission;

            return [
                index + 1,
                branch.branch_name,
                formatNumber(openingBalance),
                formatNumber(commission),
                formatNumber(total)
            ];
        });

        const positiveData = positiveBranches.map((branch, index) => {
            const commission = branch.remaining_transfer_commission || 0;
            const openingBalance = branch.transaction_balance || 0;
            const total = openingBalance + commission;

            return [
                index + 1,
                branch.branch_name,
                formatNumber(openingBalance),
                formatNumber(commission),
                formatNumber(total)
            ];
        });

        exportSplitTableToPDF({
            title: `HO Branch Leader Report - ${selectedDate || 'Today'}`,
            headers,
            negativeData,
            positiveData,
            filename: `ho-branch-leader-${selectedDate || new Date().toISOString().split('T')[0]}`,
            negativeTotals: {
                balance: negativeTotals.openingBalance,
                commission: negativeTotals.commission,
                total: negativeTotals.total
            },
            positiveTotals: {
                balance: positiveTotals.openingBalance,
                commission: positiveTotals.commission,
                total: positiveTotals.total
            },
            hoBalance
        });
    };

    const handlePrintPDF = () => {
        const headers = ['Sr No', 'City Name', 'Balance', 'Commission', 'Total'];

        const negativeData = negativeBranches.map((branch, index) => {
            const commission = branch.remaining_transfer_commission || 0;
            const openingBalance = branch.transaction_balance || 0;
            const total = openingBalance + commission;

            return [
                index + 1,
                branch.branch_name,
                formatNumber(openingBalance),
                formatNumber(commission),
                formatNumber(total)
            ];
        });

        const positiveData = positiveBranches.map((branch, index) => {
            const commission = branch.remaining_transfer_commission || 0;
            const openingBalance = branch.transaction_balance || 0;
            const total = openingBalance + commission;

            return [
                index + 1,
                branch.branch_name,
                formatNumber(openingBalance),
                formatNumber(commission),
                formatNumber(total)
            ];
        });

        printSplitTableToPDF({
            title: `HO Branch Leader Report - ${selectedDate || 'Today'}`,
            headers,
            negativeData,
            positiveData,
            filename: `ho-branch-leader-${selectedDate || new Date().toISOString().split('T')[0]}`,
            negativeTotals: {
                balance: negativeTotals.openingBalance,
                commission: negativeTotals.commission,
                total: negativeTotals.total
            },
            positiveTotals: {
                balance: positiveTotals.openingBalance,
                commission: positiveTotals.commission,
                total: positiveTotals.total
            },
            hoBalance
        });
    };

    const renderTable = (title, data, type) => (
        <div className={`flex-1 ${type === 'negative' ? 'border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700' : ''}`}>
            <div className="sticky top-0 bg-white dark:bg-gray-800 z-10 border-b border-gray-200 dark:border-gray-700">
                <div className="px-3 py-1.5 bg-gray-50 dark:bg-gray-700">
                    <h3 className="text-2xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        {title} ({data.length})
                    </h3>
                </div>
            </div>
            <div className="overflow-auto h-[calc(100%-50px)]">
                <table className="w-full text-2xs text-left">
                    <thead className="table-header bg-gray-50 dark:bg-gray-700 sticky top-0">
                        <tr>
                            <th className="px-2 py-1.5 text-left">Sr</th>
                            <th className="px-2 py-1.5 text-left">City Name</th>
                            <th className="px-2 py-1.5 text-right">Balance</th>
                            <th className="px-2 py-1.5 text-right">Commission</th>
                            <th className="px-2 py-1.5 text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                        {data.map((branch, i) => {
                            const commission = branch.remaining_transfer_commission || 0;
                            const openingBalance = branch.transaction_balance || 0;
                            const total = openingBalance + commission;

                            return (
                                <tr key={branch._id} className="bg-gray-50 dark:bg-gray-700/30 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                                    <td className="px-2 py-1 text-2xs text-gray-500 dark:text-gray-400">{i + 1}</td>
                                    <td className="px-2 py-1 text-2xs font-semibold text-gray-900 dark:text-white">
                                        {branch.branch_name}
                                    </td>
                                    <td className={`px-2 py-1 text-right text-2xs font-semibold numeric ${openingBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                        }`}>
                                        {openingBalance >= 0 ? '+' : ''}{openingBalance.toLocaleString('en-IN')}
                                    </td>
                                    <td className={`px-2 py-1 text-right text-2xs font-semibold numeric ${commission >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                        }`}>
                                        {commission >= 0 ? '+' : ''}{commission.toLocaleString('en-IN')}
                                    </td>
                                    <td className={`px-2 py-1 text-right text-2xs font-bold numeric ${total >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                        }`}>
                                        {total >= 0 ? '+' : ''}{total.toLocaleString('en-IN')}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );

    return (
        <div className="p-4 bg-gray-50 dark:bg-gray-900 min-h-full">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col h-[calc(100vh-90px)]">
                {/* Single Line Header with All Controls */}
                <div className="p-2.5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                    <div className="flex items-center gap-2">
                        {/* Title */}
                        <div className="flex flex-col">
                            <h1 className="text-sm font-bold text-gray-900 dark:text-white">HO Branch Leader</h1>
                            <p className="text-2xs text-gray-500 dark:text-gray-400">Branches by Balance {selectedDate ? `- ${selectedDate}` : '(Today)'}</p>
                        </div>

                        {/* Search Bar */}
                        <div className="relative w-48 group ml-4">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                placeholder="Search branches..."
                                className="w-full pl-9 pr-3 py-2 text-xs border-2 border-gray-100 dark:border-gray-700 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-all outline-none"
                            />
                        </div>

                        {/* Date Picker */}
                        <div className="relative group w-40">
                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors pointer-events-none" />
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={e => setSelectedDate(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 text-xs border-2 border-gray-100 dark:border-gray-700 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-all outline-none"
                            />
                        </div>

                        {/* Clear Date */}
                        {selectedDate && (
                            <button
                                onClick={() => setSelectedDate('')}
                                className="px-2.5 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl transition-all"
                                title="Clear date"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}

                        {/* Spacer */}
                        <div className="flex-1"></div>

                        {/* Action Buttons */}
                        {!selectedDate && (
                            <button
                                onClick={handleFinalize}
                                disabled={finalizing}
                                className="px-2.5 py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-lg flex items-center gap-1.5 transition-all disabled:opacity-50 text-xs font-semibold"
                                title="Finalize Today's Commission"
                            >
                                <ShieldCheck className={`w-3.5 h-3.5 ${finalizing ? 'animate-pulse' : ''}`} />
                                <span className="hidden xl:inline">{finalizing ? 'Finalizing...' : 'Finalize Day'}</span>
                            </button>
                        )}
                        <button
                            onClick={fetchBranchData}
                            className="p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 hover:text-blue-600 hover:border-blue-500 transition-all"
                            title="Refresh"
                        >
                            <RotateCcw className="w-4 h-4" />
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
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 flex flex-col flex-1 overflow-hidden">
                    {loading ? (
                        <div className="flex justify-center items-center h-full">
                            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : (
                        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
                            {/* Negative Opening Balance - Left Side */}
                            {renderTable('Negative Opening Balance', negativeBranches, 'negative')}
                            {/* Positive Opening Balance - Right Side */}
                            {renderTable('Positive Opening Balance', positiveBranches, 'positive')}
                        </div>
                    )}

                    {/* Summary Footer */}
                    <div className="bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 px-3 py-2">
                        <div className="grid grid-cols-3 gap-4">
                            {/* Negative Summary */}
                            <div className="flex flex-col">
                                <span className="text-2xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Negative ({negativeTotals.count})</span>
                                <div className="flex items-baseline gap-2 mt-0.5">
                                    <span className="text-xs font-bold text-red-600 numeric">{negativeTotals.total.toLocaleString('en-IN')}</span>
                                    <span className="text-[9px] text-gray-400">(Comm: {negativeTotals.commission.toLocaleString('en-IN')})</span>
                                </div>
                            </div>

                            {/* Positive Summary */}
                            <div className="flex flex-col">
                                <span className="text-2xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Positive ({positiveTotals.count})</span>
                                <div className="flex items-baseline gap-2 mt-0.5">
                                    <span className="text-xs font-bold text-green-600 numeric">{positiveTotals.total.toLocaleString('en-IN')}</span>
                                    <span className="text-[9px] text-gray-400">(Comm: {positiveTotals.commission.toLocaleString('en-IN')})</span>
                                </div>
                            </div>

                            {/* HO Balance */}
                            <div className="flex flex-col">
                                <span className="text-2xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">HO Balance</span>
                                <span className={`text-xs font-bold numeric mt-0.5 ${hoBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {hoBalance.toLocaleString('en-IN')}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
