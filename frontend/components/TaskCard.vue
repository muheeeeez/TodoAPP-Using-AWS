<template>
  <div
    class="task-card"
    :class="statusClass"
  >
    <div class="task-header">
      <div class="task-content">
        <h3 class="task-title">{{ task.title }}</h3>
        <p v-if="task.description" class="task-description">
          {{ task.description }}
        </p>
        <div class="task-meta">
          <span>Created: {{ formatDate(task.createdAt) }}</span>
          <span v-if="task.updatedAt" class="task-updated">Updated: {{ formatDate(task.updatedAt) }}</span>
        </div>
      </div>
      <TaskStatusBadge :status="task.status" />
    </div>

    <div class="task-actions">
      <!-- Quick Status Actions -->
      <template v-if="task.status === 'pending'">
        <button
          @click="$emit('change-status', { taskId: task.taskId, status: 'in-progress' })"
          class="btn btn-info"
          title="Start Task"
        >
          <IconPlay class="btn-icon" />
          <span class="btn-text-full">Start</span>
        </button>
      </template>
      <template v-else-if="task.status === 'in-progress'">
        <button
          @click="$emit('mark-done', task.taskId)"
          class="btn btn-success"
          title="Mark as Completed"
        >
          <IconCheck class="btn-icon" />
          <span class="btn-text-full">Complete</span>
        </button>
      </template>
      
      <!-- Edit and Delete Actions -->
      <button
        @click="$emit('edit', task)"
        class="btn btn-primary"
        title="Edit Task"
      >
        <IconPencil class="btn-icon" />
        <span class="btn-text-full">Edit</span>
      </button>
      <button
        @click="$emit('delete', task.taskId)"
        class="btn btn-danger"
        title="Delete Task"
      >
        <IconTrash class="btn-icon" />
        <span class="btn-text-full">Delete</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Task } from '~/types/task';
import IconCheck from './icons/IconCheck.vue';
import IconPlay from './icons/IconPlay.vue';
import IconXMark from './icons/IconXMark.vue';
import IconPencil from './icons/IconPencil.vue';
import IconTrash from './icons/IconTrash.vue';

interface Props {
  task: Task;
}

const props = defineProps<Props>();

defineEmits<{
  'mark-done': [taskId: string];
  'change-status': [data: { taskId: string; status: 'in-progress' | 'cancelled' }];
  'edit': [task: Task];
  'delete': [taskId: string];
}>();

const statusClass = computed(() => {
  const classes = {
    pending: 'task-card--pending',
    'in-progress': 'task-card--in-progress',
    completed: 'task-card--completed',
    cancelled: 'task-card--cancelled',
  };
  return classes[props.task.status] || 'task-card--default';
});

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
</script>

<style scoped>
.task-card {
  background: white;
  border-radius: var(--radius-xl);
  padding: var(--spacing-md);
  box-shadow: var(--shadow-md);
  transition: all var(--transition-slow);
  border-left-width: 4px;
  border-left-style: solid;
  width: 100%;
  animation: slideUp 0.3s ease-out;
}

.task-card:hover {
  box-shadow: var(--shadow-xl);
  transform: scale(1.02);
}

.task-card--pending {
  border-left-color: var(--color-warning);
}

.task-card--in-progress {
  border-left-color: var(--color-primary);
}

.task-card--completed {
  border-left-color: var(--color-success);
}

.task-card--cancelled {
  border-left-color: var(--color-gray-500);
}

.task-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: var(--spacing-md);
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.task-content {
  flex: 1;
  min-width: 0;
}

.task-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-gray-900);
  margin-bottom: var(--spacing-sm);
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.task-description {
  color: var(--color-gray-600);
  font-size: 0.875rem;
  margin-bottom: var(--spacing-md);
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.task-meta {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  font-size: 0.75rem;
  color: var(--color-gray-500);
}

.task-updated {
  display: none;
}

.task-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--color-gray-200);
  flex-wrap: wrap;
}

.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  border: none;
  border-radius: var(--radius-lg);
  font-weight: 500;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all var(--transition-base);
  min-height: 44px;
}

.btn:hover {
  transform: scale(1.05);
}

.btn-success {
  flex: 1;
  background-color: var(--color-success);
  color: white;
}

.btn-success:hover {
  background-color: #059669;
}

.btn-primary {
  background-color: var(--color-primary);
  color: white;
}

.btn-primary:hover {
  background-color: var(--color-primary-dark);
}

.btn-danger {
  background-color: var(--color-danger);
  color: white;
}

.btn-danger:hover {
  background-color: #dc2626;
}

.btn-info {
  background-color: var(--color-info);
  color: white;
}

.btn-info:hover {
  background-color: color-mix(in srgb, var(--color-info) 90%, black);
}

.btn-warning {
  background-color: var(--color-warning);
  color: white;
}

.btn-warning:hover {
  background-color: color-mix(in srgb, var(--color-warning) 90%, black);
}


.btn-text-short {
  display: inline;
}

.btn-text-full {
  display: none;
}

@media (min-width: 640px) {
  .task-card {
    padding: var(--spacing-lg);
  }

  .task-title {
    font-size: 1.125rem;
  }

  .task-description {
    font-size: 0.875rem;
  }

  .task-meta {
    flex-direction: row;
    align-items: center;
    gap: var(--spacing-md);
  }

  .task-updated {
    display: inline;
  }

  .task-actions {
    padding-top: var(--spacing-md);
  }

  .btn {
    font-size: 0.875rem;
    padding: var(--spacing-sm) var(--spacing-md);
  }

  .btn-text-short {
    display: none;
  }

  .btn-text-full {
    display: inline;
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
</style>
