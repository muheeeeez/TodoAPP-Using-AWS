export default defineNuxtRouteMiddleware((to, from) => {
  const authStore = useAuthStore();
  
  // If not authenticated and trying to access protected route
  if (!authStore.isAuthenticated && to.path !== '/auth/login' && to.path !== '/auth/signup') {
    return navigateTo('/auth/login');
  }
  
  // If authenticated and trying to access auth pages
  if (authStore.isAuthenticated && (to.path === '/auth/login' || to.path === '/auth/signup')) {
    return navigateTo('/');
  }
});

