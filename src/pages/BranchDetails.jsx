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
    const [transactionBalance, setTransactionBalance] = useState(0);
    const [remainingTransferCommission, setRemainingTransferCommission] = useState(0);
    const [selectedDate, setSelectedDate] = useState('');

    useEffect(() => {
        if (branchId) fetchBranchData();
    }, [branchId, selectedDate]);

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
            // Fetch both transaction data and branch data
            const [transactionRes, branchesRes] = await Promise.all([
                api.getTransactionBranchWise(branchId, selectedDate),
                api.getAllBranches(selectedDate)
            ]);

            if (transactionRes.success) {
                const normalized = transactionRes.data.map(t => {
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
                    };
                }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

                setTransactions(normalized);

                // Get opening balance from the branches API
                if (branchesRes.success && branchesRes.data) {
                    const branch = branchesRes.data.find(b => String(b._id) === String(branchId));
                    if (branch) {
                        setOpeningBalance(Number(branch.opening_balance || 0));
                        setTransactionBalance(Number(branch.transaction_balance !== undefined ? branch.transaction_balance : branch.opening_balance || 0));
                        setRemainingTransferCommission(Number(branch.remaining_transfer_commission || 0));
                        setBranchName(branch.branch_name || '');
                    }
                } else if (normalized.length > 0) {
                    // Fallback: set opening balance to 0 if branches API fails
                    setOpeningBalance(0);
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

    // Total points transferred (absolute values)
    const totalSentPoints = sentTransactions.reduce((sum, t) => sum + (t.points || 0), 0);
    const totalReceivedPoints = receivedTransactions.reduce((sum, t) => sum + (t.points || 0), 0);

    // Total commission earned/lost (absolute values)
    const totalSentCommission = sentTransactions.reduce((sum, t) => sum + (t.sender_commision || 0), 0);
    const totalReceivedCommission = receivedTransactions.reduce((sum, t) => sum + (t.receiver_commision || 0), 0);

    // --- Ledger Calculations (matching the requested image logic) ---
    // Net Points = Received - Sent (so inflow is positive)
    const netPointsValue = totalReceivedPoints - totalSentPoints;
    // Total Commission earned (sum of all commissions)
    const totalNetCommission = totalSentCommission + totalReceivedCommission;
    // Balance Before Commission = Opening + Net Points
    const balanceBeforeCommission = openingBalance + netPointsValue;
    // Balance After Commission (Final Balance) = Bal Before Comm + Commission
    const balanceAfterCommission = balanceBeforeCommission + totalNetCommission;

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
                'Net Points': formatNumber(netPointsValue),
                'Total Commission': formatNumber(totalNetCommission),
                'Balance Before Commission': formatNumber(balanceBeforeCommission),
                'Balance After Commission': formatNumber(balanceAfterCommission),
            },
        });
    };

    const renderTable = (title, data, type) => (
        <div className={`flex-1 ${type === 'received' ? 'border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700' : ''}`}>
            <div className="sticky top-0 bg-white dark:bg-gray-800 z-10 border-b border-gray-200 dark:border-gray-700">
                <div className="px-3 py-2">
                    <h3 className="text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                        {title} ({data.length})
                    </h3>
                </div>
            </div>
            <div className="overflow-auto h-[calc(100%-80px)]">
                <table className="w-full text-[10px]">
                    <thead className="sticky top-0 bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-2 py-1.5 text-left font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">#</th>
                            <th className="px-2 py-1.5 text-left font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                            <th className="px-2 py-1.5 text-right font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Points</th>
                            <th className="px-2 py-1.5 text-left font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                {type === 'sent' ? 'Receiver' : 'Sender'}
                            </th>
                            <th className="px-2 py-1.5 text-left font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                {type === 'sent' ? 'To Branch' : 'From Branch'}
                            </th>
                            <th className="px-2 py-1.5 text-right font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Commission</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {data.map((t, i) => (
                            <tr key={`${type}-${t._id}`} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <td className="px-2 py-1 text-gray-900 dark:text-white font-medium">{i + 1}</td>
                                <td className="px-2 py-1 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                    {new Date(t.createdAt).toLocaleDateString()} {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </td>
                                <td className={`px-2 py-1 text-right font-medium ${type === 'sent'
                                    ? 'text-green-600 dark:text-green-400'
                                    : 'text-red-600 dark:text-red-400'
                                    }`}>
                                    {type === 'sent' ? '+' : '-'}{t.points.toLocaleString('en-IN')}
                                </td>
                                <td className="px-2 py-1 text-gray-500 dark:text-gray-300">
                                    {type === 'sent' ? t.receiver_name : t.sender_name}
                                </td>
                                <td className="px-2 py-1 text-gray-500 dark:text-gray-300">
                                    {type === 'sent' ? t.receiver_branch_name : t.sender_branch_name}
                                </td>
                                <td className="px-2 py-1 text-right font-medium text-green-600 dark:text-green-400">
                                    +{(type === 'sent' ? t.sender_commision : t.receiver_commision).toLocaleString('en-IN')}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* In-table Summary Footer (Numerical Calculations) */}
            <div className="bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 p-2">
                <div className="flex items-center justify-between text-gray-900 dark:text-white">
                    <div>
                        <p className="text-[10px] text-gray-500 font-bold">{data.length} Record(s)</p>
                    </div>
                    <div className="flex gap-4">
                        {type === 'received' ? (
                            <div className="text-right">
                                <p className="text-[9px] text-gray-500 uppercase font-black tracking-wider">Rec Point + Comm</p>
                                <p className="text-base font-black text-red-600">
                                    {(totalReceivedPoints + totalReceivedCommission).toLocaleString('en-IN')}
                                </p>
                                <p className="text-[8px] text-gray-400">({totalReceivedPoints.toLocaleString('en-IN')} + {totalReceivedCommission.toLocaleString('en-IN')})</p>
                            </div>
                        ) : (
                            <div className="text-right">
                                <p className="text-[9px] text-gray-500 uppercase font-black tracking-wider">Sent Point + Comm</p>
                                <p className="text-base font-black text-green-600">
                                    {(totalSentPoints + totalSentCommission).toLocaleString('en-IN')}
                                </p>
                                <p className="text-[8px] text-gray-400">({totalSentPoints.toLocaleString('en-IN')} + {totalSentCommission.toLocaleString('en-IN')})</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="p-2 md:p-4 bg-gray-50 dark:bg-gray-900 min-h-full">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onBack}
                        className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                    </button>
                    <div>
                        <h1 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
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
                        <span className="hidden md:inline">Export PDF</span>
                    </button>
                </div>
            </div>

            <div className="mb-4 flex flex-col md:flex-row items-center justify-between gap-4">
                {/* Left Side Boxes: Total Points & Total Commission */}
                {/* <div className="flex gap-3">
                    <div className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-sm">
                        <p className="text-[10px] uppercase font-bold opacity-80">Total Points</p>
                        <p className="text-xl font-black">
                            {(totalSentPoints + totalReceivedPoints).toLocaleString('en-IN')}
                        </p>
                    </div>
                    <div className="bg-green-600 text-white px-4 py-2 rounded-lg shadow-sm">
                        <p className="text-[10px] uppercase font-bold opacity-80">Total Commission</p>
                        <p className="text-xl font-black">
                            {totalNetCommission.toLocaleString('en-IN')}
                        </p>
                    </div>
                </div> */}

                {/* Right Side Box: Opening Balance */}
                <div className="w-full md:w-auto bg-white dark:bg-gray-800 border-2 border-primary-500 px-4 py-2 rounded-lg shadow-sm text-center md:text-left">
                    <p className="text-[10px] text-gray-500 uppercase font-black">Opening Balance</p>
                    <p className={`text-xl font-black ${openingBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {openingBalance.toLocaleString('en-IN')}
                    </p>
                </div>
            </div>

            {/* Search and Date Row */}
            <div className="mb-4 flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Search transactions..."
                        className="w-full pl-9 pr-4 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    />
                </div>
                <div className="flex gap-2">
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={e => setSelectedDate(e.target.value)}
                        className="flex-1 md:flex-none px-4 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    />
                    {selectedDate && (
                        <button
                            onClick={() => setSelectedDate('')}
                            className="px-3 py-1.5 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium transition-colors"
                        >
                            Reset
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 flex flex-col h-[calc(100vh-140px)]">
                {loading ? (
                    <div className="flex justify-center items-center h-full">
                        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
                        {/* Received transactions first */}
                        {renderTable('Received Transactions', receivedTransactions, 'received')}
                        {renderTable('Sent Transactions', sentTransactions, 'sent')}
                    </div>
                )}

                <div className="border-t-2 border-gray-300 dark:border-gray-600">
                    <div className="bg-gray-200 dark:bg-gray-800 p-2 md:p-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 items-center">

                            {/* Receive Calculation Box */}
                            <div className="bg-white dark:bg-gray-700 p-2 rounded border border-gray-300 dark:border-gray-600">
                                <p className="text-[10px] text-gray-500 uppercase font-bold text-center border-b pb-1 mb-1">Receive Calculation</p>
                                <div className="flex justify-between text-[11px] font-bold">
                                    <span>Points + Comm:</span>
                                    <span className="text-red-600">{(totalReceivedPoints + totalReceivedCommission).toLocaleString('en-IN')}</span>
                                </div>
                            </div>
                            {/* Send Calculation Box */}
                            <div className="bg-white dark:bg-gray-700 p-2 rounded border border-gray-300 dark:border-gray-600">
                                <p className="text-[10px] text-gray-500 uppercase font-bold text-center border-b pb-1 mb-1">Sent Calculation</p>
                                <div className="flex justify-between text-[11px] font-bold">
                                    <span>Points + Comm:</span>
                                    <span className="text-green-600">{(totalSentPoints + totalSentCommission).toLocaleString('en-IN')}</span>
                                </div>
                            </div>




                            {/* Bal Before Comm */}
                            <div className="text-center">
                                <p className="text-[10px] text-gray-500 uppercase font-black">before commision</p>
                                <p className="text-2xl font-black text-blue-600">
                                    {transactionBalance.toLocaleString('en-IN')}
                                </p>
                                <p className="text-[9px] text-gray-400 mt-1">(transaction balance)</p>
                            </div>

                            {/* Final Balance */}
                            <div className="text-center">
                                <p className="text-[10px] text-gray-500 uppercase font-black">after comiision</p>
                                <p className="text-2xl font-black text-green-600">
                                    {(transactionBalance + remainingTransferCommission).toLocaleString('en-IN')}
                                </p>
                                <p className="text-[9px] text-gray-400 mt-1">(transaction balance + remaining transfer commission)</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}