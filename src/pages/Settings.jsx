import { useState } from 'react';
import { Calendar, Download, FileJson, FileText, RotateCcw } from 'lucide-react';
import { exportTableToPDF, formatNumber } from '../utils/pdfExport';

export default function Settings() {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Format date from YYYY-MM-DD to dd/mm/yy for API
    const formatDateForAPI = (dateString) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = String(date.getFullYear()).slice(-2);
        return `${day}/${month}/${year}`;
    };

    const fetchDateRangeReport = async () => {
        if (!startDate || !endDate) {
            setError('Please select both start and end dates');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('accesstoken');
            const response = await fetch('https://angaditya-backend.onrender.com/api/v1/admin/get-date-range-report', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    start_date: formatDateForAPI(startDate),
                    end_date: formatDateForAPI(endDate)
                })
            });

            const data = await response.json();

            if (data.success) {
                setReportData(data.data);
            } else {
                setError(data.message || 'Failed to fetch report');
            }
        } catch (err) {
            console.error('Error fetching report:', err);
            setError('Failed to fetch report. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadJSON = () => {
        if (!reportData) return;

        const dataStr = JSON.stringify(reportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `report-${formatDateForAPI(startDate)}-to-${formatDateForAPI(endDate)}.json`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleDownloadPDF = () => {
        if (!reportData) return;

        const headers = ['Sr No', 'Sender Branch', 'Receiver Branch', 'Sender Name', 'Receiver Name', 'Points', 'Commission', 'Status'];

        const data = reportData.transactions.data.map((txn, index) => [
            index + 1,
            txn.sender_branch_name || 'N/A',
            txn.receiver_branch_name || 'N/A',
            txn.sender_name,
            txn.receiver_name,
            txn.points,
            formatNumber(txn.commission),
            txn.status ? 'Completed' : 'Pending'
        ]);

        const footer = {
            'Total Transactions': reportData.transactions.total_count,
            'Approved Transactions': reportData.transactions.approved_count,
            'Completed Transactions': reportData.transactions.completed_count,
            'Total Commission': formatNumber(reportData.statistics.total_commission),
            'Days Covered': reportData.date_range.days_covered
        };

        exportTableToPDF({
            title: `Date Range Report (${formatDateForAPI(startDate)} to ${formatDateForAPI(endDate)})`,
            headers,
            data,
            filename: `date-range-report-${formatDateForAPI(startDate)}-to-${formatDateForAPI(endDate)}`,
            footer
        });
    };

    const handleReset = () => {
        setStartDate('');
        setEndDate('');
        setReportData(null);
        setError('');
    };

    return (
        <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-full">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings & Reports</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Generate and download date range reports</p>
                </div>

                {/* Date Range Selection Card */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Date Range Report</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        {/* Start Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Start Date (DD/MM/YY)
                            </label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>
                        </div>

                        {/* End Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                End Date (DD/MM/YY)
                            </label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={fetchDateRangeReport}
                            disabled={loading || !startDate || !endDate}
                            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg flex items-center space-x-2 transition-colors shadow font-medium"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>Generating...</span>
                                </>
                            ) : (
                                <>
                                    <Download className="w-4 h-4" />
                                    <span>Generate Report</span>
                                </>
                            )}
                        </button>

                        {reportData && (
                            <>
                                <button
                                    onClick={handleDownloadJSON}
                                    className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center space-x-2 transition-colors shadow font-medium"
                                >
                                    <FileJson className="w-4 h-4" />
                                    <span>Download JSON</span>
                                </button>

                                <button
                                    onClick={handleDownloadPDF}
                                    className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center space-x-2 transition-colors shadow font-medium"
                                >
                                    <FileText className="w-4 h-4" />
                                    <span>Download PDF</span>
                                </button>
                            </>
                        )}

                        <button
                            onClick={handleReset}
                            className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg flex items-center space-x-2 transition-colors shadow font-medium"
                        >
                            <RotateCcw className="w-4 h-4" />
                            <span>Reset</span>
                        </button>
                    </div>
                </div>

                {/* Report Display */}
                {reportData && (
                    <div className="space-y-6">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Date Range</h3>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                                    {reportData.date_range.days_covered} Days
                                </p>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                    {formatDateForAPI(startDate)} to {formatDateForAPI(endDate)}
                                </p>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Transactions</h3>
                                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                                    {reportData.transactions.total_count}
                                </p>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                    {reportData.transactions.approved_count} approved
                                </p>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Commission</h3>
                                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-2">
                                    {formatNumber(reportData.statistics.total_commission)}
                                </p>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                    Avg: {reportData.statistics.transactions_per_day} per day
                                </p>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Branches</h3>
                                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-2">
                                    {reportData.summary.total_branches_with_activity}
                                </p>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                    With transactions
                                </p>
                            </div>
                        </div>

                        {/* Branch Statistics */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Branch Statistics</h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                        <tr>
                                            <th className="px-6 py-3">Branch Name</th>
                                            <th className="px-6 py-3 text-right">Sent Count</th>
                                            <th className="px-6 py-3 text-right">Received Count</th>
                                            <th className="px-6 py-3 text-right">Total Commission</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {reportData.statistics.branch_statistics.map((branch, index) => (
                                            <tr key={index} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                                    {branch.branch_name}
                                                </td>
                                                <td className="px-6 py-4 text-right text-blue-600 dark:text-blue-400">
                                                    {branch.sent_count}
                                                </td>
                                                <td className="px-6 py-4 text-right text-green-600 dark:text-green-400">
                                                    {branch.received_count}
                                                </td>
                                                <td className="px-6 py-4 text-right font-semibold text-gray-900 dark:text-white">
                                                    {formatNumber(branch.total_commission)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Current Branch Balances */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Current Branch Balances</h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                        <tr>
                                            <th className="px-6 py-3">Branch Name</th>
                                            <th className="px-6 py-3 text-right">Opening Balance</th>
                                            <th className="px-6 py-3 text-right">Today Commission</th>
                                            <th className="px-6 py-3 text-right">Total Commission</th>
                                            <th className="px-6 py-3 text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {reportData.current_branch_balances.map((branch) => (
                                            <tr key={branch._id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                                    {branch.branch_name}
                                                </td>
                                                <td className={`px-6 py-4 text-right font-semibold ${branch.opening_balance < 0
                                                    ? 'text-red-600 dark:text-red-400'
                                                    : 'text-green-600 dark:text-green-400'
                                                    }`}>
                                                    {formatNumber(branch.opening_balance)}
                                                </td>
                                                <td className="px-6 py-4 text-right text-blue-600 dark:text-blue-400">
                                                    {formatNumber(branch.today_commission)}
                                                </td>
                                                <td className="px-6 py-4 text-right text-green-600 dark:text-green-400 font-semibold">
                                                    {formatNumber(branch.commission)}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${branch.active
                                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                                        }`}>
                                                        {branch.active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Transactions Table */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Transactions ({reportData.transactions.total_count})
                                </h2>
                            </div>
                            <div className="overflow-x-auto max-h-96">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 sticky top-0">
                                        <tr>
                                            <th className="px-6 py-3">Sr No</th>
                                            <th className="px-6 py-3">Sender Branch</th>
                                            <th className="px-6 py-3">Receiver Branch</th>
                                            <th className="px-6 py-3">Sender Name</th>
                                            <th className="px-6 py-3">Receiver Name</th>
                                            <th className="px-6 py-3">Points</th>
                                            <th className="px-6 py-3 text-right">Commission</th>
                                            <th className="px-6 py-3 text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {reportData.transactions.data.map((txn, index) => (
                                            <tr key={txn._id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                <td className="px-6 py-4 text-gray-900 dark:text-white">
                                                    {index + 1}
                                                </td>
                                                <td className="px-6 py-4 text-gray-900 dark:text-white">
                                                    {txn.sender_branch_name || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 text-gray-900 dark:text-white">
                                                    {txn.receiver_branch_name || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                                                    {txn.sender_name}
                                                </td>
                                                <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                                                    {txn.receiver_name}
                                                </td>
                                                <td className="px-6 py-4 font-mono text-gray-900 dark:text-white">
                                                    {txn.points}
                                                </td>
                                                <td className="px-6 py-4 text-right text-green-600 dark:text-green-400 font-semibold">
                                                    {formatNumber(txn.commission)}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${txn.status
                                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                        : txn.admin_permission
                                                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                                        }`}>
                                                        {txn.status ? 'Completed' : txn.admin_permission ? 'Approved' : 'Pending'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
