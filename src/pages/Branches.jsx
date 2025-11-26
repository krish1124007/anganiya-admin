import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { Plus, Edit2, Trash2, Power, PowerOff, Save, X } from 'lucide-react';

export default function Branches() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [formData, setFormData] = useState({
    branch_name: '',
    location: '',
    commision: ''
  });

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    setLoading(true);
    try {
      const response = await api.getAllBranches();
      if (response.success) {
        setBranches(response.data);
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const response = await api.createBranch({
        branch_name: formData.branch_name,
        location: formData.location,
        commision: parseFloat(formData.commision)
      });
      if (response.success) {
        setShowCreateModal(false);
        setFormData({ branch_name: '', location: '', commision: '' });
        fetchBranches();
      }
    } catch (error) {
      console.error('Error creating branch:', error);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const response = await api.updateBranch(editingBranch._id, {
        branch_name: formData.branch_name,
        location: formData.location,
        commision: parseFloat(formData.commision)
      });
      if (response.success) {
        setEditingBranch(null);
        setFormData({ branch_name: '', location: '', commision: '' });
        fetchBranches();
      }
    } catch (error) {
      console.error('Error updating branch:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this branch?')) {
      try {
        const response = await api.deleteBranch(id);
        if (response.success) {
          fetchBranches();
        }
      } catch (error) {
        console.error('Error deleting branch:', error);
      }
    }
  };

  const handleDisableBranch = async (id) => {
    try {
      const response = await api.disableBranch(id);
      if (response.success) {
        fetchBranches();
      }
    } catch (error) {
      console.error('Error disabling branch:', error);
    }
  };

  const handleDisableAll = async () => {
    if (window.confirm('Are you sure you want to disable all branches?')) {
      try {
        const response = await api.disableAllBranches();
        if (response.success) {
          fetchBranches();
        }
      } catch (error) {
        console.error('Error disabling all branches:', error);
      }
    }
  };

  const handleEnableAll = async () => {
    try {
      const response = await api.enableAllBranches();
      if (response.success) {
        fetchBranches();
      }
    } catch (error) {
      console.error('Error enabling all branches:', error);
    }
  };

  const startEdit = (branch) => {
    setEditingBranch(branch);
    setFormData({
      branch_name: branch.branch_name,
      location: branch.location,
      commision: branch.commision.toString()
    });
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Branch Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage all branch locations and settings</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleDisableAll}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg flex items-center space-x-2 transition-colors"
          >
            <PowerOff className="w-4 h-4" />
            <span>Disable All</span>
          </button>
          <button
            onClick={handleEnableAll}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Power className="w-4 h-4" />
            <span>Enable All</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg flex items-center space-x-2 transition-colors shadow-lg"
          >
            <Plus className="w-4 h-4" />
            <span>Create Branch</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {branches.map((branch) => (
            <div
              key={branch._id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                    {branch.branch_name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{branch.location}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    branch.active
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                  }`}
                >
                  {branch.active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Commission</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{branch.commision}%</p>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => startEdit(branch)}
                  className="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center justify-center space-x-1 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDisableBranch(branch._id)}
                  className="flex-1 px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg flex items-center justify-center space-x-1 transition-colors"
                >
                  <PowerOff className="w-4 h-4" />
                  <span>Disable</span>
                </button>
                <button
                  onClick={() => handleDelete(branch._id)}
                  className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {(showCreateModal || editingBranch) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {editingBranch ? 'Edit Branch' : 'Create Branch'}
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingBranch(null);
                  setFormData({ branch_name: '', location: '', commision: '' });
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={editingBranch ? handleUpdate : handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Branch Name
                </label>
                <input
                  type="text"
                  value={formData.branch_name}
                  onChange={(e) => setFormData({ ...formData, branch_name: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Commission (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.commision}
                  onChange={(e) => setFormData({ ...formData, commision: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg"
              >
                <Save className="w-5 h-5" />
                <span>{editingBranch ? 'Update Branch' : 'Create Branch'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
