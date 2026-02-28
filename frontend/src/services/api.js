const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Helper to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

// Auth API
export const authAPI = {
  // Register new user
  register: async (name, email, password) => {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Registration failed');
    }
    return data;
  },

  // Login user
  login: async (email, password) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }
    return data;
  },

  // Get current user
  getMe: async () => {
    const response = await fetch(`${API_URL}/auth/me`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to get user');
    }
    return data;
  }
};

// User API
export const userAPI = {
  // Update profile
  updateProfile: async (profileData) => {
    const response = await fetch(`${API_URL}/users/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(profileData)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to update profile');
    }
    return data;
  },

  // Get user by ID
  getUser: async (userId) => {
    const response = await fetch(`${API_URL}/users/${userId}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to get user');
    }
    return data;
  }
};

// Health check
export const healthCheck = async () => {
  try {
    const response = await fetch(`${API_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
};

// Courses API
export const coursesAPI = {
  // Get all available courses
  getAll: async () => {
    const response = await fetch(`${API_URL}/courses`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to get courses');
    }
    return data;
  },

  // Get user's enrolled courses
  getEnrolled: async () => {
    const response = await fetch(`${API_URL}/courses/enrolled`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to get enrolled courses');
    }
    return data;
  },

  // Get single course
  getById: async (courseId) => {
    const response = await fetch(`${API_URL}/courses/${courseId}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to get course');
    }
    return data;
  },

  // Enroll in a course
  enroll: async (courseId) => {
    const response = await fetch(`${API_URL}/courses/${courseId}/enroll`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to enroll');
    }
    return data;
  },

  // Update course progress
  updateProgress: async (courseId, progressData) => {
    const response = await fetch(`${API_URL}/courses/${courseId}/progress`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(progressData)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to update progress');
    }
    return data;
  },

  // Unenroll from a course
  unenroll: async (courseId) => {
    const response = await fetch(`${API_URL}/courses/${courseId}/unenroll`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to unenroll');
    }
    return data;
  }
};

// Schedule API
export const scheduleAPI = {
  // Get all events
  getAll: async (startDate, endDate) => {
    let url = `${API_URL}/schedule`;
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (params.toString()) url += `?${params.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to get schedule');
    }
    return data;
  },

  // Get today's events
  getToday: async () => {
    const response = await fetch(`${API_URL}/schedule/today`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to get today\'s events');
    }
    return data;
  },

  // Get upcoming events
  getUpcoming: async () => {
    const response = await fetch(`${API_URL}/schedule/upcoming`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to get upcoming events');
    }
    return data;
  },

  // Create event
  create: async (eventData) => {
    const response = await fetch(`${API_URL}/schedule`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(eventData)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to create event');
    }
    return data;
  },

  // Update event
  update: async (eventId, eventData) => {
    const response = await fetch(`${API_URL}/schedule/${eventId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(eventData)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to update event');
    }
    return data;
  },

  // Delete event
  delete: async (eventId) => {
    const response = await fetch(`${API_URL}/schedule/${eventId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to delete event');
    }
    return data;
  }
};

export default { authAPI, userAPI, coursesAPI, scheduleAPI, healthCheck };
