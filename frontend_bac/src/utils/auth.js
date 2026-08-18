// API base URL
const API_URL = 'http://localhost:5000';

// Helper function to make authenticated API requests
export const authenticatedFetch = async (endpoint, options = {}) => {
    const defaultOptions = {
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
    };

    try {
        // First check if session is valid
        const sessionCheck = await fetch(`${API_URL}/check_session`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const sessionData = await sessionCheck.json();
        console.log('Session check response:', sessionData);  // Debug log

        if (!sessionCheck.ok || !sessionData.authenticated) {
            console.log('Session invalid, clearing storage');  // Debug log
            localStorage.removeItem('user');
            throw new Error('Session expired. Please log in again.');
        }

        // If session is valid, proceed with the original request
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...defaultOptions,
            ...options,
            credentials: 'include',
            headers: {
                ...defaultOptions.headers,
                ...options.headers,
            },
        });

        if (!response.ok) {
            if (response.status === 401) {
                console.log('401 response, clearing storage');  // Debug log
                localStorage.removeItem('user');
                throw new Error('Session expired. Please log in again.');
            }
            throw new Error(`Request failed with status ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('API request error:', error);
        throw error;
    }
};

// Login function
export const login = async (username, password) => {
    try {
        console.log('Attempting login...');  // Debug log
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();
        console.log('Login response:', data);  // Debug log
        
        if (!response.ok) {
            throw new Error(data.error || 'Login failed');
        }

        // Store user info in localStorage
        localStorage.setItem('user', JSON.stringify(data.user));

        // Verify session after login
        const sessionCheck = await fetch(`${API_URL}/check_session`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const sessionData = await sessionCheck.json();
        console.log('Session verification response:', sessionData);  // Debug log

        if (!sessionCheck.ok || !sessionData.authenticated) {
            console.log('Session verification failed, clearing storage');  // Debug log
            localStorage.removeItem('user');
            throw new Error('Session verification failed. Please try logging in again.');
        }

        return data;
    } catch (error) {
        console.error('Login error:', error);
        localStorage.removeItem('user');
        throw error;
    }
};

// Logout function
export const logout = async () => {
    try {
        await fetch(`${API_URL}/logout`, {
            method: 'POST',
            credentials: 'include',
        });
        // Clear local storage
        localStorage.removeItem('user');
    } catch (error) {
        console.error('Logout error:', error);
        localStorage.removeItem('user');
        throw error;
    }
};

// Check if user is authenticated
export const isAuthenticated = () => {
    const user = localStorage.getItem('user');
    return user !== null;
};

// Get current user
export const getCurrentUser = () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
};

// Get users function
export const getUsers = async () => {
    try {
        return await authenticatedFetch('/get_users');
    } catch (error) {
        console.error('Get users error:', error);
        throw error;
    }
};

// Add user function
export const addUser = async (userData) => {
    try {
        return await authenticatedFetch('/add_user', {
            method: 'POST',
            body: JSON.stringify(userData),
        });
    } catch (error) {
        console.error('Add user error:', error);
        throw error;
    }
};

// Get order history
export const getOrderHistory = async () => {
    try {
        return await authenticatedFetch('/get_order_history');
    } catch (error) {
        console.error('Get order history error:', error);
        throw error;
    }
}; 