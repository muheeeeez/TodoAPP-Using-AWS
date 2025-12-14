import { useAuthStore } from '~/stores/auth';

// Middleware for guest-only pages (landing page, login, signup)
// This redirects authenticated users away from public pages
export default defineNuxtRouteMiddleware((to, from) => {
  const authStore = useAuthStore();
  
  // If authenticated, redirect to tasks page (skip landing page)
  if (authStore.isAuthenticated) {
    return navigateTo('/tasks');
  }
  
  // If not authenticated, allow access to public pages
  // No redirect needed
});

