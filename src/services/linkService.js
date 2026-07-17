import { io } from 'socket.io-client';
import { apiClient } from '../api/client';
import { env } from '../config/env';
import { auth } from '../config/firebase';

export const linkService = {
  async healthCheck() {
    const { data } = await apiClient.get('/health');
    return data;
  },

  async create(payload) {
    const { data } = await apiClient.post('/api/v1/urls', payload);
    return data;
  },

  async list() {
    const { data } = await apiClient.get('/api/v1/urls');
    if (Array.isArray(data)) return data;

    const candidates = [
      data?.links,
      data?.urls,
      data?.items,
      data?.data,
      data?.data?.links,
      data?.data?.urls,
      data?.data?.items,
    ];
    const links = candidates.find(Array.isArray);
    if (links) return links;

    throw new Error('A API retornou um formato inválido para a lista de links.');
  },

  async claim(shortCode, token) {
    const { data } = await apiClient.post(`/api/v1/urls/${encodeURIComponent(shortCode)}/claim`, { token });
    return data;
  },

  async resolve(shortCode, previewConfirmed = false, destinationToken = null) {
    const { data } = await apiClient.get(`/api/v1/urls/${encodeURIComponent(shortCode)}`, {
      params: previewConfirmed
        ? { preview: 'confirmed', destination: destinationToken }
        : undefined,
    });
    return data;
  },

  async verifyPassword(shortCode, password, destinationToken) {
    const { data } = await apiClient.post(
      `/api/v1/urls/${encodeURIComponent(shortCode)}/verify`,
      { password, destinationToken },
    );
    return data;
  },

  async getStats(shortCode, token) {
    const { data } = await apiClient.get(`/api/v1/urls/${encodeURIComponent(shortCode)}/stats`, {
      params: { token },
    });
    return data;
  },

  async getAnalytics(shortCode, token) {
    const { data } = await apiClient.get(`/api/v1/urls/${encodeURIComponent(shortCode)}/analytics`, {
      params: { token },
    });
    return data;
  },

  async report(shortCode, reason, turnstileToken) {
    const { data } = await apiClient.post(`/api/v1/urls/${encodeURIComponent(shortCode)}/report`, {
      reason,
      turnstileToken,
    });
    return data;
  },

  async update(shortCode, token, payload) {
    const { data } = await apiClient.put(`/api/v1/urls/${encodeURIComponent(shortCode)}`, payload, {
      params: { token },
    });
    return data;
  },

  async delete(shortCode, token) {
    const { data } = await apiClient.delete(`/api/v1/urls/${encodeURIComponent(shortCode)}`, {
      params: { token },
    });
    return data;
  },

  subscribeToStats(shortCode, token, onUpdate, onError) {
    const socket = io(env.apiUrl, { transports: ['websocket'] });

    socket.on('connect', async () => {
      const userToken = auth.currentUser ? await auth.currentUser.getIdToken() : null;
      socket.emit('subscribeToLinkStats', { shortCode, token, userToken }, (response) => {
        if (!response?.ok) onError?.(response?.error);
      });
    });
    socket.on('linkStatsUpdate', onUpdate);
    socket.on('connect_error', () => onError?.('Conexão em tempo real indisponível.'));

    return () => socket.disconnect();
  },
};
