import type { Task, CreateTaskInput, UpdateTaskInput, ApiError } from '~/types/task';

export const useApi = () => {
  const config = useRuntimeConfig();
  const authStore = useAuthStore();

  const apiBaseUrl = computed(() => config.public.apiBaseUrl);

  const getHeaders = () => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    const token = authStore.token;
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  };

  const handleResponse = async <T>(response: Response): Promise<T> => {
    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        error: 'Unknown Error',
        message: response.statusText,
        statusCode: response.status,
      }));
      throw error;
    }

    // Handle empty responses
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return {} as T;
    }

    return response.json();
  };

  // Clean API base URL (remove trailing slash)
  const baseApiUrl = computed(() => {
    const url = apiBaseUrl.value.trim();
    return url.endsWith('/') ? url.slice(0, -1) : url;
  });

  return {
    // Get all tasks
    async getTasks(): Promise<Task[]> {
      const response = await fetch(`${baseApiUrl.value}`, {
        method: 'GET',
        headers: getHeaders(),
      });
      return handleResponse<Task[]>(response);
    },

    // Create a new task
    async createTask(input: CreateTaskInput): Promise<Task> {
      const response = await fetch(`${baseApiUrl.value}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(input),
      });
      return handleResponse<Task>(response);
    },

    // Update a task
    async updateTask(taskId: string, input: UpdateTaskInput): Promise<Task> {
      const response = await fetch(`${baseApiUrl.value}/${taskId}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(input),
      });
      return handleResponse<Task>(response);
    },

    // Delete a task
    async deleteTask(taskId: string): Promise<void> {
      const response = await fetch(`${baseApiUrl.value}/${taskId}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (!response.ok) {
        await handleResponse(response);
      }
    },

    // Mark task as done
    async markTaskDone(taskId: string): Promise<Task> {
      const response = await fetch(`${baseApiUrl.value}/${taskId}/done`, {
        method: 'PATCH',
        headers: getHeaders(),
      });
      return handleResponse<Task>(response);
    },
  };
};

