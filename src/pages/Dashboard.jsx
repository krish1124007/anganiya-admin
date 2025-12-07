import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { ArrowLeftRight, Building2, TrendingUp, Calendar, Bell } from 'lucide-react';

export default function Dashboard() {
  const [todayTransactions, setTodayTransactions] = useState([]);
  const [branches, setBranches] = useState([]);
  const [dailyStats, setDailyStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [transactionsRes, branchesRes, statsRes] = await Promise.all([
        api.getTodayTransactions(),
        api.getAllBranches(),
        api.getDailyStats()
      ]);

      if (transactionsRes.success) {
        setTodayTransactions(transactionsRes.data);
      }
      if (branchesRes.success) {
        setBranches(branchesRes.data);
      }
      if (statsRes.success) {
        setDailyStats(statsRes.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const activeBranches = branches.filter(b => b.active).length;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Welcome back! Here's your overview</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Branches</span>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{branches.length}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{activeBranches} active branches</p>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <ArrowLeftRight className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Today's Transactions</span>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{dailyStats?.total_count || 0}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Last 24 hours</p>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Daily Volume</span>
              </div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                ₹{dailyStats?.total_amount?.toLocaleString() || 0}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{dailyStats?.total_count || 0} Transactions</p>
            </div>
          </div>

          {dailyStats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* User Earnings */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">User Earnings</h3>
                <div className="space-y-3">
                  {dailyStats.user_earnings.map((user, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                      <span className="font-medium text-gray-700 dark:text-gray-300">{user.username}</span>
                      <span className="text-green-600 dark:text-green-400 font-bold">₹{user.earned.toLocaleString()}</span>
                    </div>
                  ))}
                  {dailyStats.user_earnings.length === 0 && <p className="text-gray-500 text-center">No earnings data</p>}
                </div>
              </div>

              {/* Branch Sent Stats */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Branch Sent</h3>
                <div className="space-y-3">
                  {dailyStats.branch_sent_stats.map((branch, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                      <span className="font-medium text-gray-700 dark:text-gray-300">{branch.branch_name}</span>
                      <div className="text-right">
                        <div className="text-sm text-gray-900 dark:text-white font-bold">₹{branch.amount.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">{branch.count} txns</div>
                      </div>
                    </div>
                  ))}
                  {dailyStats.branch_sent_stats.length === 0 && <p className="text-gray-500 text-center">No sent data</p>}
                </div>
              </div>

              {/* Branch Received Stats */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Branch Received</h3>
                <div className="space-y-3">
                  {dailyStats.branch_received_stats.map((branch, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                      <span className="font-medium text-gray-700 dark:text-gray-300">{branch.branch_name}</span>
                      <div className="text-right">
                        <div className="text-sm text-gray-900 dark:text-white font-bold">₹{branch.amount.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">{branch.count} txns</div>
                      </div>
                    </div>
                  ))}
                  {dailyStats.branch_received_stats.length === 0 && <p className="text-gray-500 text-center">No received data</p>}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
              <div className="flex items-center space-x-2 mb-4">
                <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Recent Transactions</h2>
              </div>

              {todayTransactions.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-6">No transactions today</p>
              ) : (
                <div className="space-y-3">
                  {todayTransactions.slice(0, 5).map((transaction) => (
                    <div
                      key={transaction._id}
                      className="p-3 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {transaction.sender_name} → {transaction.receiver_name}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(transaction.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Sender Mobile</p>
                          <p className="text-gray-900 dark:text-white font-medium">{transaction.sender_mobile}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Receiver Mobile</p>
                          <p className="text-gray-900 dark:text-white font-medium">{transaction.receiver_mobile}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
              <div className="flex items-center space-x-2 mb-4">
                <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Notifications</h2>
              </div>
              <div className="space-y-3">
                <p className="text-center text-gray-500 dark:text-gray-400 py-6">No new notifications</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}