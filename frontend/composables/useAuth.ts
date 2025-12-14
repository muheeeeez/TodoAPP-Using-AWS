import { useAuthStore } from '~/stores/auth';

export const useAuth = () => {
  const config = useRuntimeConfig();
  const authStore = useAuthStore();
  const router = useRouter();

  const apiBaseUrl = computed(() => config.public.apiBaseUrl);

  // Sign up
  const signUp = async (email: string, password: string, username?: string): Promise<{ success: boolean; message?: string }> => {
    try {
      if (!apiBaseUrl.value) {
        throw new Error('API base URL is not configured. Please check your environment variables.');
      }

      const response = await fetch(`${apiBaseUrl.value}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, username }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create account');
      }

      return {
        success: true,
        message: 'Account created successfully! You can now sign in.',
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create account');
    }
  };

  // Sign in
  const signIn = async (email: string, password: string): Promise<{ success: boolean }> => {
    try {
      if (!apiBaseUrl.value) {
        throw new Error('API base URL is not configured. Please check your environment variables.');
      }

      const response = await fetch(`${apiBaseUrl.value}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to sign in');
      }

      // Store token and user info
      authStore.setToken(data.token);
      authStore.setUser({
        email: data.user.email,
        userId: data.user.userId,
        username: data.user.username,
      });

      return { success: true };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to sign in');
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      // Clear auth state
      authStore.clearAuth();
      
      // Redirect to login
      await router.push('/auth/login');
    } catch (error) {
      // Even if redirect fails, clear auth state
      authStore.clearAuth();
      await router.push('/auth/login');
    }
  };

  // Check current session and restore if valid
  const checkSession = async (): Promise<boolean> => {
    try {
      const token = authStore.token.value;
      
      if (!token) {
        authStore.clearAuth();
        return false;
      }

      // Decode JWT to check expiration
      try {
        const parts = token.split('.');
        if (parts.length !== 3 || !parts[1]) {
          authStore.clearAuth();
          return false;
        }

        const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
        const now = Math.floor(Date.now() / 1000);
        
        // Check if token is expired
        if (payload.exp && payload.exp < now) {
          authStore.clearAuth();
          return false;
        }

        // Token is valid, ensure user info is set
        if (!authStore.user.value && payload.userId && payload.email) {
          authStore.setUser({
            email: payload.email,
            userId: payload.userId,
            username: payload.username || payload.email.split('@')[0],
          });
        }

        return true;
      } catch (decodeError) {
        authStore.clearAuth();
        return false;
      }
    } catch (error) {
      authStore.clearAuth();
      return false;
    }
  };

  // Check if user is authenticated
  const isAuthenticated = computed(() => authStore.isAuthenticated);

  return {
    signUp,
    signIn,
    signOut,
    checkSession,
    isAuthenticated,
    user: computed(() => authStore.user.value),
  };
};
