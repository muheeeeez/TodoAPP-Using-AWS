<template>
  <header class="app-header">
    <nav class="container">
      <div class="header-content">
        <NuxtLink to="/" class="logo">
          <IconListBullet class="logo-icon" />
          <span class="logo-text">Todo App</span>
        </NuxtLink>
        
        <div class="header-actions">
          <div v-if="auth.user" class="user-info">
            <IconUser class="user-icon" />
            <span class="user-email">{{ auth.user.email }}</span>
          </div>
          <button
            @click="handleSignOut"
            class="sign-out-btn"
          >
            <IconLogout class="sign-out-icon" />
            <span class="sign-out-text">Sign Out</span>
          </button>
        </div>
      </div>
    </nav>
  </header>
</template>

<script setup lang="ts">
import IconListBullet from './icons/IconListBullet.vue';
import IconUser from './icons/IconUser.vue';
import IconLogout from './icons/IconLogout.vue';

const auth = useAuth();

const handleSignOut = async () => {
  await auth.signOut();
};
</script>

<style scoped>
.app-header {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(12px);
  box-shadow: var(--shadow-lg);
  position: sticky;
  top: 0;
  z-index: 50;
  width: 100%;
}

.app-header .container {
  padding-top: var(--spacing-md);
  padding-bottom: var(--spacing-md);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--spacing-md);
}

.logo {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  text-decoration: none;
  transition: color var(--transition-base);
}

.logo:hover {
  color: rgba(255, 255, 255, 0.8);
}


.logo-text {
  display: none;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.user-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.875rem;
}


.user-email {
  display: none;
}

.sign-out-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  border-radius: var(--radius-lg);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all var(--transition-base);
  min-height: 44px;
}

.sign-out-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.05);
}


.sign-out-text {
  display: none;
}

@media (min-width: 640px) {
  .logo-text {
    display: inline;
  }

  .user-email {
    display: inline;
  }

  .sign-out-text {
    display: inline;
  }

  .sign-out-btn {
    padding: var(--spacing-sm) var(--spacing-md);
    font-size: 1rem;
  }

  .sign-out-btn :deep(.icon) {
    width: 1.25rem;
    height: 1.25rem;
  }
}
</style>
