import { api } from './api';

export const addresses = {
  list() {
    return api.get('/addresses');
  },
  create(payload) {
    return api.post('/addresses', payload);
  },
  update(id, payload) {
    return api.put(`/addresses/${id}`, payload);
  },
  remove(id) {
    return api.del(`/addresses/${id}`);
  },
  setDefault(id) {
    return api.put(`/addresses/${id}/default`, {});
  },
};
