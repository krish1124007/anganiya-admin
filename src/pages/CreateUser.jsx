import { useState, useEffect } from "react";
import { api } from "../utils/api";
import { UserPlus, Building2 } from "lucide-react";

export default function CreateUser() {
  const [branches, setBranches] = useState([]);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    branch_name: "",
    branch_id: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      const response = await api.getAllBranches();
      if (response.success) {
        setBranches(response.data);
      }
    } catch (error) {
      console.error("Error fetching branches:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const payload = {
        username: formData.username,
        password: formData.password,
        branch: formData.branch_id, // send branch ID always
      };

      const response = await api.createNewUser(payload);

      if (response.success) {
        setMessage({ type: "success", text: "User created successfully!" });
        setFormData({
          username: "",
          password: "",
          branch_name: "",
          branch_id: "",
        });
      } else {
        setMessage({ type: "error", text: response.message || "Something went wrong." });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "Error creating user. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create User</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Add a new user to the system
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <div className="flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-6 mx-auto">
            <UserPlus className="w-8 h-8 text-white" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Username
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                required
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg
                focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Enter username"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg
                focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Enter password"
              />
            </div>

            {/* Branch Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Branch
              </label>

              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />

                <select
                  value={formData.branch_id}
                  onChange={(e) => {
                    const id = e.target.value;
                    const selectedBranch = branches.find(b => b._id === id);

                    setFormData({
                      ...formData,
                      branch_id: id,
                      branch_name: selectedBranch?.branch_name || ""
                    });
                  }}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white appearance-none cursor-pointer"
                >
                  <option value="">Select a branch</option>

                  {branches.map((branch) => (
                    <option key={branch._id} value={branch._id}>
                      {branch.branch_name} - {branch.location}
                    </option>
                  ))}
                </select>

              </div>

              {branches.length === 0 && (
                <p className="mt-2 text-sm text-orange-600 dark:text-orange-400">
                  No active branches available. Please create and activate a branch first.
                </p>
              )}
            </div>

            {/* Success / Error Message */}
            {message.text && (
              <div
                className={`p-4 rounded-lg border ${
                  message.type === "success"
                    ? "bg-green-50 dark:bg-green-900 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400"
                    : "bg-red-50 dark:bg-red-900 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400"
                }`}
              >
                {message.text}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || branches.length === 0}
              className="w-full bg-blue-600 hover:bg-blue-700
              text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200
              flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  <span>Create User</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}