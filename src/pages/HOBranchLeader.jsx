import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { Search, RotateCcw, Download, Calendar, X, ShieldCheck } from 'lucide-react';
import { exportTableToPDF, formatNumber } from '../utils/pdfExport';

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
        // Filter branches: Exclude branches with 'commission' in the name
        // Now showing all other branches regardless of transactions or commission count
        const filteredBranches = branches.filter(b => {
            const branchName = (b.branch_name || '').toLowerCase();

            // Exclude branches with 'commission' in the name
            if (branchName.includes('commission')) {
                return false;
            }

            return true;
        });

        // Split branches based on opening balance
        const negative = filteredBranches.filter(b => (b.opening_balance || 0) < 0);
        const positive = filteredBranches.filter(b => (b.opening_balance || 0) >= 0);

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
                const openingBalance = branch.opening_balance || 0;
                const commission = branch.commission || 0;
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
            const commission = branch.commission || 0;
            const openingBalance = branch.opening_balance || 0;
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
            const commission = branch.commission || 0;
            const openingBalance = branch.opening_balance || 0;
            const total = openingBalance + commission;

            return [
                index + 1,
                branch.branch_name,
                formatNumber(openingBalance),
                formatNumber(commission),
                formatNumber(total)
            ];
        });

        exportTableToPDF({
            title: `HO Branch Leader Report - ${selectedDate || 'Today'}`,
            headers,
            data: [...negativeData, ...positiveData],
            filename: `ho-branch-leader-${selectedDate || new Date().toISOString().split('T')[0]}`,
            footer: {
                'Negative Branches Count': negativeBranches.length,
                'Negative Total Commission': formatNumber(negativeTotals.commission),
                'Negative Grand Total': formatNumber(negativeTotals.total),
                'Positive Branches Count': positiveBranches.length,
                'Positive Total Commission': formatNumber(positiveTotals.commission),
                'Positive Grand Total': formatNumber(positiveTotals.total),
                'HO Balance': formatNumber(hoBalance),
            },
        });
    };

    const renderTable = (title, data, type) => (
        <div className={`flex-1 ${type === 'negative' ? 'border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700' : ''}`}>
            <div className="sticky top-0 bg-white dark:bg-gray-800 z-10 border-b border-gray-200 dark:border-gray-700">
                <div className="px-3 py-2">
                    <h3 className="text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                        {title} ({data.length})
                    </h3>
                </div>
            </div>
            <div className="overflow-auto h-[calc(100%-50px)]">
                <table className="w-full text-[10px]">
                    <thead className="sticky top-0 bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-2 py-1.5 text-left font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Sr</th>
                            <th className="px-2 py-1.5 text-left font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">City Name</th>
                            <th className="px-2 py-1.5 text-right font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Balance</th>
                            <th className="px-2 py-1.5 text-right font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Commission</th>
                            <th className="px-2 py-1.5 text-right font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {data.map((branch, i) => {
                            const commission = branch.commission || 0;
                            const openingBalance = branch.opening_balance || 0;
                            const total = openingBalance + commission;

                            return (
                                <tr key={branch._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <td className="px-2 py-1 text-gray-900 dark:text-white font-medium">{i + 1}</td>
                                    <td className="px-2 py-1 text-gray-900 dark:text-white">
                                        {branch.branch_name}
                                    </td>
                                    <td className={`px-2 py-1 text-right font-medium ${openingBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                        }`}>
                                        {openingBalance >= 0 ? '+' : ''}{openingBalance.toLocaleString('en-IN')}
                                    </td>
                                    <td className={`px-2 py-1 text-right font-medium ${commission >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                        }`}>
                                        {commission >= 0 ? '+' : ''}{commission.toLocaleString('en-IN')}
                                    </td>
                                    <td className={`px-2 py-1 text-right font-bold ${total >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
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
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                        HO Branch Leader
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-xs">
                        Branches by Opening Balance {selectedDate ? `- ${selectedDate}` : '(Today)'}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {/* Finalize Button */}
                    {!selectedDate && (
                        <button
                            onClick={handleFinalize}
                            disabled={finalizing}
                            className="px-3 py-1.5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-lg flex items-center gap-2 shadow text-sm disabled:opacity-50"
                            title="Finalize Today's Commission"
                        >
                            <ShieldCheck className={`w-4 h-4 ${finalizing ? 'animate-pulse' : ''}`} />
                            <span>{finalizing ? 'Finalizing...' : 'Finalize Day'}</span>
                        </button>
                    )}

                    <button
                        onClick={fetchBranchData}
                        className="p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 hover:text-blue-500"
                    >
                        <RotateCcw className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleExportPDF}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 shadow text-sm"
                    >
                        <Download className="w-3 h-3" />
                        <span>Export PDF</span>
                    </button>
                </div>
            </div>

            <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Search branches..."
                        className="w-full pl-9 pr-4 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    />
                </div>

                {/* Date Picker */}
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="w-full pl-9 pr-4 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        />
                    </div>
                    {selectedDate && (
                        <button
                            onClick={() => setSelectedDate('')}
                            className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center gap-1 text-sm"
                        >
                            <X className="w-3 h-3" />
                            <span>Clear</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 flex flex-col h-[calc(100vh-180px)]">
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
                <div className="border-t border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-2 divide-x divide-gray-200 dark:divide-gray-700">
                        {/* Negative Totals */}
                        <div className="bg-red-50 dark:bg-red-900/20 p-2">
                            <div className="grid grid-cols-4 gap-2 text-xs">
                                <div className="text-center">
                                    <div className="font-bold text-gray-900 dark:text-white uppercase">Negative</div>
                                    <div className="text-gray-500 dark:text-gray-400">
                                        {negativeTotals.count} branches
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="text-gray-500 dark:text-gray-400">Balance</div>
                                    <div className={`font-bold ${negativeTotals.openingBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                        {negativeTotals.openingBalance >= 0 ? '+' : ''}{negativeTotals.openingBalance.toLocaleString('en-IN')}
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="text-gray-500 dark:text-gray-400">Commission</div>
                                    <div className="font-bold text-blue-600 dark:text-blue-400">
                                        {negativeTotals.commission.toLocaleString('en-IN')}
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="text-gray-500 dark:text-gray-400">Total</div>
                                    <div className={`font-bold ${negativeTotals.total >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                        {negativeTotals.total >= 0 ? '+' : ''}{negativeTotals.total.toLocaleString('en-IN')}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Positive Totals */}
                        <div className="bg-green-50 dark:bg-green-900/20 p-2">
                            <div className="grid grid-cols-4 gap-2 text-xs">
                                <div className="text-center">
                                    <div className="font-bold text-gray-900 dark:text-white uppercase">Positive</div>
                                    <div className="text-gray-500 dark:text-gray-400">
                                        {positiveTotals.count} branches
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="text-gray-500 dark:text-gray-400">Balance</div>
                                    <div className={`font-bold ${positiveTotals.openingBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                        {positiveTotals.openingBalance >= 0 ? '+' : ''}{positiveTotals.openingBalance.toLocaleString('en-IN')}
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="text-gray-500 dark:text-gray-400">Commission</div>
                                    <div className="font-bold text-blue-600 dark:text-blue-400">
                                        {positiveTotals.commission.toLocaleString('en-IN')}
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="text-gray-500 dark:text-gray-400">Total</div>
                                    <div className={`font-bold ${positiveTotals.total >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                        {positiveTotals.total >= 0 ? '+' : ''}{positiveTotals.total.toLocaleString('en-IN')}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Simple HO Balance at bottom */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-2">
                        <div className="flex items-center justify-center">
                            <div className="font-bold text-gray-900 dark:text-white">HO Balance:</div>
                            <div className={`ml-2 text-lg font-bold ${hoBalance === 0 ? 'text-blue-600 dark:text-blue-400' : hoBalance > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {hoBalance >= 0 ? '+' : ''}{hoBalance.toLocaleString('en-IN')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
