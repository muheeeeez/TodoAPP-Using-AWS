import { useAuthStore } from '~/stores/auth';
import { useAuth } from '~/composables/useAuth';

/**
 * Authentication middleware
 * Protects routes that require user authentication
 * Apply this to pages that need auth: definePageMeta({ middleware: 'auth' })
 */
export default defineNuxtRouteMiddleware(async (to, from) => {
  const auth = useAuth();
  const authStore = useAuthStore();
  
  // If we have a stored token, verify the Cognito session is still valid
  if (authStore.token) {
    try {
      const isValid = await auth.checkSession();
      if (!isValid) {
        // Session is invalid, redirect to login
        return navigateTo('/auth/login');
      }
    } catch (error) {
      // Session check failed, clear auth and redirect to login
      authStore.clearAuth();
      return navigateTo('/auth/login');
    }
  } else {
    // No token at all, redirect to login
    return navigateTo('/auth/login');
  }
  
  // If we reach here, user is authenticated and can access the route
});

