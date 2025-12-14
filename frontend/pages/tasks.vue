<template>
  <div class="tasks-page">
    <div class="page-content">
      <!-- Welcome Section -->
      <div class="welcome-section">
        <h1 class="welcome-title">Your Tasks</h1>
        <p class="welcome-subtitle">Stay organized and productive</p>
      </div>

      <!-- Status Filter Tabs -->
      <div class="filter-tabs-container">
        <div class="filter-tabs">
          <button
            v-for="filter in statusFilters"
            :key="filter.value"
            @click="activeFilter = filter.value"
            :class="['filter-tab', { 'filter-tab--active': activeFilter === filter.value }]"
          >
            <span class="filter-tab-label">{{ filter.label }}</span>
            <span class="filter-tab-count">({{ filter.count }})</span>
          </button>
        </div>
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
              :loading="tasksStore.loading.value"
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
              :loading="tasksStore.loading.value"
              @submit="handleUpdateTask"
              @cancel="editingTask = null"
            />
          </div>
        </div>
      </Transition>

      <!-- Loading State -->
      <div v-if="tasksStore.loading.value && (!tasksStore.tasks.value || tasksStore.tasks.value.length === 0)" class="loading-state">
        <div class="spinner"></div>
        <p class="loading-text">Loading tasks...</p>
      </div>

      <!-- Error State -->
      <div v-if="tasksStore.error.value && !tasksStore.loading.value" class="error-message">
        {{ tasksStore.error.value }}
      </div>

      <!-- Tasks Grid -->
      <div v-if="!tasksStore.loading.value || filteredTasks.length > 0" class="tasks-grid">
        <TransitionGroup name="list">
          <TaskCard
            v-for="task in filteredTasks"
            :key="task.taskId"
            :task="task"
            @mark-done="handleMarkDone"
            @change-status="handleChangeStatus"
            @edit="editingTask = $event"
            @delete="handleDelete"
          />
        </TransitionGroup>
      </div>

      <!-- Empty State -->
      <div v-if="!tasksStore.loading.value && filteredTasks.length === 0" class="empty-state">
        <div class="empty-icon-container">
          <IconListBullet size="4rem" />
        </div>
        <h2 class="empty-title">
          {{ activeFilter === 'all' ? 'No tasks yet' : `No ${getFilterLabel(activeFilter)} tasks` }}
        </h2>
        <p class="empty-subtitle">
          {{ activeFilter === 'all' ? 'Create your first task to get started!' : `Try selecting a different filter or create a new task.` }}
        </p>
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
import TaskCard from '~/components/TaskCard.vue';
import TaskForm from '~/components/TaskForm.vue';
import IconPlus from '~/components/icons/IconPlus.vue';
import IconListBullet from '~/components/icons/IconListBullet.vue';
import { useTasksStore } from '~/stores/tasks';

definePageMeta({
  middleware: 'auth',
});

const tasksStore = useTasksStore();
const showCreateForm = ref(false);
const editingTask = ref<Task | null>(null);
const activeFilter = ref<'all' | 'pending' | 'in-progress' | 'completed' | 'cancelled'>('all');

// Fetch tasks on mount
onMounted(async () => {
  await tasksStore.fetchTasks();
});

// Filtered tasks based on active filter
const filteredTasks = computed(() => {
  const tasks = Array.isArray(tasksStore.tasks.value) ? tasksStore.tasks.value : [];
  if (activeFilter.value === 'all') {
    return tasks;
  }
  return tasks.filter(task => task.status === activeFilter.value);
});

// Status filter options with counts
const statusFilters = computed(() => {
  const tasks = Array.isArray(tasksStore.tasks.value) ? tasksStore.tasks.value : [];
  return [
    { value: 'all' as const, label: 'All', count: tasks.length },
    { value: 'pending' as const, label: 'Pending', count: tasksStore.pendingTasks.value?.length || 0 },
    { value: 'in-progress' as const, label: 'In Progress', count: tasksStore.inProgressTasks.value?.length || 0 },
    { value: 'completed' as const, label: 'Completed', count: tasksStore.completedTasks.value?.length || 0 },
    { value: 'cancelled' as const, label: 'Cancelled', count: tasks.filter(t => t.status === 'cancelled').length },
  ];
});

