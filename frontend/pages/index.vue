<template>
  <div class="page-container">
    <AppHeader />
    <div class="container page-content">
      <!-- Welcome Section -->
      <div class="welcome-section">
        <h1 class="welcome-title">Your Tasks</h1>
        <p class="welcome-subtitle">Stay organized and productive</p>
      </div>

      <!-- Create Task Button -->
      <div class="create-button-container">
        <button
          @click="showCreateForm = true"
          class="create-button"
        >
          <IconPlus class="create-button-icon" />
          <span>New Task</span>
        </button>
      </div>

      <!-- Create Task Form Modal -->
      <Transition name="fade">
        <div
          v-if="showCreateForm"
          class="modal-overlay"
          @click.self="showCreateForm = false"
        >
          <div class="modal-content">
            <TaskForm
              :loading="tasksStore.loading"
              @submit="handleCreateTask"
              @cancel="showCreateForm = false"
            />
          </div>
        </div>
      </Transition>

      <!-- Edit Task Form Modal -->
      <Transition name="fade">
        <div
          v-if="editingTask"
          class="modal-overlay"
          @click.self="editingTask = null"
        >
          <div class="modal-content">
            <TaskForm
              :task="editingTask"
              :loading="tasksStore.loading"
              @submit="handleUpdateTask"
              @cancel="editingTask = null"
            />
          </div>
        </div>
      </Transition>

      <!-- Loading State -->
      <div v-if="tasksStore.loading && tasksStore.tasks.length === 0" class="loading-state">
        <div class="spinner"></div>
        <p class="loading-text">Loading tasks...</p>
      </div>

      <!-- Error State -->
      <div v-if="tasksStore.error && !tasksStore.loading" class="error-message">
        {{ tasksStore.error }}
      </div>

      <!-- Tasks Grid -->
      <div v-if="!tasksStore.loading || tasksStore.tasks.length > 0" class="tasks-grid">
        <TransitionGroup name="list">
          <TaskCard
            v-for="task in tasksStore.tasks"
            :key="task.taskId"
            :task="task"
            @mark-done="handleMarkDone"
            @edit="editingTask = $event"
            @delete="handleDelete"
          />
        </TransitionGroup>
      </div>

      <!-- Empty State -->
      <div v-if="!tasksStore.loading && tasksStore.tasks.length === 0" class="empty-state">
        <div class="empty-icon-container">
          <IconListBullet size="4rem" />
        </div>
        <h2 class="empty-title">No tasks yet</h2>
        <p class="empty-subtitle">Create your first task to get started!</p>
        <button
          @click="showCreateForm = true"
          class="empty-button"
        >
          <IconPlus size="1.25rem" />
          <span>Create Task</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Task } from '~/types/task';
import IconPlus from '~/components/icons/IconPlus.vue';
import IconListBullet from '~/components/icons/IconListBullet.vue';

definePageMeta({
  middleware: 'auth',
  layout: false,
});

const tasksStore = useTasksStore();
const showCreateForm = ref(false);
const editingTask = ref<Task | null>(null);

// Fetch tasks on mount
onMounted(async () => {
  await tasksStore.fetchTasks();
});

const handleCreateTask = async (data: { title: string; description?: string }) => {
  try {
    await tasksStore.createTask(data.title, data.description);
    showCreateForm.value = false;
  } catch (error) {
    console.error('Failed to create task:', error);
  }
};

const handleUpdateTask = async (data: { title: string; description?: string; status?: string }) => {
  if (!editingTask.value) return;
  
  try {
    await tasksStore.updateTask(editingTask.value.taskId, {
      title: data.title,
      description: data.description,
      status: data.status as any,
    });
    editingTask.value = null;
  } catch (error) {
    console.error('Failed to update task:', error);
  }
};

const handleMarkDone = async (taskId: string) => {
  try {
    await tasksStore.markTaskDone(taskId);
  } catch (error) {
    console.error('Failed to mark task as done:', error);
  }
};

