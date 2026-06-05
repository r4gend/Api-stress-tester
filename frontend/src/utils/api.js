import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

// ─── In-memory access token store ───────────────────────────────────────────
// Token NEVER touches localStorage/sessionStorage — XSS-injected scripts
// have nothing to read. Lives only inside the module's closure.
let accessToken = null;
let onAuthCleared = null;

export function setAccessToken(token) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

export function setOnAuthCleared(cb) {
  onAuthCleared = cb;
}

// ─── Axios instance ─────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // send refresh cookie on /auth/* requests
});

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

// ─── Refresh-on-401 with single-flight ──────────────────────────────────────
// If multiple parallel requests get 401 at the same time, we only fire
// ONE /auth/refresh call and let everyone else await its outcome.
let refreshPromise = null;

async function refreshAccessToken() {
  if (refreshPromise) return refreshPromise;
  refreshPromise = axios
    .post(`${API_BASE}/auth/refresh`, null, { withCredentials: true })
    .then((r) => {
      accessToken = r.data.access_token;
      return r.data;
    })
    .catch((err) => {
      accessToken = null;
      if (onAuthCleared) onAuthCleared();
      throw err;
    })
    .finally(() => {
      refreshPromise = null;
    });
  return refreshPromise;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const path = window.location.pathname;
    const isAuthPath = path.startsWith('/login') || path.startsWith('/register');

    // 401 on a non-refresh request → try refresh, then retry once
    if (
      error.response?.status === 401 &&
      !original?._retry &&
      !original?.url?.includes('/auth/refresh') &&
      !original?.url?.includes('/auth/login')
    ) {
      original._retry = true;
      try {
        await refreshAccessToken();
        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      } catch {
        if (!isAuthPath) window.location.href = '/login';
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

// ─── Auth ───────────────────────────────────────────────────────────────────
export const loginUser = (data) =>
  api.post('/auth/login', data).then((r) => {
    accessToken = r.data.access_token;
    return r.data;
  });

export const registerUser = (data) =>
  api.post('/auth/register', data).then((r) => {
    accessToken = r.data.access_token;
    return r.data;
  });

export const refreshSession = () => refreshAccessToken();

export const logoutUser = () =>
  api.post('/auth/logout').finally(() => {
    accessToken = null;
  });

export const fetchMe = () => api.get('/auth/me').then((r) => r.data);

// ─── Tests ──────────────────────────────────────────────────────────────────
export const fetchSummary = () => api.get('/tests/summary').then((r) => r.data);

export const fetchTests = (params = {}) =>
  api.get('/tests/', { params }).then((r) => r.data);

export const fetchTest = (id) => api.get(`/tests/${id}`).then((r) => r.data);

export const createTest = (data) => api.post('/tests/', data).then((r) => r.data);

export const updateTest = (id, data) =>
  api.put(`/tests/${id}`, data).then((r) => r.data);

export const deleteTest = (id) => api.delete(`/tests/${id}`);

// ─── Execution ──────────────────────────────────────────────────────────────
export const runTest = (id) => api.post(`/tests/${id}/run`).then((r) => r.data);

export const cancelTest = (id) =>
  api.post(`/tests/${id}/cancel`).then((r) => r.data);

// ─── Results ────────────────────────────────────────────────────────────────
export const fetchResults = (id, params = {}) =>
  api.get(`/tests/${id}/results`, { params }).then((r) => r.data);

export const fetchTimeline = (id) =>
  api.get(`/tests/${id}/timeline`).then((r) => r.data);

export const fetchProgress = (id) =>
  api.get(`/tests/${id}/progress`).then((r) => r.data);

export default api;
