<template>
  <div class="auth-page">
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <h1 class="auth-title">Welcome Back</h1>
          <p class="auth-subtitle">Sign in to your account</p>
        </div>

        <form @submit.prevent="handleLogin" class="auth-form">
          <div v-if="error" class="error-alert">
            {{ error }}
          </div>

          <div class="form-field">
            <label for="email" class="form-label">
              Email
            </label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              required
              class="form-input"
              placeholder="your@email.com"
            />
          </div>

          <div class="form-field">
            <label for="password" class="form-label">
              Password
            </label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              required
              class="form-input"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="auth-button"
          >
            {{ loading ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>

        <div class="auth-footer">
          <p class="auth-footer-text">
            Don't have an account?
            <NuxtLink to="/auth/signup" class="auth-link">
              Sign up
            </NuxtLink>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuth } from '~/composables/useAuth';

definePageMeta({
  middleware: 'guest', // Allow unauthenticated users, redirect authenticated users
  layout: false,
});

const auth = useAuth();
const router = useRouter();

const form = reactive({
  email: '',
  password: '',
});

const loading = ref(false);
const error = ref<string | null>(null);

const handleLogin = async () => {
  loading.value = true;
  error.value = null;

  try {
    await auth.signIn(form.email, form.password);
    await router.push('/tasks');
  } catch (err: any) {
    error.value = err.message || 'Failed to sign in';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  width: 100%;
  background: #f8fafc;
}

.auth-container {
  width: 100%;
  max-width: 28rem;
  margin: 0 auto;
}

.auth-card {
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
  padding: 2.5rem;
  border: 1px solid #e2e8f0;
}

.auth-header {
  text-align: center;
  margin-bottom: 2rem;
}

.auth-title {
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.5rem;
}

.auth-subtitle {
  color: #64748b;
  font-size: 0.875rem;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.error-alert {
  background: #fee2e2;
  border: 1px solid #fca5a5;
  color: #991b1b;
  padding: 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
}

.form-field {
  display: flex;
  flex-direction: column;
}

.form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  color: #1e293b;
  font-size: 1rem;
  transition: all 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-input::placeholder {
  color: #9ca3af;
}

.auth-button {
  width: 100%;
  padding: 0.75rem 1.5rem;
  background: #1e40af;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 44px;
  font-size: 1rem;
}

.auth-button:hover:not(:disabled) {
  background: #1e3a8a;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.auth-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.auth-footer {
  margin-top: 2rem;
  text-align: center;
}

.auth-footer-text {
  color: #64748b;
  font-size: 0.875rem;
}

.auth-link {
  color: #1e40af;
  font-weight: 600;
  text-decoration: none;
  margin-left: 0.25rem;
}

.auth-link:hover {
  text-decoration: underline;
}
</style>
