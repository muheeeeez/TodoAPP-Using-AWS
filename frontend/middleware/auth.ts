import { useAuthStore } from '~/stores/auth';
import { useAuth } from '~/composables/useAuth';

export default defineNuxtRouteMiddleware(async (to, from) => {
  const auth = useAuth();
  const authStore = useAuthStore();
  
  const isAuthPage = to.path === '/auth/login' || to.path === '/auth/signup';
  
  // Check session first (in case token expired or needs refresh)
  // Only check if not on auth pages to avoid unnecessary checks
  if (!isAuthPage && authStore.token) {
    try {
      await auth.checkSession();
    } catch (error) {
      // Session check failed, clear auth
      authStore.clearAuth();
    }
  }
  
  // If authenticated and trying to access auth pages, redirect to tasks
  if (authStore.isAuthenticated && isAuthPage) {
    return navigateTo('/tasks');
  }
  
  // If not authenticated and trying to access protected route, redirect to login
  if (!authStore.isAuthenticated && !isAuthPage) {
    return navigateTo('/auth/login');
  }
});

