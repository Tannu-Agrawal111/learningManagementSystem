import { create } from 'zustand';

const useLmsStore = create((set, get) => ({
  // ─── Authentication State ──────────────────────────────────────────────────
  user: null,
  token: localStorage.getItem('token') || null,
  loading: true,
  
  setUser: (user) => set({ user }),
  setToken: (token) => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
    set({ token });
  },

  login: async (email, password) => {
    set({ loading: true });
    try {
      const res = await fetch(`${window.API_BASE_URL || 'http://localhost:5000'}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Login failed');
      }

      const data = await res.json();
      set({ user: data.user, token: data.token, loading: false });
      localStorage.setItem('token', data.token);
      return data.user;
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },

  checkAuth: async () => {
    const token = get().token;
    if (!token) {
      set({ loading: false });
      return;
    }
    try {
      const res = await fetch(`${window.API_BASE_URL || 'http://localhost:5000'}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        set({ user: data, loading: false });
      } else {
        get().logout();
        set({ loading: false });
      }
    } catch (error) {
      console.error('Zustand auth check error:', error);
      set({ loading: false });
    }
  },

  // ─── Cart State ─────────────────────────────────────────────────────────────
  cart: JSON.parse(localStorage.getItem('lms_cart')) || [],
  
  addToCart: (course) => {
    const cart = get().cart;
    const exists = cart.some(item => item.id === course.id);
    if (!exists) {
      const updatedCart = [...cart, course];
      localStorage.setItem('lms_cart', JSON.stringify(updatedCart));
      set({ cart: updatedCart });
    }
  },

  removeFromCart: (courseId) => {
    const cart = get().cart;
    const updatedCart = cart.filter(item => item.id !== courseId);
    localStorage.setItem('lms_cart', JSON.stringify(updatedCart));
    set({ cart: updatedCart });
  },

  clearCart: () => {
    localStorage.removeItem('lms_cart');
    set({ cart: [] });
  },

  // ─── Video Playback Continuity State ────────────────────────────────────────
  activeVideoId: null,
  playbackPosition: 0,
  
  setActiveVideo: (videoId, position = 0) => {
    set({ activeVideoId: videoId, playbackPosition: position });
  },
  
  updatePlaybackPosition: (position) => {
    set({ playbackPosition: position });
  }
}));

export default useLmsStore;
