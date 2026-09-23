import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000',
});

export function extractErrorMessage(error) {
  return error?.response?.data?.error || error?.message || 'Erreur inconnue';
}