const handleDelete = async (taskId: string) => {
  if (!confirm('Are you sure you want to delete this task?')) return;
  
  try {
    await tasksStore.deleteTask(taskId);
  } catch (error) {
    console.error('Failed to delete task:', error);
  }
};
</script>

<style scoped>
.page-container {
  min-height: 100vh;
  width: 100%;
}

.page-content {
  padding-top: var(--spacing-lg);
  padding-bottom: var(--spacing-xl);
  width: 100%;
}

.welcome-section {
  text-align: center;
  margin-bottom: var(--spacing-xl);
  animation: fadeIn 0.5s ease-out;
}

.welcome-title {
  font-size: clamp(1.875rem, 4vw, 3rem);
  font-weight: 700;
  color: white;
  margin-bottom: var(--spacing-sm);
}

.welcome-subtitle {
  color: rgba(255, 255, 255, 0.9);
  font-size: clamp(1rem, 2.5vw, 1.125rem);
}

.create-button-container {
  margin-bottom: var(--spacing-lg);
  display: flex;
  justify-content: flex-end;
}

.create-button {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background: white;
  color: var(--color-primary);
  border: none;
  border-radius: var(--radius-lg);
  font-weight: 600;
  box-shadow: var(--shadow-lg);
  cursor: pointer;
  transition: all var(--transition-base);
  min-height: 44px;
  font-size: 0.875rem;
}

.create-button:hover {
  box-shadow: var(--shadow-xl);
  transform: scale(1.05);
}


.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-md);
  width: 100%;
}

.modal-content {
  background: white;
  border-radius: var(--radius-xl);
  max-width: 42rem;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  margin: 0 var(--spacing-md);
  animation: slideUp 0.3s ease-out;
}

.loading-state {
  text-align: center;
  padding: var(--spacing-2xl) 0;
}

.spinner {
  display: inline-block;
  width: 3rem;
  height: 3rem;
  border: 4px solid white;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-text {
  color: white;
  margin-top: var(--spacing-md);
}

.error-message {
  background: #fee2e2;
  border: 1px solid #fca5a5;
  color: #991b1b;
  padding: var(--spacing-md);
  border-radius: var(--radius-lg);
  margin-bottom: var(--spacing-lg);
}

.tasks-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-md);
  width: 100%;
}

.empty-state {
  text-align: center;
  padding: var(--spacing-2xl) 0;
  width: 100%;
}

.empty-icon-container {
  display: flex;
  justify-content: center;
  margin-bottom: var(--spacing-md);
}

.empty-icon-container :deep(.icon) {
  color: rgba(255, 255, 255, 0.5);
}

@media (min-width: 640px) {
  .empty-icon-container :deep(.icon) {
    width: 5rem;
    height: 5rem;
  }
}

.empty-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: white;
  margin-bottom: var(--spacing-sm);
}

.empty-subtitle {
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: var(--spacing-lg);
  font-size: 0.875rem;
}

.empty-button {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin: 0 auto;
  padding: var(--spacing-md) var(--spacing-lg);
  background: white;
  color: var(--color-primary);
  border: none;
  border-radius: var(--radius-lg);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-base);
}

.empty-button:hover {
  background: var(--color-gray-100);
}


.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.list-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

.list-move {
  transition: transform 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (min-width: 640px) {
  .welcome-title {
    margin-bottom: var(--spacing-md);
  }

  .welcome-subtitle {
    font-size: 1.125rem;
  }

  .create-button {
    padding: var(--spacing-md) var(--spacing-lg);
    font-size: 1rem;
  }

  .tasks-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-lg);
  }

  .empty-title {
    font-size: 1.5rem;
  }

  .empty-subtitle {
    font-size: 1rem;
  }

  .empty-icon {
    width: 5rem;
    height: 5rem;
  }
}

@media (min-width: 1024px) {
  .tasks-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 1280px) {
  .tasks-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>
