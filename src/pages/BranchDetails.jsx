import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { decrypt_number, decrypt_text } from '../utils/decrypt';
import { Search, ArrowLeft, RotateCcw, Download } from 'lucide-react';
import { exportTableToPDF, formatNumber, formatDate } from '../utils/pdfExport';

export default function BranchDetails({ branchId, onBack }) {
    const [transactions, setTransactions] = useState([]);
    const [filteredTransactions, setFilteredTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [branchName, setBranchName] = useState('');

    useEffect(() => {
        if (branchId) {
            fetchBranchData();
        }
    }, [branchId]);

    useEffect(() => {
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            const filtered = transactions.filter(t =>
                (t.sender_name || '').toLowerCase().includes(lowerTerm) ||
                (t.receiver_name || '').toLowerCase().includes(lowerTerm) ||
                (t.sender_branch_name || '').toLowerCase().includes(lowerTerm) || // Although likely same branch
                (t.receiver_branch_name || '').toLowerCase().includes(lowerTerm) ||
                (String(t.points) || '').includes(lowerTerm) ||
                (String(t.commission) || '').includes(lowerTerm) ||
                new Date(t.createdAt).toLocaleDateString().includes(lowerTerm)
            );
            setFilteredTransactions(filtered);
        } else {
            setFilteredTransactions(transactions);
        }
    }, [searchTerm, transactions]);

    const fetchBranchData = async () => {
        setLoading(true);
        try {
            // Fetch Transactions
            const res = await api.getTransactionBranchWise(branchId);

            if (res.success) {
                const decrypted = res.data.map(t => ({
                    ...t,
                    sender_name: t.sender_name ? decrypt_text(t.sender_name) : '-',
                    receiver_name: t.receiver_name ? decrypt_text(t.receiver_name) : '-',
                    sender_mobile: t.sender_mobile ? decrypt_number(t.sender_mobile) : '-',
                    receiver_mobile: t.receiver_mobile ? decrypt_number(t.receiver_mobile) : '-',
                    points: t.points ? Number(decrypt_number(t.points)) : 0,
                    commission: t.commission ? Number(t.commission) : 0,
                })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Sort desc

                setTransactions(decrypted);
                setFilteredTransactions(decrypted);

                // Try to infer branch name from first transaction or parent passed prop (we don't have parent prop for name here)
                // Ideally we fetch branch details separately or pass it.
                // For now, looking at transactions:
                if (decrypted.length > 0) {
                    // check if sender_branch_id matches or receiver...
                    // Just pick the one that matches branchId if possible, or display both?
                    // Easier: user "AllBranches" passes branch object, but here we only receive ID via props in DashboardLayout logic.
                    // Let's rely on finding standard name from data if meaningful, else just "Branch Details".
                    // Actually, `sender_branch_name` is in transaction.
                    const t = decrypted[0];
                    if (t.sender_branch_id === branchId) setBranchName(t.sender_branch_name);
                    else if (t.receiver_branch_id === branchId) setBranchName(t.receiver_branch_name);
                }
            }
        } catch (error) {
            console.error("Error fetching branch details:", error);
        } finally {
            setLoading(false);
        }
    };

    const calculateTotals = () => {
        return filteredTransactions.reduce((acc, t) => ({
            points: acc.points + (Number(t.points) || 0),
            commission: acc.commission + (Number(t.commission) || 0)
        }), { points: 0, commission: 0 });
    };

    const totals = calculateTotals();

    const handleExportPDF = () => {
        const headers = ['Sr No', 'Date', 'Points', 'Receiver', 'Sender', 'Type', 'Commission'];

        const data = filteredTransactions.map((t, index) => {
            const isSender = t.sender_branch_id === branchId;
            return [
                index + 1,
                formatDate(t.createdAt),
                formatNumber(t.points),
                t.receiver_name,
                t.sender_name,
                isSender ? 'Sent' : 'Received',
                formatNumber(t.commission)
            ];
        });

        const footer = {
            "Total Records": filteredTransactions.length,
            "Total Points": formatNumber(totals.points),
            "Total Commission": formatNumber(totals.commission)
        };

        exportTableToPDF({
            title: `Branch Transactions - ${branchName}`,
            headers,
            data,
            filename: `branch-transactions-${branchName.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}`,
            footer
        });
    };

    return (
        <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-full">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {branchName || 'Branch Transactions'}
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Transaction History</p>
                    </div>
                </div>
                <button
                    onClick={fetchBranchData}
                    className="p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 hover:text-blue-500 transition-colors"
                    title="Refresh"
                >
                    <RotateCcw className="w-5 h-5" />
                </button>
                <button
                    onClick={handleExportPDF}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center space-x-2 transition-colors shadow"
                >
                    <Download className="w-4 h-4" />
                    <span>Download PDF</span>
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 flex flex-col h-[calc(100vh-160px)]">
                {/* Search Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search branch transactions..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
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
                                    <th className="px-6 py-3 font-medium bg-gray-50 dark:bg-gray-700">Date</th>
                                    <th className="px-6 py-3 font-medium bg-gray-50 dark:bg-gray-700 text-right">Points</th>
                                    <th className="px-6 py-3 font-medium bg-gray-50 dark:bg-gray-700">Receiver</th>
                                    <th className="px-6 py-3 font-medium bg-gray-50 dark:bg-gray-700">Sender</th>
                                    <th className="px-6 py-3 font-medium bg-gray-50 dark:bg-gray-700">Type</th>
                                    <th className="px-6 py-3 font-medium bg-gray-50 dark:bg-gray-700 text-right">Commission</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {filteredTransactions.length > 0 ? (
                                    filteredTransactions.map((t, index) => {
                                        const isSender = t.sender_branch_id === branchId;
                                        // const isReceiver = t.receiver_branch_id === branchId;
                                        return (
                                            <tr key={t._id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{index + 1}</td>
                                                <td className="px-6 py-4 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                                    {new Date(t.createdAt).toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white text-right">
                                                    {t.points.toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                                                    <div className="font-medium text-gray-900 dark:text-white">{t.receiver_name}</div>
                                                </td>
                                                <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                                                    <div className="font-medium text-gray-900 dark:text-white">{t.sender_name}</div>
                                                </td>
                                                <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isSender ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                                        {isSender ? 'Sent' : 'Received'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 font-medium text-green-600 dark:text-green-400 text-right">
                                                    {t.commission.toLocaleString()}
                                                </td>
                                            </tr>
                                        )
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                            No transactions found for this branch.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Footer Totals */}
                <div className="bg-gray-100 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex flex-col sm:flex-row justify-between items-center text-sm font-bold text-gray-900 dark:text-white px-2 gap-4 sm:gap-0">
                        <span>Total Records: {filteredTransactions.length}</span>
                        <div className="flex gap-8">
                            <div className="flex gap-2">
                                <span className="text-gray-500 dark:text-gray-400">Total Points:</span>
                                <span>{totals.points.toLocaleString()}</span>
                            </div>
                            <div className="flex gap-2">
                                <span className="text-gray-500 dark:text-gray-400">Total Commission:</span>
                                <span className="text-green-600 dark:text-green-400">{totals.commission.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
