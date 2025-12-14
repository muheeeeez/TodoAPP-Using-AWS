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
definePageMeta({
  middleware: 'auth',
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
    await router.push('/');
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
  padding: var(--spacing-md);
  width: 100%;
}

.auth-container {
  width: 100%;
  max-width: 28rem;
  margin: 0 auto;
}

.auth-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(12px);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
  padding: var(--spacing-xl);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.auth-header {
  text-align: center;
  margin-bottom: var(--spacing-xl);
}

.auth-title {
  font-size: 2.25rem;
  font-weight: 700;
  color: white;
  margin-bottom: var(--spacing-sm);
}

.auth-subtitle {
  color: rgba(255, 255, 255, 0.8);
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.error-alert {
  background: #fee2e2;
  border: 1px solid #fca5a5;
  color: #991b1b;
  padding: var(--spacing-md);
  border-radius: var(--radius-lg);
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
  color: white;
  margin-bottom: var(--spacing-sm);
}

.form-input {
  width: 100%;
  padding: var(--spacing-md);
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: var(--radius-lg);
  color: white;
  font-size: 1rem;
  transition: all var(--transition-base);
}

.form-input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.form-input:focus {
  outline: none;
  border-color: rgba(255, 255, 255, 0.5);
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.1);
}

.auth-button {
  width: 100%;
  padding: var(--spacing-md) var(--spacing-lg);
  background: white;
  color: var(--color-primary);
  border: none;
  border-radius: var(--radius-lg);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-base);
  min-height: 44px;
}

.auth-button:hover:not(:disabled) {
  background: var(--color-gray-100);
  transform: scale(1.05);
}

.auth-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.auth-footer {
  margin-top: var(--spacing-xl);
  text-align: center;
}

.auth-footer-text {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.875rem;
}

.auth-link {
  color: white;
  font-weight: 600;
  text-decoration: none;
}

.auth-link:hover {
  text-decoration: underline;
}
</style>
