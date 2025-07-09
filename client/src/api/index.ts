// Simple API functions for Netlify deployment
const API_BASE = '/.netlify/functions';

export const registerUser = async (userData: {username: string, password: string}) => {
  try {
    const response = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    return await response.json();
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

export const loginUser = async (userData: {username: string, password: string}) => {
  try {
    const response = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    return await response.json();
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const getMessages = async () => {
  try {
    const response = await fetch(`${API_BASE}/messages`);
    return await response.json();
  } catch (error) {
    console.error('Get messages error:', error);
    throw error;
  }
};

export const sendMessage = async (messageData: any) => {
  try {
    const response = await fetch(`${API_BASE}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messageData),
    });
    return await response.json();
  } catch (error) {
    console.error('Send message error:', error);
    throw error;
  }
};
