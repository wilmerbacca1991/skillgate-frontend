import { API_BASE_URL } from '../config/env';

export const loginRequest = async ({ email, password }) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Login failed');
  }

  return data;
};

export const registerRequest = async ({ firstName, lastName, email, password, role }) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ firstName, lastName, email, password, role })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Registration failed');
  }

  return data;
};

export const getMeRequest = async (accessToken) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Fetch profile failed');
  }

  return data;
};

export const logoutRequest = async () => {
  const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
    method: 'POST',
    credentials: 'include'
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Logout failed');
  }

  return data;
};

export const uploadProfileImageRequest = async (accessToken, file) => {
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch(`${API_BASE_URL}/api/auth/profile-image`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      Authorization: `Bearer ${accessToken}`
    },
    body: formData
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Profile image upload failed');
  }

  return data;
};
