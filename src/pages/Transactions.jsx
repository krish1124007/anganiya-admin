import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { ArrowLeftRight, Calendar, Search } from 'lucide-react';
import { decrypt_number, decrypt_text } from "../utils/decrypt";

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchTransactions();
  }, [filter]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = transactions.filter(t =>
        t.sender_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.receiver_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.sender_mobile.includes(searchTerm) ||
        t.receiver_mobile.includes(searchTerm)
      );
      setFilteredTransactions(filtered);
    } else {
      setFilteredTransactions(transactions);
    }
  }, [searchTerm, transactions]);

 const fetchTransactions = async () => {
  setLoading(true);
  try {
    const response =
      filter === "today"
        ? await api.getTodayTransactions()
        : await api.getAllTransactions();

    if (response.success) {
      // decrypt all data before setting state
      const decrypted = response.data.map((t) => ({
        ...t,
        sender_name: decrypt_text(t.sender_name),
        receiver_name: decrypt_text(t.receiver_name),
        sender_mobile: decrypt_number(t.sender_mobile),
        receiver_mobile: decrypt_number(t.receiver_mobile),
        points: decrypt_number(t.points),
      }));

      setTransactions(decrypted);
      setFilteredTransactions(decrypted);
    }
  } catch (error) {
    console.error("Error fetching transactions:", error);
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Transactions</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">View and manage all transactions</p>
      </div>

      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or mobile..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-3 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-500 text-white'
                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
            }`}
          >
            All Time
          </button>
          <button
            onClick={() => setFilter('today')}
            className={`px-4 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
              filter === 'today'
                ? 'bg-blue-500 text-white'
                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Today</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {filteredTransactions.length === 0 ? (
            <div className="p-12 text-center">
              <ArrowLeftRight className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No transactions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Sender
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Receiver
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Points
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Date & Time
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredTransactions.map((transaction) => (
                    <tr key={transaction._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {transaction.sender_name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {transaction.sender_mobile}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {transaction.receiver_name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {transaction.receiver_mobile}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                          {transaction.points}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(transaction.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
