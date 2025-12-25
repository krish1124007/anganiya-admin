// const API_BASE_URL = 'https://angaditya-backend.onrender.com/api/v1';
const API_BASE_URL = 'http://localhost:5000/api/v1';

const getAuthHeaders = () => {
  const token = localStorage.getItem('accesstoken');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

export const api = {
  loginAdmin: async (username, password) => {
    const response = await fetch(`${API_BASE_URL}/admin/login-admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    return response.json();
  },

  getAllTransactions: async (date) => {
    const url = `${API_BASE_URL}/admin/get-all-transactions`;
    const options = {
      headers: getAuthHeaders()
    };

    // If date is provided, send as POST with date in body
    if (date) {
      options.method = 'POST';
      options.body = JSON.stringify({ date });
    }

    const response = await fetch(url, options);
    return response.json();
  },

  getTodayTransactions: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/get-today-transactions`, {
      headers: getAuthHeaders()
    });
    return response.json();
  },

  createBranch: async (branchData) => {
    const response = await fetch(`${API_BASE_URL}/admin/create-branch`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(branchData)
    });
    return response.json();
  },

  updateBranch: async (_id, new_data) => {
    const response = await fetch(`${API_BASE_URL}/admin/update-branch`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ _id, new_data })
    });
    return response.json();
  },

  deleteBranch: async (_id) => {
    const response = await fetch(`${API_BASE_URL}/admin/delete-branch`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ _id })
    });
    return response.json();
  },

  getAllBranches: async (date) => {
    const url = `${API_BASE_URL}/admin/get-all-branches`;
    const options = {
      headers: getAuthHeaders()
    };

    // If date is provided, send as POST with date in body
    if (date) {
      options.method = 'POST';
      options.body = JSON.stringify({ date });
    }

    const response = await fetch(url, options);
    return response.json();
  },

  disableAllBranches: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/disable-all-branch`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return response.json();
  },

  enableAllBranches: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/enable-all-branch`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return response.json();
  },

  disableBranch: async (_id) => {
    const response = await fetch(`${API_BASE_URL}/admin/disable-branch`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ _id })
    });
    return response.json();
  },
  createNewUser: async ({ username, password, branch }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/user/create-user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({ username, password, branch }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ message: "Unknown error" }));
        throw new Error(err.message || "Failed to create user");
      }

      return response.json();
    } catch (error) {
      console.error("Create user failed:", error.message);
      return {
        success: false,
        message: error.message,
      };
    }
  },

  getTransactionBranchWise: async (branch_id) => {
    const response = await fetch(`${API_BASE_URL}/admin/get-transaction-branch-wise`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ branch_id })
    });
    return response.json();
  },
  updateAdmin: async (_id, update_body) => {
    const response = await fetch(`${API_BASE_URL}/admin/update-admin`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ _id, update_body })
    });
    return response.json();
  },
  enableBranch: async (_id) => {
    const response = await fetch(`${API_BASE_URL}/admin/update-branch`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ _id, new_data: { active: true } })
    });
    return response.json();
  },

  giveTransactionPermission: async (transactions_id) => {
    const response = await fetch(`${API_BASE_URL}/admin/give-transaction-permission`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ transactions_id })
    });
    return response.json();
  },

  createRelationship: async (relationshipData) => {
    const response = await fetch(`${API_BASE_URL}/admin/create-relationship`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(relationshipData)
    });
    return response.json();
  },

  getAllUserLogs: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/get-all-user-logs`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return response.json();
  },

  getUsers: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/get-user`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return response.json();
  },

  deleteAllUsers: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/delete-all-user`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return response.json();
  },

  deleteUser: async (user_id) => {
    const response = await fetch(`${API_BASE_URL}/admin/delete-user`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ user_id }),
    });
    return response.json();
  },

  updateUser: async (user_id, update_body) => {
    const response = await fetch(`${API_BASE_URL}/admin/update-user`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ user_id, update_body }),
    });
    return response.json();
  },

  deleteAllTransactions: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/delete-all-transaction`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return response.json();
  },

  getDailyStats: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/daily-stats`, {
      headers: getAuthHeaders()
    });
    return response.json();
  },
};
