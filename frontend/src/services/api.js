const API_BASE_URL = 'http://localhost:8000/api/v1';

const getHeaders = () => {
  const token = localStorage.getItem('access_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
};

const handleResponse = async (response) => {
  if (response.status === 401) {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
    throw new Error(error.detail || 'Request failed');
  }
  return response.json();
};

export const suppliersAPI = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/suppliers`, { headers: getHeaders() });
    return handleResponse(response);
  },
  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/suppliers/${id}`, { headers: getHeaders() });
    return handleResponse(response);
  },
  create: async (data) => {
    const response = await fetch(`${API_BASE_URL}/suppliers/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },
  update: async (id, data) => {
    const response = await fetch(`${API_BASE_URL}/suppliers/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },
  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/suppliers/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse(response);
  }
};

export const productsAPI = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/products`, { headers: getHeaders() });
    return handleResponse(response);
  },
  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, { headers: getHeaders() });
    return handleResponse(response);
  },
  create: async (data) => {
    const response = await fetch(`${API_BASE_URL}/products/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },
  update: async (id, data) => {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },
  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse(response);
  }
};

export const salesAPI = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/sales`, { headers: getHeaders() });
    return handleResponse(response);
  },
  getStats: async () => {
    const response = await fetch(`${API_BASE_URL}/sales/stats`, { headers: getHeaders() });
    return handleResponse(response);
  },
  create: async (data) => {
    const response = await fetch(`${API_BASE_URL}/sales/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  }
};

export const usersAPI = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/users`, { headers: getHeaders() });
    return handleResponse(response);
  },
  create: async (data) => {
    const response = await fetch(`${API_BASE_URL}/auth/users`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },
  update: async (id, data) => {
    const response = await fetch(`${API_BASE_URL}/auth/users/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },
  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/auth/users/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse(response);
  }
};

export const forecastAPI = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/forecasting`, { headers: getHeaders() });
    return handleResponse(response);
  },
};

export const alertsAPI = {
  getAll: async (status = 'active') => {
    const response = await fetch(`${API_BASE_URL}/alerts?status=${status}`, { headers: getHeaders() });
    return handleResponse(response);
  },
  getUnread: async () => {
    const response = await fetch(`${API_BASE_URL}/alerts/unread`, { headers: getHeaders() });
    return handleResponse(response);
  },
  markRead: async (id) => {
    const response = await fetch(`${API_BASE_URL}/alerts/${id}/read`, {
      method: 'PUT',
      headers: getHeaders()
    });
    return handleResponse(response);
  },
  markAllRead: async () => {
    const response = await fetch(`${API_BASE_URL}/alerts/read-all`, {
      method: 'PUT',
      headers: getHeaders()
    });
    return handleResponse(response);
  },
  archive: async (id) => {
    const response = await fetch(`${API_BASE_URL}/alerts/${id}/archive`, {
      method: 'PUT',
      headers: getHeaders()
    });
    return handleResponse(response);
  }
};

export const notificationsAPI = {
  getAll: async (status = 'unread', department = '') => {
    const url = new URL(`${API_BASE_URL}/notifications`);
    if (status) url.searchParams.append('status', status);
    if (department) url.searchParams.append('department', department);
    const response = await fetch(url.toString(), { headers: getHeaders() });
    return handleResponse(response);
  },
  getUnread: async () => {
    const response = await fetch(`${API_BASE_URL}/notifications/unread`, { headers: getHeaders() });
    return handleResponse(response);
  },
  markRead: async (id) => {
    const response = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
      method: 'PUT',
      headers: getHeaders()
    });
    return handleResponse(response);
  },
  markAllRead: async () => {
    const response = await fetch(`${API_BASE_URL}/notifications/read-all`, {
      method: 'PUT',
      headers: getHeaders()
    });
    return handleResponse(response);
  },
  archive: async (id) => {
    const response = await fetch(`${API_BASE_URL}/notifications/${id}/archive`, {
      method: 'PUT',
      headers: getHeaders()
    });
    return handleResponse(response);
  },
  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/notifications/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse(response);
  }
};

export const authAPI = {
  getSignupRequests: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/signup-requests`, { headers: getHeaders() });
    return handleResponse(response);
  },
  createSignupRequest: async (data) => {
    const response = await fetch(`${API_BASE_URL}/auth/signup-requests`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },
  approveSignupRequest: async (id) => {
    const response = await fetch(`${API_BASE_URL}/auth/signup-requests/${id}/approve`, {
      method: 'POST',
      headers: getHeaders()
    });
    return handleResponse(response);
  },
  rejectSignupRequest: async (id) => {
    const response = await fetch(`${API_BASE_URL}/auth/signup-requests/${id}/reject`, {
      method: 'POST',
      headers: getHeaders()
    });
    return handleResponse(response);
  },
  changePassword: async (data) => {
    const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  }
};

