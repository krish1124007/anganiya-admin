import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { Search, RotateCcw, Download } from 'lucide-react';
import { exportTableToPDF, formatNumber } from '../utils/pdfExport';

export default function HOBranchLeader() {
    const [branches, setBranches] = useState([]);
    const [negativeBranches, setNegativeBranches] = useState([]);
    const [positiveBranches, setPositiveBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchBranchData();
    }, []);

    useEffect(() => {
        // Split branches based on opening balance
        const negative = branches.filter(b => (b.opening_balance || 0) < 0);
        const positive = branches.filter(b => (b.opening_balance || 0) >= 0);

        // Apply search filter
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            const filterFunc = b =>
                (b.branch_name || '').toLowerCase().includes(lower) ||
                (b.location || '').toLowerCase().includes(lower);

            setNegativeBranches(negative.filter(filterFunc));
            setPositiveBranches(positive.filter(filterFunc));
        } else {
            setNegativeBranches(negative);
            setPositiveBranches(positive);
        }
    }, [branches, searchTerm]);

    const fetchBranchData = async () => {
        setLoading(true);
        try {
            const res = await api.getAllBranches();
            if (res.success) {
                setBranches(res.data);
            }
        } catch (error) {
            console.error('Error fetching branch data:', error);
        } finally {
            setLoading(false);
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
                `${branch.location} (${branch.branch_name})`,
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
                `${branch.location} (${branch.branch_name})`,
                formatNumber(openingBalance),
                formatNumber(commission),
                formatNumber(total)
            ];
        });

        exportTableToPDF({
            title: 'HO Branch Leader Report',
            headers,
            data: [...negativeData, ...positiveData],
            filename: `ho-branch-leader-${new Date().toISOString().split('T')[0]}`,
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
        <div className={`flex-1 ${type === 'negative' ? 'border-r border-gray-200 dark:border-gray-700' : ''}`}>
            <div className="sticky top-0 bg-white dark:bg-gray-800 z-10 border-b border-gray-200 dark:border-gray-700">
                <div className="px-6 py-3">
                    <h3 className="text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                        {title} ({data.length})
                    </h3>
                </div>
            </div>
            <div className="overflow-auto h-[calc(100%-50px)]">
                <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Sr</th>
                            <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">City Name</th>
                            <th className="px-4 py-2 text-right font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Balance</th>
                            <th className="px-4 py-2 text-right font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Commission</th>
                            <th className="px-4 py-2 text-right font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {data.map((branch, i) => {
                            const commission = branch.commission || 0;
                            const openingBalance = branch.opening_balance || 0;
                            const total = openingBalance + commission;

                            return (
                                <tr key={branch._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <td className="px-4 py-2 text-gray-900 dark:text-white font-medium">{i + 1}</td>
                                    <td className="px-4 py-2 text-gray-900 dark:text-white">
                                        {branch.location} <span className="text-gray-500 text-xs">({branch.branch_name})</span>
                                    </td>
                                    <td className={`px-4 py-2 text-right font-medium ${openingBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                        }`}>
                                        {openingBalance >= 0 ? '+' : ''}{openingBalance.toLocaleString()}
                                    </td>
                                    <td className={`px-4 py-2 text-right font-medium ${commission >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                        }`}>
                                        {commission >= 0 ? '+' : ''}{commission.toLocaleString()}
                                    </td>
                                    <td className={`px-4 py-2 text-right font-bold ${total >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                        }`}>
                                        {total >= 0 ? '+' : ''}{total.toLocaleString()}
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
                        Branches by Opening Balance
                    </p>
                </div>

                <div className="flex items-center gap-2">
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

            <div className="mb-4">
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
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 flex flex-col h-[calc(100vh-140px)]">
                {loading ? (
                    <div className="flex justify-center items-center h-full">
                        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <div className="flex flex-1 overflow-hidden">
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
                            <div className="grid grid-cols-3 gap-2 text-xs">
                                <div className="text-center">
                                    <div className="font-bold text-gray-900 dark:text-white">NEGATIVE TOTAL</div>
                                    <div className="text-gray-500 dark:text-gray-400">
                                        {negativeTotals.count} branches
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="text-gray-500 dark:text-gray-400">Commission</div>
                                    <div className={`font-bold ${negativeTotals.commission >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                        {negativeTotals.commission >= 0 ? '+' : ''}{negativeTotals.commission.toLocaleString()}
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="text-gray-500 dark:text-gray-400">Total</div>
                                    <div className={`font-bold ${negativeTotals.total >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                        {negativeTotals.total >= 0 ? '+' : ''}{negativeTotals.total.toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Positive Totals */}
                        <div className="bg-green-50 dark:bg-green-900/20 p-2">
                            <div className="grid grid-cols-3 gap-2 text-xs">
                                <div className="text-center">
                                    <div className="font-bold text-gray-900 dark:text-white">POSITIVE TOTAL</div>
                                    <div className="text-gray-500 dark:text-gray-400">
                                        {positiveTotals.count} branches
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="text-gray-500 dark:text-gray-400">Commission</div>
                                    <div className={`font-bold ${positiveTotals.commission >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                        {positiveTotals.commission >= 0 ? '+' : ''}{positiveTotals.commission.toLocaleString()}
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="text-gray-500 dark:text-gray-400">Total</div>
                                    <div className={`font-bold ${positiveTotals.total >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                        {positiveTotals.total >= 0 ? '+' : ''}{positiveTotals.total.toLocaleString()}
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
                                {hoBalance >= 0 ? '+' : ''}{hoBalance.toLocaleString()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}