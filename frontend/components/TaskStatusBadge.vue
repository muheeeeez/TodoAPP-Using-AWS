<template>
  <span
    class="status-badge"
    :class="badgeClass"
  >
    {{ statusText }}
  </span>
</template>

<script setup lang="ts">
import type { TaskStatus } from '~/types/task';

interface Props {
  status: TaskStatus;
}

const props = defineProps<Props>();

const statusText = computed(() => {
  const texts = {
    pending: 'Pending',
    'in-progress': 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };
  return texts[props.status] || props.status;
});

const badgeClass = computed(() => {
  const classes = {
    pending: 'status-badge--pending',
    'in-progress': 'status-badge--in-progress',
    completed: 'status-badge--completed',
    cancelled: 'status-badge--cancelled',
  };
  return classes[props.status] || 'status-badge--default';
});
</script>

<style scoped>
.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.status-badge--pending {
  background: #fef3c7;
  color: #92400e;
}

.status-badge--in-progress {
  background: #dbeafe;
  color: #1e40af;
}

.status-badge--completed {
  background: #d1fae5;
  color: #065f46;
}

.status-badge--cancelled {
  background: #f3f4f6;
  color: #374151;
}

.status-badge--default {
  background: #f3f4f6;
  color: #374151;
}
</style>
