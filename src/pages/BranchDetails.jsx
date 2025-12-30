import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { decrypt_number, decrypt_text } from '../utils/decrypt';
import { Search, ArrowLeft, RotateCcw, Download } from 'lucide-react';
import { exportTableToPDF, formatNumber, formatDate } from '../utils/pdfExport';

export default function BranchDetails({ branchId, onBack }) {
    const [transactions, setTransactions] = useState([]);
    const [sentTransactions, setSentTransactions] = useState([]);
    const [receivedTransactions, setReceivedTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [branchName, setBranchName] = useState('');
    const [openingBalance, setOpeningBalance] = useState(0);

    useEffect(() => {
        if (branchId) fetchBranchData();
    }, [branchId]);

    useEffect(() => {
        const sent = transactions.filter(t => t.direction === 'sent');
        const received = transactions.filter(t => t.direction === 'received');

        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            const filterFunc = t =>
                (t.sender_name || '').toLowerCase().includes(lower) ||
                (t.receiver_name || '').toLowerCase().includes(lower) ||
                (t.sender_branch_name || '').toLowerCase().includes(lower) ||
                (t.receiver_branch_name || '').toLowerCase().includes(lower) ||
                String(t.points).includes(lower) ||
                String(t.sender_commision || 0).includes(lower) ||
                String(t.receiver_commision || 0).includes(lower) ||
                new Date(t.createdAt).toLocaleDateString().includes(lower);

            setSentTransactions(sent.filter(filterFunc));
            setReceivedTransactions(received.filter(filterFunc));
        } else {
            setSentTransactions(sent);
            setReceivedTransactions(received);
        }
    }, [transactions, searchTerm]);

    const fetchBranchData = async () => {
        setLoading(true);
        try {
            const res = await api.getTransactionBranchWise(branchId);

            if (res.success) {
                const normalized = res.data.map(t => {
                    const isSent = String(t.sender_branch) === String(branchId);

                    return {
                        ...t,
                        direction: isSent ? 'sent' : 'received',
                        sender_name: t.sender_name ? decrypt_text(t.sender_name) : '-',
                        receiver_name: t.receiver_name ? decrypt_text(t.receiver_name) : '-',
                        sender_mobile: t.sender_mobile ? decrypt_number(t.sender_mobile) : '-',
                        receiver_mobile: t.receiver_mobile ? decrypt_number(t.receiver_mobile) : '-',
                        points: t.points ? Number(decrypt_number(t.points)) : 0,
                        sender_commision: Number(t.sender_commision || 0),
                        receiver_commision: Number(t.receiver_commision || 0),
                        commission: Number(t.commission || 0), // Keep for backward compatibility
                        opening_balance: Number(t.opening_balance || 0),
                    };
                }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

                setTransactions(normalized);

                // Calculate total opening balance from all transactions
                const totalOpening = normalized.reduce((sum, t) => sum + (t.opening_balance || 0), 0);
                setOpeningBalance(totalOpening);

                if (normalized.length > 0) {
                    const t = normalized[0];
                    setBranchName(
                        String(t.sender_branch) === String(branchId)
                            ? t.sender_branch_name
                            : t.receiver_branch_name
                    );
                }
            }
        } catch (error) {
            console.error('Error fetching branch details:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateTotals = (transactions, type) => {
        return transactions.reduce(
            (acc, t) => {
                const points = t.points || 0;
                // Use sender_commision for sent, receiver_commision for received
                const commission = type === 'sent'
                    ? (t.sender_commision || 0)
                    : (t.receiver_commision || 0);
                const openingBalance = t.opening_balance || 0;

                // For sent transactions: points are positive, commission is positive
                // For received transactions: points are negative, commission is positive
                const pointMultiplier = type === 'sent' ? 1 : -1;
                // Commission is always positive
                const commissionMultiplier = 1;

                acc.points += points * pointMultiplier;
                acc.commission += commission * commissionMultiplier;
                acc.opening_balance += openingBalance;
                acc.count += 1;

                return acc;
            },
            {
                points: 0,
                commission: 0,
                opening_balance: 0,
                count: 0
            }
        );
    };

    const sentTotals = calculateTotals(sentTransactions, 'sent');
    const receivedTotals = calculateTotals(receivedTransactions, 'received');

    // Calculate net values
    // sentTotals.points is positive, receivedTotals.points is negative
    const netPoints = sentTotals.points + receivedTotals.points;
    // Both commissions are positive
    const netCommission = sentTotals.commission + receivedTotals.commission;

    // Total points transferred (absolute values)
    const totalSentPoints = sentTransactions.reduce((sum, t) => sum + (t.points || 0), 0);
    const totalReceivedPoints = receivedTransactions.reduce((sum, t) => sum + (t.points || 0), 0);

    // Total commission earned/lost (absolute values)
    const totalSentCommission = sentTransactions.reduce((sum, t) => sum + (t.sender_commision || 0), 0);
    const totalReceivedCommission = receivedTransactions.reduce((sum, t) => sum + (t.receiver_commision || 0), 0);

    // Net balance calculation
    const netBalance = openingBalance + netPoints + netCommission;

    // Total balance calculation (positive balance + negative balance + commission)
    const totalBalance = sentTotals.points + receivedTotals.points + netCommission;

    // Today's profit = net commission (if positive, it's profit; if negative, it's loss)
    const todayProfit = netCommission;

    const handleExportPDF = () => {
        const headers = [
            'Sr No', 'Date', 'Type', 'Points', 'Sender/Receiver', 'Branch', 'Commission'
        ];

        const data = [
            ...receivedTransactions.map((t, index) => [
                index + 1,
                formatDate(t.createdAt),
                'Received',
                formatNumber(t.points),
                t.sender_name,
                t.sender_branch_name,
                formatNumber(t.receiver_commision || 0),
            ]),
            ...sentTransactions.map((t, index) => [
                receivedTransactions.length + index + 1,
                formatDate(t.createdAt),
                'Sent',
                formatNumber(t.points),
                t.receiver_name,
                t.receiver_branch_name,
                formatNumber(t.sender_commision || 0),
            ])
        ];

        exportTableToPDF({
            title: `${branchName} - All Transactions`,
            headers,
            data,
            filename: `branch-all-${branchName.replace(/\s+/g, '-').toLowerCase()}`,
            footer: {
                'Opening Balance': formatNumber(openingBalance),
                'Total Received Points': formatNumber(totalReceivedPoints),
                'Total Sent Points': formatNumber(totalSentPoints),
                'Total Received Commission': formatNumber(totalReceivedCommission),
                'Total Sent Commission': formatNumber(totalSentCommission),
                'Net Points': formatNumber(netPoints),
                'Net Commission': formatNumber(netCommission),
                'Today\'s Profit/Loss': formatNumber(todayProfit),
                'Closing Balance': formatNumber(netBalance),
            },
        });
    };

    const renderTable = (title, data, type) => (
        <div className={`flex-1 ${type === 'received' ? 'border-r border-gray-200 dark:border-gray-700' : ''}`}>
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
                            <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">#</th>
                            <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                            <th className="px-4 py-2 text-right font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Points</th>
                            <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                {type === 'sent' ? 'Receiver' : 'Sender'}
                            </th>
                            <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                {type === 'sent' ? 'To Branch' : 'From Branch'}
                            </th>
                            <th className="px-4 py-2 text-right font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Commission</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {data.map((t, i) => (
                            <tr key={`${type}-${t._id}`} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <td className="px-4 py-2 text-gray-900 dark:text-white font-medium">{i + 1}</td>
                                <td className="px-4 py-2 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                    {new Date(t.createdAt).toLocaleDateString()} {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </td>
                                <td className={`px-4 py-2 text-right font-medium ${type === 'sent'
                                    ? 'text-green-600 dark:text-green-400'
                                    : 'text-red-600 dark:text-red-400'
                                    }`}>
                                    {type === 'sent' ? '+' : '-'}{t.points.toLocaleString()}
                                </td>
                                <td className="px-4 py-2 text-gray-500 dark:text-gray-300">
                                    {type === 'sent' ? t.receiver_name : t.sender_name}
                                </td>
                                <td className="px-4 py-2 text-gray-500 dark:text-gray-300">
                                    {type === 'sent' ? t.receiver_branch_name : t.sender_branch_name}
                                </td>
                                <td className="px-4 py-2 text-right font-medium text-green-600 dark:text-green-400">
                                    +{(type === 'sent' ? t.sender_commision : t.receiver_commision).toLocaleString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    return (
        <div className="p-4 bg-gray-50 dark:bg-gray-900 min-h-full">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onBack}
                        className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                            {branchName || 'Branch Transactions'}
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 text-xs">
                            Transaction History
                        </p>
                    </div>
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
                        placeholder="Search all transactions..."
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
                        {/* Received transactions first */}
                        {renderTable('Received Transactions', receivedTransactions, 'received')}
                        {renderTable('Sent Transactions', sentTransactions, 'sent')}
                    </div>
                )}

                {/* Summary Footer - Only NET SUMMARY */}
                <div className="border-t border-gray-200 dark:border-gray-700">
                    {/* Net Summary */}
                    <div className="bg-gray-100 dark:bg-gray-700 p-2">
                        <div className="grid grid-cols-7 gap-2 text-xs">
                            <div className="text-center">
                                <div className="font-bold text-gray-900 dark:text-white">NET SUMMARY</div>
                                <div className="text-gray-500 dark:text-gray-400">
                                    {sentTotals.count + receivedTotals.count} transactions
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-gray-500 dark:text-gray-400">Opening Balance</div>
                                <div className={`font-bold ${openingBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                    {openingBalance.toLocaleString()}
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-gray-500 dark:text-gray-400">Net Points</div>
                                <div className={`font-bold ${netPoints >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                    {netPoints >= 0 ? '+' : ''}{netPoints.toLocaleString()}
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-gray-500 dark:text-gray-400">Net Commission</div>
                                <div className="font-bold text-green-600 dark:text-green-400">
                                    +{netCommission.toLocaleString()}
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-gray-500 dark:text-gray-400">Today's Profit/Loss</div>
                                <div className={`font-bold ${todayProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                    {todayProfit >= 0 ? '+' : ''}{todayProfit.toLocaleString()}
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-gray-500 dark:text-gray-400">Total Balance</div>
                                <div className={`font-bold ${totalBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                    {totalBalance >= 0 ? '+' : ''}{totalBalance.toLocaleString()}
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-gray-500 dark:text-gray-400">Closing Balance</div>
                                <div className={`font-bold ${netBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                    {netBalance >= 0 ? '+' : ''}{netBalance.toLocaleString()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}