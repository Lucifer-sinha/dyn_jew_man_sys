import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Configure axios defaults
axios.defaults.withCredentials = true;

const api = {
    // Auth
    login: async (credentials) => {
        const response = await axios.post(`${API_URL}/login`, credentials);
        return response.data;
    },

    logout: async () => {
        const response = await axios.get(`${API_URL}/logout`);
        return response.data;
    },

    // Shop Settings
    getShopSettings: async () => {
        const response = await axios.get(`${API_URL}/settings/general`);
        return response.data;
    },

    saveShopSettings: async (settings) => {
        const response = await axios.post(`${API_URL}/settings/general`, settings);
        return response.data;
    },

    // Items
    getItems: async () => {
        const response = await axios.get(`${API_URL}/items`);
        return response.data;
    },

    createItem: async (item) => {
        const response = await axios.post(`${API_URL}/items`, item);
        return response.data;
    },

    // Categories
    getCategories: async () => {
        const response = await axios.get(`${API_URL}/categories`);
        return response.data;
    },

    // Orders
    getOrders: async () => {
        const response = await axios.get(`${API_URL}/orders`);
        return response.data;
    },

    createOrder: async (order) => {
        const response = await axios.post(`${API_URL}/orders`, order);
        return response.data;
    },

    // Customers
    getCustomers: async () => {
        const response = await axios.get(`${API_URL}/customers`);
        return response.data;
    },

    createCustomer: async (customer) => {
        const response = await axios.post(`${API_URL}/customers`, customer);
        return response.data;
    },

    // Integration Settings
    getIntegrationSettings: async () => {
        const response = await axios.get(`${API_URL}/integrations`);
        return response.data;
    },

    saveIntegrationSettings: async (settings) => {
        const response = await axios.post(`${API_URL}/integrations`, settings);
        return response.data;
    },

    // Notification Settings
    getNotificationSettings: async () => {
        const response = await axios.get(`${API_URL}/notifications/settings`);
        return response.data;
    },

    saveNotificationSettings: async (settings) => {
        const response = await axios.post(`${API_URL}/notifications/settings`, settings);
        return response.data;
    }
};

export default api; 