import { getAuthToken, saveAuthToken, removeAuthToken, saveUser } from './storage';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://calhacks2025-i4tb.onrender.com';

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
}

export const api = {
  async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = getAuthToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.detail || 'An error occurred' };
      }

      return { data };
    } catch (error) {
      console.error('API request failed:', error);
      return { error: 'Network error occurred' };
    }
  },

  async register(name: string, email: string, password: string) {
    const response = await this.request('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });

    if (response.data) {
      saveAuthToken(response.data.token);
      saveUser(response.data.user);
    }

    return response;
  },

  async login(email: string, password: string) {
    const response = await this.request('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.data) {
      saveAuthToken(response.data.token);
      saveUser(response.data.user);
    }

    return response;
  },

  async logout() {
    removeAuthToken();
  },

  async getCurrentUser() {
    return this.request('/api/v1/auth/me');
  },

  async getPlaces(params?: Record<string, string>) {
    const queryString = params ? `?${new URLSearchParams(params)}` : '';
    return this.request(`/api/v1/places${queryString}`);
  },

  async getPlace(id: string) {
    return this.request(`/api/v1/places/${id}`);
  },

  async getRoutes() {
    return this.request('/api/v1/routes');
  },

  async createRoute(routeData: any) {
    return this.request('/api/v1/routes', {
      method: 'POST',
      body: JSON.stringify(routeData),
    });
  },

  async generateAIRoute(preferences: any) {
    return this.request('/api/v1/ai-routes/generate', {
      method: 'POST',
      body: JSON.stringify(preferences),
    });
  },

  async generateAIRouteDemo(prompt: string, city?: string) {
    return this.request('/api/v1/ai/generate-route-demo', {
      method: 'POST',
      body: JSON.stringify({ prompt, city }),
    });
  },

  async getRouteSuggestionsDemo() {
    return this.request('/api/v1/ai/route-suggestions-demo');
  },
};