import axios from 'axios';

// ⚠️ IMPORTANT:
// - NO hardcoded http://localhost:8081
// - Proxy will handle backend
const api = axios.create({
  baseURL: '/api',
});

// Attach JWT token if exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ================= AUTH =================
export const authService = {
  login: (username, password) =>
    api.post('/auth/login', { username, password }),

  signup: (username, email, password, fullName, roles) =>
    api.post('/auth/signup', { username, email, password, fullName, roles }),
};

// ================= COMPLAINTS =================
export const complaintService = {
  // ✅ Anonymous complaint (NO token, FormData)
  createAnonymousComplaint: (formData) =>
    api.post('/complaints/submit/anonymous', formData),

  // Authenticated complaint
  createComplaint: (formData) =>
    api.post('/complaints/submit', formData),

  assignComplaint: (id, assignRequest) =>
    api.put(`/complaints/assign/${id}`, assignRequest),

  unassignComplaint: (id) =>
    api.put(`/complaints/unassign/${id}`),

  updateDeadline: (id, deadlineRequest) =>
    api.put(`/complaints/deadline/${id}`, deadlineRequest),

  markCompleted: (id) =>
    api.put(`/complaints/complete/${id}`),

  markResolved: (id) =>
    api.put(`/complaints/resolve/${id}`),

  editComplaint: (id, updateRequest) =>
    api.put(`/complaints/edit/${id}`, updateRequest),

  updateComplaintStatus: (id, status) =>
    api.put(`/complaints/status/${id}`, { status }),

  getMyComplaints: () =>
    api.get('/complaints/my'),

  getAssignedComplaints: () =>
    api.get('/complaints/assigned'),

  getAllComplaints: () =>
    api.get('/complaints/admin/all'),

  getComplaintById: (id) =>
    api.get(`/complaints/${id}`),

  getComplaintTimeline: (id, includeInternal = false) =>
    api.get(`/complaints/${id}/timeline?includeInternal=${includeInternal}`),
};

// ================= NOTIFICATIONS =================
export const notificationService = {
  getUserNotifications: (page = 0, size = 10) =>
    api.get(`/notifications?page=${page}&size=${size}`),

  getUnreadNotifications: () =>
    api.get('/notifications/unread'),

  markAsRead: (id) =>
    api.put(`/notifications/${id}/read`),
};

// ================= REPORTS =================
export const reportService = {
  getDashboardStats: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return api.get(`/reports/dashboard?${q}`);
  },

  exportCSV: (params = {}) =>
    api.get(`/reports/export/csv?${new URLSearchParams(params)}`, {
      responseType: 'blob',
    }),

  exportPDF: (params = {}) =>
    api.get(`/reports/export/pdf?${new URLSearchParams(params)}`, {
      responseType: 'blob',
    }),
};

export default api;
