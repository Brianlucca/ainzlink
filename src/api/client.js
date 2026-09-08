import axios from 'axios';
import { env } from '../config/env';
import { auth } from '../config/firebase';

export const apiClient = axios.create({
  baseURL: env.apiUrl,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const RETRYABLE_METHODS = new Set(['get', 'head', 'options']);
const RETRYABLE_STATUS_CODES = new Set([408, 425, 502, 503, 504]);
const RETRY_DELAYS = [1500, 3000, 6000, 10000, 15000];
const MAX_RECOVERY_TIME = 90000;

const wait = (milliseconds) => new Promise((resolve) => {
  setTimeout(resolve, milliseconds);
});

const isTemporaryServerFailure = (error) => {
  if (error.code === 'ERR_CANCELED') return false;
  if (!error.response) return true;
  return RETRYABLE_STATUS_CODES.has(error.response.status);
};

apiClient.interceptors.request.use(async (config) => {
  config.apiRecoveryStartedAt ??= Date.now();
  if (auth.currentUser) {
    config.headers.Authorization = `Bearer ${await auth.currentUser.getIdToken()}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    const method = config?.method?.toLowerCase();
    const retryCount = config?.apiRetryCount || 0;
    const recoveryStartedAt = config?.apiRecoveryStartedAt || Date.now();
    const canRetry = config
      && RETRYABLE_METHODS.has(method)
      && isTemporaryServerFailure(error)
      && retryCount < RETRY_DELAYS.length
      && Date.now() - recoveryStartedAt < MAX_RECOVERY_TIME;

    if (!canRetry) return Promise.reject(error);

    await wait(RETRY_DELAYS[retryCount]);
    config.apiRetryCount = retryCount + 1;
    return apiClient.request(config);
  },
);

export const getApiError = (error, fallback = 'Não foi possível concluir a operação.') => {
  if (error.code === 'ECONNABORTED') {
    return 'O servidor demorou demais para responder.';
  }
  if (!error.response) {
    return 'Não foi possível conectar ao servidor. Tente novamente em instantes.';
  }
  return error.response.data?.error || fallback;
};