export const inventoryAPI = {
  getStatus: async () => {
    const response = await fetch(`${API_BASE_URL}/inventory/status`, { headers: getHeaders() });
    return handleResponse(response);
  },
  getLowStock: async () => {
    const response = await fetch(`${API_BASE_URL}/inventory/low-stock`, { headers: getHeaders() });
    return handleResponse(response);
  },
  getTransactions: async () => {
    const response = await fetch(`${API_BASE_URL}/inventory/transactions`, { headers: getHeaders() });
    return handleResponse(response);
  },
  createTransaction: async (data) => {
    const response = await fetch(`${API_BASE_URL}/inventory/transactions`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  }
};

export const dashboardAPI = {
  getAdminData: async () => {
    const response = await fetch(`${API_BASE_URL}/dashboard/admin`, { headers: getHeaders() });
    return handleResponse(response);
  },
  getHodData: async () => {
    const response = await fetch(`${API_BASE_URL}/dashboard/hod`, { headers: getHeaders() });
    return handleResponse(response);
  },
  getManagerData: async () => {
    const response = await fetch(`${API_BASE_URL}/dashboard/manager`, { headers: getHeaders() });
    return handleResponse(response);
  },
  getEmployeeData: async () => {
    const response = await fetch(`${API_BASE_URL}/dashboard/employee`, { headers: getHeaders() });
    return handleResponse(response);
  },
};

export const rebalancingAPI = {
  getStates: async () => {
    const response = await fetch(`${API_BASE_URL}/rebalancing/states`, { headers: getHeaders() });
    return handleResponse(response);
  },
  createState: async (data) => {
    const response = await fetch(`${API_BASE_URL}/rebalancing/states`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },
  deleteState: async (id) => {
    const response = await fetch(`${API_BASE_URL}/rebalancing/states/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse(response);
  },
  getDepots: async () => {
    const response = await fetch(`${API_BASE_URL}/rebalancing/depots`, { headers: getHeaders() });
    return handleResponse(response);
  },
  createDepot: async (data) => {
    const response = await fetch(`${API_BASE_URL}/rebalancing/depots`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },
  deleteDepot: async (id) => {
    const response = await fetch(`${API_BASE_URL}/rebalancing/depots/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse(response);
  },
  getDepotInventory: async (depotId) => {
    const response = await fetch(`${API_BASE_URL}/rebalancing/depots/${depotId}/inventory`, { headers: getHeaders() });
    return handleResponse(response);
  },
  updateDepotInventory: async (depotId, productId, data) => {
    const response = await fetch(`${API_BASE_URL}/rebalancing/depots/${depotId}/inventory/${productId}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },
  getDistances: async () => {
    const response = await fetch(`${API_BASE_URL}/rebalancing/distances`, { headers: getHeaders() });
    return handleResponse(response);
  },
  createDistance: async (data) => {
    const response = await fetch(`${API_BASE_URL}/rebalancing/distances`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },
  calculate: async () => {
    const response = await fetch(`${API_BASE_URL}/rebalancing/calculate`, {
      method: 'POST',
      headers: getHeaders()
    });
    return handleResponse(response);
  },
  getSurplusDeficit: async () => {
    const response = await fetch(`${API_BASE_URL}/rebalancing/surplus-deficit`, { headers: getHeaders() });
    return handleResponse(response);
  },
  getSummary: async () => {
    const response = await fetch(`${API_BASE_URL}/rebalancing/summary`, { headers: getHeaders() });
    return handleResponse(response);
  },
  getTransfers: async () => {
    const response = await fetch(`${API_BASE_URL}/rebalancing/transfers`, { headers: getHeaders() });
    return handleResponse(response);
  },
  approveTransfer: async (id) => {
    const response = await fetch(`${API_BASE_URL}/rebalancing/transfers/${id}/approve`, {
      method: 'POST',
      headers: getHeaders()
    });
    return handleResponse(response);
  },
  rejectTransfer: async (id) => {
    const response = await fetch(`${API_BASE_URL}/rebalancing/transfers/${id}/reject`, {
      method: 'POST',
      headers: getHeaders()
    });
    return handleResponse(response);
  },
  getProduction: async () => {
    const response = await fetch(`${API_BASE_URL}/rebalancing/production`, { headers: getHeaders() });
    return handleResponse(response);
  },
  approveProduction: async (id) => {
    const response = await fetch(`${API_BASE_URL}/rebalancing/production/${id}/approve`, {
      method: 'POST',
      headers: getHeaders()
    });
    return handleResponse(response);
  },
  rejectProduction: async (id) => {
    const response = await fetch(`${API_BASE_URL}/rebalancing/production/${id}/reject`, {
      method: 'POST',
      headers: getHeaders()
    });
    return handleResponse(response);
  }
};
