import { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, Clock, Smartphone, MapPin, IndianRupee, Shield, User } from 'lucide-react';
import { api } from '../utils/api';
import { decrypt_text, decrypt_number } from '../utils/decrypt';

export default function TransactionDetails({ transactionId, onBack }) {
    const [transaction, setTransaction] = useState(null);
    const [loading, setLoading] = useState(true);
    const [approving, setApproving] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchTransactionDetails();
    }, [transactionId]);

    const fetchTransactionDetails = async () => {
        setLoading(true);
        try {
            // Fetch all transactions and find the one matching the ID
            // This is a fallback since we don't have a direct "get by id" API
            const response = await api.getAllTransactions();
            if (response.success) {
                const found = response.data.find(t => t._id === transactionId);
                if (found) {
                    setTransaction(found);
                } else {
                    setError("Transaction not found");
                }
            } else {
                setError("Failed to fetch transactions");
            }
        } catch (err) {
            setError("Error loading transaction details");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        if (!window.confirm("Are you sure you want to approve this transaction?")) return;

        setApproving(true);
        try {
            const response = await api.giveTransactionPermission(transactionId);
            if (response.success) {
                alert("Transaction approved successfully!");
                fetchTransactionDetails(); // Refresh details
            } else {
                alert(response.message || "Failed to approve transaction");
            }
        } catch (err) {
            console.error("Error approving transaction:", err);
            alert("An error occurred while approving");
        } finally {
            setApproving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[400px]">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error || !transaction) {
        return (
            <div className="p-6">
                <button onClick={onBack} className="flex items-center text-gray-600 hover:text-gray-900 mb-6">
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Back to Dashboard
                </button>
                <div className="p-8 text-center bg-red-50 text-red-600 rounded-lg">
                    {error || "Transaction not found"}
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <button
                onClick={onBack}
                className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
            >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back
            </button>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                            Transaction Details
                            <span className={`ml-3 px-3 py-1 text-xs rounded-full uppercase tracking-wide border ${transaction.status === 'success'
                                ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800'
                                : 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800'
                                }`}>
                                {transaction.status}
                            </span>
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            Created on {new Date(transaction.createdAt).toLocaleString()}
                        </p>
                    </div>

                    {transaction.status !== 'success' && (
                        <button
                            onClick={handleApprove}
                            disabled={approving}
                            className="flex items-center space-x-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {approving ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    <CheckCircle className="w-5 h-5" />
                                    <span>Approve Transaction</span>
                                </>
                            )}
                        </button>
                    )}
                </div>

                {/* Amount */}
                <div className="p-8 text-center border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">Total Amount</p>
                    <div className="text-5xl font-extrabold text-blue-600 dark:text-blue-400 flex items-center justify-center">
                        <IndianRupee className="w-10 h-10 mr-1" />
                        {transaction.amount.toLocaleString()}
                    </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                    {/* Sender */}
                    <div className="p-6 border-r border-b md:border-b-0 border-gray-200 dark:border-gray-700 md:border-r">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                            <User className="w-5 h-5 mr-2 text-blue-500" />
                            Sender Details
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
                                <p className="font-medium text-gray-900 dark:text-white text-lg">{decrypt_text(transaction.sender_name)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Mobile</p>
                                <p className="font-medium text-gray-900 dark:text-white flex items-center">
                                    <Smartphone className="w-4 h-4 mr-1 text-gray-400" />
                                    {decrypt_number(transaction.sender_mobile)}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Branch</p>
                                <p className="font-medium text-gray-900 dark:text-white flex items-center">
                                    <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                                    {transaction.sender_branch_name || "N/A"}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Other From</p>
                                <p className="font-medium text-gray-900 dark:text-white flex items-center">
                                    {transaction.other_sender || "N/A"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Receiver */}
                    <div className="p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                            <User className="w-5 h-5 mr-2 text-green-500" />
                            Receiver Details
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
                                <p className="font-medium text-gray-900 dark:text-white text-lg">{decrypt_text(transaction.receiver_name)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Mobile</p>
                                <p className="font-medium text-gray-900 dark:text-white flex items-center">
                                    <Smartphone className="w-4 h-4 mr-1 text-gray-400" />
                                    {decrypt_number(transaction.receiver_mobile)}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Branch</p>
                                <p className="font-medium text-gray-900 dark:text-white flex items-center">
                                    <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                                    {transaction.receiver_branch_name || "N/A"}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Other To</p>
                                <p className="font-medium text-gray-900 dark:text-white flex items-center">
                                    {transaction.other_receiver || "N/A"}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Security / System Info */}
                <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                        <Shield className="w-4 h-4 mr-2" />
                        System Information
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                        <div>
                            <p className="text-gray-500 dark:text-gray-400">Transaction ID</p>
                            <p className="font-mono text-gray-700 dark:text-gray-300 break-all">{transaction._id}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 dark:text-gray-400">Last Updated</p>
                            <p className="text-gray-700 dark:text-gray-300">{new Date(transaction.updatedAt).toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
