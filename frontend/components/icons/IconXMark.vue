<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke-width="2"
    stroke="currentColor"
    class="icon"
    :style="{ width: size, height: size }"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
</template>

<script setup lang="ts">
interface Props {
  size?: string;
}

withDefaults(defineProps<Props>(), {
  size: '1.25rem',
});
</script>

<style scoped>
.icon {
  display: inline-block;
  flex-shrink: 0;
}
</style>

