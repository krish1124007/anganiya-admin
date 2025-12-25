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
    const [activeTab, setActiveTab] = useState('sent'); // sent | received

    useEffect(() => {
        if (branchId) fetchBranchData();
    }, [branchId]);

    useEffect(() => {
        let result = transactions.filter(t => t.direction === activeTab);

        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            result = result.filter(t =>
                (t.sender_name || '').toLowerCase().includes(lower) ||
                (t.receiver_name || '').toLowerCase().includes(lower) ||
                (t.sender_branch_name || '').toLowerCase().includes(lower) ||
                (t.receiver_branch_name || '').toLowerCase().includes(lower) ||
                String(t.points).includes(lower) ||
                String(t.commission).includes(lower) ||
                new Date(t.createdAt).toLocaleDateString().includes(lower)
            );
        }

        setFilteredTransactions(result);
    }, [transactions, activeTab, searchTerm]);

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
                        commission: Number(t.commission || 0),
                    };
                }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

                setTransactions(normalized);

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

    const totals = filteredTransactions.reduce(
        (acc, t) => {
            acc.points += t.points;
            acc.commission += t.commission;
            return acc;
        },
        { points: 0, commission: 0 }
    );

    const handleExportPDF = () => {
        const headers =
            activeTab === 'sent'
                ? ['Sr No', 'Date', 'Points', 'Receiver', 'To Branch', 'Commission']
                : ['Sr No', 'Date', 'Points', 'Sender', 'From Branch', 'Commission'];

        const data = filteredTransactions.map((t, index) => [
            index + 1,
            formatDate(t.createdAt),
            formatNumber(t.points),
            activeTab === 'sent' ? t.receiver_name : t.sender_name,
            activeTab === 'sent' ? t.receiver_branch_name : t.sender_branch_name,
            formatNumber(t.commission),
        ]);

        exportTableToPDF({
            title: `${branchName} - ${activeTab === 'sent' ? 'Sent' : 'Received'} Transactions`,
            headers,
            data,
            filename: `branch-${activeTab}-${branchName.replace(/\s+/g, '-').toLowerCase()}`,
            footer: {
                Records: filteredTransactions.length,
                Points: formatNumber(totals.points),
                Commission: formatNumber(totals.commission),
            },
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
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                            Transaction History
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchBranchData}
                        className="p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 hover:text-blue-500"
                    >
                        <RotateCcw className="w-5 h-5" />
                    </button>
                    <button
                        onClick={handleExportPDF}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 shadow"
                    >
                        <Download className="w-4 h-4" />
                        <span>Download PDF</span>
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 flex flex-col h-[calc(100vh-160px)]">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-4">
                    <div className="flex space-x-4 border-b border-gray-200 dark:border-gray-700">
                        <button
                            className={`pb-2 px-4 text-sm font-medium border-b-2 ${activeTab === 'sent'
                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-gray-500'
                                }`}
                            onClick={() => setActiveTab('sent')}
                        >
                            Sent Transactions
                        </button>
                        <button
                            className={`pb-2 px-4 text-sm font-medium border-b-2 ${activeTab === 'received'
                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-gray-500'
                                }`}
                            onClick={() => setActiveTab('received')}
                        >
                            Received Transactions
                        </button>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="Search transactions..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-auto">
                    {loading ? (
                        <div className="flex justify-center items-center h-full">
                            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Sr No</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Points</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        {activeTab === 'sent' ? 'Receiver' : 'Sender'}
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        {activeTab === 'sent' ? 'To Branch' : 'From Branch'}
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Commission</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {filteredTransactions.map((t, i) => (
                                    <tr key={t._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-medium">{i + 1}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                            {new Date(t.createdAt).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-right font-medium text-gray-900 dark:text-white">
                                            {t.points.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300">
                                            {activeTab === 'sent' ? t.receiver_name : t.sender_name}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300">
                                            {activeTab === 'sent'
                                                ? t.receiver_branch_name
                                                : t.sender_branch_name}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-right font-medium text-green-600 dark:text-green-400">
                                            {t.commission.toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
