import type { Task, TaskStatus } from '~/types/task';

export const useTasksStore = () => {
  const tasks = useState<Task[]>('tasks', () => []);
  const loading = useState<boolean>('tasks:loading', () => false);
  const error = useState<string | null>('tasks:error', () => null);

  const api = useApi();

  // Filtered tasks
  const pendingTasks = computed(() => 
    tasks.value.filter(t => t.status === 'pending')
  );
  
  const inProgressTasks = computed(() => 
    tasks.value.filter(t => t.status === 'in-progress')
  );
  
  const completedTasks = computed(() => 
    tasks.value.filter(t => t.status === 'completed')
  );

  // Fetch all tasks
  const fetchTasks = async () => {
    loading.value = true;
    error.value = null;
    try {
      tasks.value = await api.getTasks();
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch tasks';
      console.error('Error fetching tasks:', err);
    } finally {
      loading.value = false;
    }
  };

  // Create task
  const createTask = async (title: string, description?: string) => {
    loading.value = true;
    error.value = null;
    try {
      const newTask = await api.createTask({ title, description });
      tasks.value.unshift(newTask);
      return newTask;
    } catch (err: any) {
      error.value = err.message || 'Failed to create task';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Update task
  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    loading.value = true;
    error.value = null;
    try {
      const updatedTask = await api.updateTask(taskId, updates);
      const index = tasks.value.findIndex(t => t.taskId === taskId);
      if (index !== -1) {
        tasks.value[index] = updatedTask;
      }
      return updatedTask;
    } catch (err: any) {
      error.value = err.message || 'Failed to update task';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Delete task
  const deleteTask = async (taskId: string) => {
    loading.value = true;
    error.value = null;
    try {
      await api.deleteTask(taskId);
      tasks.value = tasks.value.filter(t => t.taskId !== taskId);
    } catch (err: any) {
      error.value = err.message || 'Failed to delete task';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Mark task as done
  const markTaskDone = async (taskId: string) => {
    loading.value = true;
    error.value = null;
    try {
      const updatedTask = await api.markTaskDone(taskId);
      const index = tasks.value.findIndex(t => t.taskId === taskId);
      if (index !== -1) {
        tasks.value[index] = updatedTask;
      }
      return updatedTask;
    } catch (err: any) {
      error.value = err.message || 'Failed to mark task as done';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return {
    tasks: readonly(tasks),
    loading: readonly(loading),
    error: readonly(error),
    pendingTasks,
    inProgressTasks,
    completedTasks,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    markTaskDone,
  };
};

