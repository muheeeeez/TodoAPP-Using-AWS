/**
 * Validation error class
 */
export class ValidationError extends Error {
  public readonly errors: string[];

  constructor(errors: string[]) {
    super('Validation failed');
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

/**
 * Validates that a value is not empty
 */
export function validateRequired(value: any, fieldName: string): void {
  if (value === undefined || value === null || value === '') {
    throw new ValidationError([`${fieldName} is required`]);
  }
}

/**
 * Validates that a value is a non-empty string
 */
export function validateString(value: any, fieldName: string, maxLength?: number): void {
  if (typeof value !== 'string') {
    throw new ValidationError([`${fieldName} must be a string`]);
  }
  
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    throw new ValidationError([`${fieldName} cannot be empty`]);
  }

  if (maxLength && trimmed.length > maxLength) {
    throw new ValidationError([`${fieldName} must not exceed ${maxLength} characters`]);
  }
}

/**
 * Validates that a value is a valid UUID
 */
export function validateUUID(value: any, fieldName: string): void {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (typeof value !== 'string' || !uuidRegex.test(value)) {
    throw new ValidationError([`${fieldName} must be a valid UUID`]);
  }
}

/**
 * Validates task status
 */
export function validateStatus(value: any): void {
  const validStatuses = ['pending', 'in-progress', 'completed', 'cancelled'];
  if (typeof value !== 'string' || !validStatuses.includes(value)) {
    throw new ValidationError([`status must be one of: ${validStatuses.join(', ')}`]);
  }
}

/**
 * Validates task creation input
 */
export interface CreateTaskInput {
  title: string;
  description?: string;
}

export function validateCreateTaskInput(body: any): CreateTaskInput {
  const errors: string[] = [];

  try {
    validateRequired(body.title, 'title');
  } catch (error) {
    if (error instanceof ValidationError) {
      errors.push(...error.errors);
    }
  }

  try {
    validateString(body.title, 'title', 200);
  } catch (error) {
    if (error instanceof ValidationError) {
      errors.push(...error.errors);
    }
  }

  if (body.description !== undefined) {
    try {
      validateString(body.description, 'description', 1000);
    } catch (error) {
      if (error instanceof ValidationError) {
        errors.push(...error.errors);
      }
    }
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }

  return {
    title: body.title.trim(),
    description: body.description?.trim() || '',
  };
}

/**
 * Validates task update input
 */
export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: string;
}

export function validateUpdateTaskInput(body: any): UpdateTaskInput {
  const errors: string[] = [];
  const result: UpdateTaskInput = {};

  if (body.title !== undefined) {
    try {
      validateString(body.title, 'title', 200);
      result.title = body.title.trim();
    } catch (error) {
      if (error instanceof ValidationError) {
        errors.push(...error.errors);
      }
    }
  }

  if (body.description !== undefined) {
    try {
      validateString(body.description, 'description', 1000);
      result.description = body.description.trim();
    } catch (error) {
      if (error instanceof ValidationError) {
        errors.push(...error.errors);
      }
    }
  }

  if (body.status !== undefined) {
    try {
      validateStatus(body.status);
      result.status = body.status;
    } catch (error) {
      if (error instanceof ValidationError) {
        errors.push(...error.errors);
      }
    }
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }

  if (Object.keys(result).length === 0) {
    throw new ValidationError(['At least one field (title, description, or status) must be provided']);
  }

  return result;
}

/**
 * Validates taskId from path parameters
 */
export function validateTaskId(taskId: any): string {
  if (!taskId) {
    throw new ValidationError(['Task ID is required']);
  }
  validateUUID(taskId, 'taskId');
  return taskId;
}

