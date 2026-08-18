// API configuration
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';


// Other global configuration settings can be added here
export const APP_NAME = 'Jewelry Management System';
export const APP_VERSION = '1.0.0';

// Configuration for image uploads
export const IMAGE_UPLOAD_CONFIG = {
  maxSize: 5 * 1024 * 1024, // 5MB
  acceptedFormats: ['image/jpeg', 'image/png', 'image/webp']
};

// Default pagination settings
export const PAGINATION_DEFAULT = {
  itemsPerPage: 10,
  pageOptions: [5, 10, 25, 50]
}; 