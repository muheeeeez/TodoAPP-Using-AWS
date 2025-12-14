import { useAuthStore } from '~/stores/auth';

// Middleware for guest-only pages (landing page, login, signup)
export default defineNuxtRouteMiddleware((to, from) => {
  const authStore = useAuthStore();
  
  // If authenticated, redirect to tasks page
  if (authStore.isAuthenticated) {
    return navigateTo('/tasks');
  }
});

