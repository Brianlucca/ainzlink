import { apiClient } from '../api/client';

export const userService = {
  async initializeSession() {
    const { data } = await apiClient.post('/api/v1/users/session');
    return data;
  },

  async getNotificationSettings() {
    const { data } = await apiClient.get('/api/v1/users/notifications');
    return data;
  },

  async updateEmailPreferences(emailPreferences) {
    const { data } = await apiClient.put('/api/v1/users/notifications', { emailPreferences });
    return data.emailPreferences;
  },

  async sendWeeklySummaryNow() {
    const { data } = await apiClient.post('/api/v1/users/notifications/weekly-summary');
    return data;
  },

  async deleteAccount() {
    const { data } = await apiClient.delete('/api/v1/users/me');
    return data;
  },
};
