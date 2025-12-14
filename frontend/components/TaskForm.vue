<template>
  <form @submit.prevent="handleSubmit" class="task-form">
    <h2 class="form-title">
      {{ isEditing ? 'Edit Task' : 'Create New Task' }}
    </h2>

    <div class="form-content">
      <div class="form-field">
        <label for="title" class="form-label">
          Title <span class="required">*</span>
        </label>
        <input
          id="title"
          v-model="form.title"
          type="text"
          required
          maxlength="200"
          class="form-input"
          placeholder="Enter task title"
        />
      </div>

      <div class="form-field">
        <label for="description" class="form-label">
          Description
        </label>
        <textarea
          id="description"
          v-model="form.description"
          rows="4"
          maxlength="1000"
          class="form-textarea"
          placeholder="Enter task description (optional)"
        ></textarea>
      </div>

      <div v-if="isEditing" class="form-field">
        <label for="status" class="form-label">
          Status
        </label>
        <select
          id="status"
          v-model="form.status"
          class="form-select"
        >
          <option value="pending">Pending</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div class="form-actions">
        <button
          type="submit"
          :disabled="loading"
          class="btn btn-submit"
        >
          {{ loading ? 'Saving...' : isEditing ? 'Update Task' : 'Create Task' }}
        </button>
        <button
          v-if="isEditing"
          type="button"
          @click="$emit('cancel')"
          class="btn btn-cancel"
        >
          Cancel
        </button>
      </div>
    </div>
  </form>
</template>

<script setup lang="ts">
import type { Task, TaskStatus } from '~/types/task';

interface Props {
  task?: Task;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

const emit = defineEmits<{
  submit: [data: { title: string; description?: string; status?: TaskStatus }];
  cancel: [];
}>();

const isEditing = computed(() => !!props.task);

const form = reactive({
  title: props.task?.title || '',
  description: props.task?.description || '',
  status: (props.task?.status || 'pending') as TaskStatus,
});

watch(() => props.task, (newTask) => {
  if (newTask) {
    form.title = newTask.title;
    form.description = newTask.description || '';
    form.status = newTask.status;
  }
}, { immediate: true });

const handleSubmit = () => {
  const data: { title: string; description?: string; status?: TaskStatus } = {
    title: form.title.trim(),
  };

  if (form.description.trim()) {
    data.description = form.description.trim();
  }

  if (isEditing.value) {
    data.status = form.status;
  }

  emit('submit', data);
};
</script>

<style scoped>
.task-form {
  background: white;
  border-radius: var(--radius-xl);
  padding: var(--spacing-md);
  box-shadow: var(--shadow-lg);
  width: 100%;
}

.form-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-gray-900);
  margin-bottom: var(--spacing-lg);
}

.form-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.form-field {
  display: flex;
  flex-direction: column;
}

.form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-gray-700);
  margin-bottom: var(--spacing-sm);
}

.required {
  color: var(--color-danger);
}

.form-input,
.form-textarea,
.form-select {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--color-gray-300);
  border-radius: var(--radius-lg);
  font-size: 1rem;
  transition: all var(--transition-base);
  font-family: inherit;
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.form-textarea {
  resize: none;
  min-height: 100px;
}

.form-actions {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  padding-top: var(--spacing-md);
}

.btn {
  padding: var(--spacing-sm) var(--spacing-md);
  border: none;
  border-radius: var(--radius-lg);
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all var(--transition-base);
  min-height: 44px;
}

.btn-submit {
  flex: 1;
  background-color: var(--color-primary);
  color: white;
}

.btn-submit:hover:not(:disabled) {
  background-color: var(--color-primary-dark);
  transform: scale(1.05);
}

.btn-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-cancel {
  background-color: var(--color-gray-200);
  color: var(--color-gray-700);
}

.btn-cancel:hover {
  background-color: var(--color-gray-300);
}

@media (min-width: 640px) {
  .task-form {
    padding: var(--spacing-lg);
  }

  .form-title {
    font-size: 1.5rem;
    margin-bottom: var(--spacing-xl);
  }

  .form-actions {
    flex-direction: row;
  }

  .btn {
    font-size: 1rem;
    padding: var(--spacing-md) var(--spacing-lg);
  }
}
</style>