// Get filter label for empty state
const getFilterLabel = (filter: string) => {
  const filterMap: Record<string, string> = {
    'all': 'tasks',
    'pending': 'pending',
    'in-progress': 'in-progress',
    'completed': 'completed',
    'cancelled': 'cancelled',
  };
  return filterMap[filter] || 'tasks';
};

const handleCreateTask = async (data: { title: string; description?: string }) => {
  try {
    await tasksStore.createTask(data.title, data.description);
    showCreateForm.value = false;
    // Show success feedback
    if (tasksStore.error.value) {
      // Error will be shown in error message area
    }
  } catch (error: any) {
    console.error('Failed to create task:', error);
    // Error is already handled in store and displayed in error message area
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

const handleChangeStatus = async (data: { taskId: string; status: 'in-progress' | 'cancelled' }) => {
  try {
    await tasksStore.updateTask(data.taskId, { status: data.status });
  } catch (error) {
    console.error('Failed to change task status:', error);
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
.tasks-page {
  min-height: 100vh;
  background: #f8fafc;
  width: 100%;
}

.page-content {
  padding-top: 2rem;
  padding-bottom: 3rem;
  width: 100%;
}

.welcome-section {
  text-align: center;
  margin-bottom: 2rem;
}

.welcome-title {
  font-size: clamp(1.875rem, 4vw, 2.5rem);
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.5rem;
}

.welcome-subtitle {
  color: #64748b;
  font-size: clamp(1rem, 2.5vw, 1.125rem);
}

.filter-tabs-container {
  margin-bottom: 2rem;
  width: 100%;
}

.filter-tabs {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  background: white;
  padding: 0.5rem;
  border-radius: 0.75rem;
  box-shadow: var(--shadow-sm);
  overflow-x: auto;
}

.filter-tab {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid var(--color-gray-300);
  border-radius: 0.5rem;
  background: white;
  color: var(--color-gray-700);
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all var(--transition-base);
  white-space: nowrap;
  min-height: 44px;
}

.filter-tab:hover {
  background: var(--color-gray-100);
  border-color: var(--color-gray-400);
}

.filter-tab--active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.filter-tab--active:hover {
  background: var(--color-primary-dark);
  border-color: var(--color-primary-dark);
}

.filter-tab-label {
  font-weight: 600;
}

.filter-tab-count {
  font-size: 0.75rem;
  opacity: 0.8;
}

.create-button-container {
  margin-bottom: 2rem;
  display: flex;
  justify-content: flex-end;
}

.create-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 44px;
  font-size: 1rem;
}

.create-button:hover {
  background: #2563eb;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(59, 130, 246, 0.4);
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
  padding: 1rem;
  width: 100%;
}

.modal-content {
  background: white;
  border-radius: 0.75rem;
  max-width: 42rem;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  margin: 0 1rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.loading-state {
  text-align: center;
  padding: 4rem 0;
}

.spinner {
  display: inline-block;
  width: 3rem;
  height: 3rem;
  border: 4px solid #e2e8f0;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-text {
  color: #64748b;
  margin-top: 1rem;
}

.error-message {
  background: #fee2e2;
  border: 1px solid #fca5a5;
  color: #991b1b;
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 2rem;
}

.tasks-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  width: 100%;
}

.empty-state {
  text-align: center;
  padding: 4rem 0;
  width: 100%;
}

.empty-icon-container {
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
}

.empty-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.5rem;
}

.empty-subtitle {
  color: #64748b;
  margin-bottom: 2rem;
}

.empty-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 auto;
  padding: 0.75rem 1.5rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.empty-button:hover {
  background: #2563eb;
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

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (min-width: 640px) {
  .tasks-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
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

