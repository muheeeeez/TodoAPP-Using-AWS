// Client-side plugin to restore authentication session on app load
import { useAuth } from '~/composables/useAuth';
import { useAuthStore } from '~/stores/auth';

export default defineNuxtPlugin(async () => {
  const auth = useAuth();
  const authStore = useAuthStore();
  
  // Only check session if we have a token stored
  // This prevents auto-login when there's no actual session
  if (authStore.token) {
    try {
      await auth.checkSession();
    } catch (error) {
      // If session check fails, clear auth state
      authStore.clearAuth();
    }
  }
});

