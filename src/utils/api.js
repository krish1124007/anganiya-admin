const API_BASE_URL = 'https://angaditya-backend.onrender.com/api/v1';

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

  getAllTransactions: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/get-all-transactions`, {
      headers: getAuthHeaders()
    });
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

  getAllBranches: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/get-all-branches`, {
      headers: getAuthHeaders()
    });
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
}

};
