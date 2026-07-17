import axios from 'axios';
import { env } from '../config/env';
import { auth } from '../config/firebase';

export const apiClient = axios.create({
  baseURL: env.apiUrl,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(async (config) => {
  if (auth.currentUser) {
    config.headers.Authorization = `Bearer ${await auth.currentUser.getIdToken()}`;
  }
  return config;
});

export const getApiError = (error, fallback = 'Não foi possível concluir a operação.') => {
  if (error.code === 'ECONNABORTED') {
    return 'O servidor demorou demais para responder.';
  }
  if (!error.response) {
    return 'Não foi possível conectar ao servidor local.';
  }
  return error.response.data?.error || fallback;
};
