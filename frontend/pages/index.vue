<template>
  <div class="landing-page">
    <!-- Hero Section -->
    <div class="hero-section">
      <div class="container">
        <div class="hero-content">
          <h1 class="hero-title">Todo App</h1>
          <p class="hero-subtitle">Stay organized and productive with our simple task management</p>
          <div class="hero-actions">
            <NuxtLink to="/auth/login" class="btn btn-primary">
              Sign In
            </NuxtLink>
            <NuxtLink to="/auth/signup" class="btn btn-secondary">
              Get Started
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <!-- Features Section -->
    <div class="features-section">
      <div class="container">
        <h2 class="features-title">Why Choose Todo App?</h2>
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">✓</div>
            <h3 class="feature-title">Simple & Clean</h3>
            <p class="feature-description">Intuitive interface that helps you focus on what matters</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🔒</div>
            <h3 class="feature-title">Secure</h3>
            <p class="feature-description">Your data is protected with enterprise-grade security</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">⚡</div>
            <h3 class="feature-title">Fast</h3>
            <p class="feature-description">Lightning-fast performance powered by AWS</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false,
  middleware: 'guest', // Redirect authenticated users to /tasks
});
</script>

<style scoped>
.landing-page {
  min-height: 100vh;
  background: white;
  width: 100%;
}

.hero-section {
  background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
  color: white;
  padding: 6rem 0;
  width: 100%;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  width: 100%;
}

.hero-content {
  text-align: center;
  max-width: 800px;
  margin: 0 auto;
}

.hero-title {
  font-size: clamp(2.5rem, 5vw, 4rem);
  font-weight: 700;
  margin-bottom: 1.5rem;
  color: white;
}

.hero-subtitle {
  font-size: clamp(1.125rem, 2vw, 1.5rem);
  margin-bottom: 2.5rem;
  color: rgba(255, 255, 255, 0.95);
  line-height: 1.6;
}

.hero-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.btn {
  padding: 0.875rem 2rem;
  border-radius: 0.5rem;
  font-weight: 600;
  text-decoration: none;
  display: inline-block;
  transition: all 0.2s ease;
  font-size: 1rem;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-primary {
  background: white;
  color: #1e40af;
}

.btn-primary:hover {
  background: #f3f4f6;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.btn-secondary {
  background: transparent;
  color: white;
  border: 2px solid white;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
}

.features-section {
  padding: 5rem 0;
  background: white;
}

.features-title {
  text-align: center;
  font-size: clamp(1.875rem, 3vw, 2.5rem);
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 3rem;
}

.features-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
  max-width: 1000px;
  margin: 0 auto;
}

.feature-card {
  text-align: center;
  padding: 2rem;
  border-radius: 0.75rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  transition: all 0.2s ease;
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: #3b82f6;
}

.feature-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.feature-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.75rem;
}

.feature-description {
  color: #64748b;
  line-height: 1.6;
}

@media (min-width: 768px) {
  .features-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .hero-section {
    padding: 8rem 0;
  }
}
</style>
