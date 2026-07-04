import axios from "axios";

// ✅ Centrální axios instance
// - baseURL z env (trailing slash se odřízne → nikdy nevznikne //api)
// - withCredentials globálně → JWT cookie se posílá automaticky
// - interceptor sjednocuje chybové hlášky (err.message vždy čitelná)
const api = axios.create({
  baseURL: (import.meta.env.VITE_BACKEND_URL || "").replace(/\/$/, ""),
  withCredentials: true,
});

// Normalizace chyb: komponenty se můžou spolehnout na err.message
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const serverMessage = error.response?.data?.message;
    error.message = serverMessage || "Něco se pokazilo. Zkuste to prosím znovu.";
    return Promise.reject(error);
  }
);

export default api;