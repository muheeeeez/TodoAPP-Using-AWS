export interface Task {
  userId: string;
  taskId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt?: string;
}

export type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'cancelled';

export interface CreateTaskInput {
  title: string;
  description?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
}

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
  timestamp?: string;
  path?: string;
}

