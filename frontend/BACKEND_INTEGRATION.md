# Frontend Backend Integration Guide

## API Configuration

### Base URL
```
https://fdlpp1hfrk.execute-api.ca-central-1.amazonaws.com/prod
```

### Environment Variables
Create a `.env` file in the frontend root:

```env
# API Gateway Base URL (without /todo)
NUXT_PUBLIC_API_BASE_URL=https://fdlpp1hfrk.execute-api.ca-central-1.amazonaws.com/prod

# Cognito Configuration (get from AWS Console or CDK outputs)
NUXT_PUBLIC_COGNITO_USER_POOL_ID=ca-central-1_XXXXXXX
NUXT_PUBLIC_COGNITO_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX
```

---

## Authentication with Cognito

### Installation
```bash
npm install amazon-cognito-identity-js
```

### Configuration (nuxt.config.ts)
```typescript
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || '',
      cognitoUserPoolId: process.env.NUXT_PUBLIC_COGNITO_USER_POOL_ID || '',
      cognitoClientId: process.env.NUXT_PUBLIC_COGNITO_CLIENT_ID || '',
    }
  }
})
```

---

## API Endpoints

All endpoints require authentication via Cognito ID Token in the Authorization header.

### 1. Get All Tasks
**Endpoint:** `GET /todo`  
**Auth:** Required

**Request:**
```javascript
fetch('https://fdlpp1hfrk.execute-api.ca-central-1.amazonaws.com/prod/todo', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${idToken}`
  }
})
```

**Response (200):**
```json
[
  {
    "userId": "cognito-user-id",
    "taskId": "uuid",
    "title": "Buy groceries",
    "description": "Milk, eggs, bread",
    "status": "pending",
    "createdAt": "2025-12-14T10:30:00.000Z"
  }
]
```

---

### 2. Create Task
**Endpoint:** `POST /todo`  
**Auth:** Required

**Request:**
```javascript
fetch('https://fdlpp1hfrk.execute-api.ca-central-1.amazonaws.com/prod/todo', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${idToken}`
  },
  body: JSON.stringify({
    title: "Buy groceries",
    description: "Milk, eggs, bread"
  })
})
```

**Request Body:**
- `title` (required): String, max 200 characters
- `description` (optional): String, max 1000 characters

**Response (201):**
```json
{
  "userId": "cognito-user-id",
  "taskId": "generated-uuid",
  "title": "Buy groceries",
  "description": "Milk, eggs, bread",
  "status": "pending",
  "createdAt": "2025-12-14T10:30:00.000Z"
}
```

---

### 3. Update Task
**Endpoint:** `PUT /todo/{taskId}`  
**Auth:** Required

**Request:**
```javascript
fetch(`https://fdlpp1hfrk.execute-api.ca-central-1.amazonaws.com/prod/todo/${taskId}`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${idToken}`
  },
  body: JSON.stringify({
    title: "Updated title",
    description: "Updated description",
    status: "in-progress"
  })
})
```

**Request Body (all optional):**
- `title`: String, max 200 characters
- `description`: String, max 1000 characters
- `status`: "pending" | "in-progress" | "completed" | "cancelled"

**Response (200):**
```json
{
  "userId": "cognito-user-id",
  "taskId": "uuid",
  "title": "Updated title",
  "description": "Updated description",
  "status": "in-progress",
  "createdAt": "2025-12-14T10:30:00.000Z",
  "updatedAt": "2025-12-14T11:00:00.000Z"
}
```

---

### 4. Delete Task
**Endpoint:** `DELETE /todo/{taskId}`  
**Auth:** Required

**Request:**
```javascript
fetch(`https://fdlpp1hfrk.execute-api.ca-central-1.amazonaws.com/prod/todo/${taskId}`, {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${idToken}`
  }
})
```

**Response (200):**
```json
{
  "message": "Task deleted successfully",
  "taskId": "uuid"
}
```

---

### 5. Mark Task as Complete
**Endpoint:** `PATCH /todo/{taskId}/done`  
**Auth:** Required

**Request:**
```javascript
fetch(`https://fdlpp1hfrk.execute-api.ca-central-1.amazonaws.com/prod/todo/${taskId}/done`, {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${idToken}`
  }
})
```

**Response (200):**
```json
{
  "userId": "cognito-user-id",
  "taskId": "uuid",
  "title": "Buy groceries",
  "description": "Milk, eggs, bread",
  "status": "completed",
  "createdAt": "2025-12-14T10:30:00.000Z",
  "updatedAt": "2025-12-14T12:00:00.000Z"
}
```

---

## Implementation Examples

### Auth Store (stores/auth.ts)
```typescript
export interface User {
  email: string;
  userId: string;
  username?: string;
}

export const useAuthStore = () => {
  const token = useState<string | null>('auth:token', () => null);
  const user = useState<User | null>('auth:user', () => null);

  const isAuthenticated = computed(() => !!token.value && !!user.value);

  const setToken = (newToken: string) => {
    token.value = newToken;
  };

  const setUser = (newUser: User) => {
    user.value = newUser;
  };

  const clearAuth = () => {
    token.value = null;
    user.value = null;
  };

  return {
    token: readonly(token),
    user: readonly(user),
    isAuthenticated,
    setToken,
    setUser,
    clearAuth,
  };
};
```

---

### Auth Composable (composables/useAuth.ts)
```typescript
import { CognitoUserPool, CognitoUser, AuthenticationDetails, CognitoUserAttribute } from 'amazon-cognito-identity-js';
import { useAuthStore } from '~/stores/auth';

export const useAuth = () => {
  const config = useRuntimeConfig();
  const authStore = useAuthStore();
  const router = useRouter();

  const userPoolId = computed(() => config.public.cognitoUserPoolId);
  const clientId = computed(() => config.public.cognitoClientId);

  const getUserPool = () => {
    if (!userPoolId.value || !clientId.value) {
      throw new Error('Cognito configuration is missing');
    }
    return new CognitoUserPool({
      UserPoolId: userPoolId.value,
      ClientId: clientId.value,
    });
  };

  // Sign up
  const signUp = async (email: string, password: string) => {
    const userPool = getUserPool();
    const attributeList = [
      new CognitoUserAttribute({ Name: 'email', Value: email }),
    ];

    return new Promise((resolve, reject) => {
      userPool.signUp(email, password, attributeList, [], (err, result) => {
        if (err) {
          reject(new Error(err.message));
          return;
        }
        resolve({ success: true, message: 'Account created! Check your email.' });
      });
    });
  };

  // Sign in
  const signIn = async (email: string, password: string) => {
    const userPool = getUserPool();
    const authDetails = new AuthenticationDetails({
      Username: email,
      Password: password,
    });
    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: userPool,
    });

    return new Promise((resolve, reject) => {
      cognitoUser.authenticateUser(authDetails, {
        onSuccess: (result) => {
          // Get ID Token (not access token!)
          const idToken = result.getIdToken().getJwtToken();
          
          // Decode token to get user info
          const payload = JSON.parse(atob(idToken.split('.')[1]));
          
          // Store token and user
          authStore.setToken(idToken);
          authStore.setUser({
            email: payload.email || email,
            userId: payload.sub,
          });

          resolve({ success: true });
        },
        onFailure: (err) => {
          reject(new Error(err.message));
        },
      });
    });
  };

  // Sign out
  const signOut = async () => {
    const userPool = getUserPool();
    const cognitoUser = userPool.getCurrentUser();
    
    if (cognitoUser) {
      cognitoUser.signOut();
    }
    
    authStore.clearAuth();
    await router.push('/auth/login');
  };

  // Check session
  const checkSession = async (): Promise<boolean> => {
    try {
      const userPool = getUserPool();
      const cognitoUser = userPool.getCurrentUser();

      if (!cognitoUser) {
        authStore.clearAuth();
        return false;
      }

      return new Promise((resolve) => {
        cognitoUser.getSession((err: Error | null, session: any) => {
          if (err || !session || !session.isValid()) {
            authStore.clearAuth();
            resolve(false);
            return;
          }

          const idToken = session.getIdToken().getJwtToken();
          const payload = JSON.parse(atob(idToken.split('.')[1]));

          authStore.setToken(idToken);
          authStore.setUser({
            email: payload.email,
            userId: payload.sub,
          });

          resolve(true);
        });
      });
    } catch (error) {
      authStore.clearAuth();
      return false;
    }
  };

  return {
    signUp,
    signIn,
    signOut,
    checkSession,
    isAuthenticated: computed(() => authStore.isAuthenticated),
    user: computed(() => authStore.user.value),
  };
};
```

---

### API Composable (composables/useApi.ts)
```typescript
import type { Task } from '~/types/task';
import { useAuthStore } from '~/stores/auth';

export const useApi = () => {
  const config = useRuntimeConfig();
  const authStore = useAuthStore();
  const apiBaseUrl = computed(() => config.public.apiBaseUrl);

  const getHeaders = () => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    const token = authStore.token.value;
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  };

  const handleResponse = async <T>(response: Response): Promise<T> => {
    if (!response.ok) {
      if (response.status === 401) {
        authStore.clearAuth();
        throw new Error('Session expired. Please sign in again.');
      }
      
      const error = await response.json().catch(() => ({
        error: 'Unknown Error',
        message: response.statusText,
      }));
      throw new Error(error.message);
    }

    return response.json();
  };

  return {
    async getTasks(): Promise<Task[]> {
      const response = await fetch(`${apiBaseUrl.value}/todo`, {
        method: 'GET',
        headers: getHeaders(),
      });
      return handleResponse<Task[]>(response);
    },

    async createTask(input: { title: string; description?: string }): Promise<Task> {
      const response = await fetch(`${apiBaseUrl.value}/todo`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(input),
      });
      return handleResponse<Task>(response);
    },

    async updateTask(taskId: string, input: Partial<Task>): Promise<Task> {
      const response = await fetch(`${apiBaseUrl.value}/todo/${taskId}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(input),
      });
      return handleResponse<Task>(response);
    },

    async deleteTask(taskId: string): Promise<void> {
      const response = await fetch(`${apiBaseUrl.value}/todo/${taskId}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      await handleResponse(response);
    },

    async markTaskDone(taskId: string): Promise<Task> {
      const response = await fetch(`${apiBaseUrl.value}/todo/${taskId}/done`, {
        method: 'PATCH',
        headers: getHeaders(),
      });
      return handleResponse<Task>(response);
    },
  };
};
```

---

### Middleware (middleware/auth.ts)
```typescript
export default defineNuxtRouteMiddleware(async (to, from) => {
  const auth = useAuth();
  const authStore = useAuthStore();
  
  // Check if session is valid
  if (authStore.token.value) {
    await auth.checkSession();
  }
  
  // If not authenticated, redirect to login
  if (!authStore.isAuthenticated) {
    return navigateTo('/auth/login');
  }
});
```

---

## Error Handling

### Common Error Responses

**401 Unauthorized**
```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired token",
  "statusCode": 401,
  "timestamp": "2025-12-14T10:30:00.000Z"
}
```
Action: Clear auth state and redirect to login

**400 Bad Request**
```json
{
  "error": "Validation Error",
  "message": "title is required",
  "statusCode": 400,
  "timestamp": "2025-12-14T10:30:00.000Z"
}
```
Action: Display validation error to user

**404 Not Found**
```json
{
  "error": "Not Found",
  "message": "Task not found",
  "statusCode": 404,
  "timestamp": "2025-12-14T10:30:00.000Z"
}
```
Action: Display error message

---

## Task Data Model

```typescript
export interface Task {
  userId: string;
  taskId: string;
  title: string;
  description?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt?: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: 'pending' | 'in-progress' | 'completed' | 'cancelled';
}
```

---

## Testing the Integration

### 1. Setup Environment
```bash
# Copy and edit .env file
cp env.example .env
# Add your Cognito User Pool ID and Client ID
```

### 2. Install Dependencies
```bash
npm install amazon-cognito-identity-js
```

### 3. Run Development Server
```bash
npm run dev
```

### 4. Test Flow
1. Navigate to `/auth/signup` - Create account
2. Check email for verification code (if email verification enabled)
3. Navigate to `/auth/login` - Sign in
4. Create, update, delete tasks
5. Verify all API calls include Authorization header

---

## Security Best Practices

1. **Never expose tokens in URLs** - Always use headers
2. **Store tokens securely** - Use httpOnly cookies or secure state
3. **Refresh tokens before expiry** - Cognito tokens typically expire in 1 hour
4. **Clear tokens on logout** - Remove from all storage
5. **Handle 401 errors** - Automatically redirect to login
6. **Validate input on frontend** - Match backend validation rules
7. **Use HTTPS only** - Never send tokens over HTTP

---

## Troubleshooting

### Token Expired
**Problem:** Getting 401 errors  
**Solution:** Call `checkSession()` to refresh token or redirect to login

### CORS Errors
**Problem:** Browser blocking requests  
**Solution:** Backend already has CORS enabled for all origins

### Missing Cognito Config
**Problem:** "Cognito configuration is missing"  
**Solution:** Check `.env` file has correct User Pool ID and Client ID

### Tasks Not Loading
**Problem:** Empty task list or errors  
**Solution:** 
- Verify token is being sent in Authorization header
- Check API Gateway URL is correct
- Ensure user is authenticated with Cognito

---

## Summary

✅ API Base URL: `https://fdlpp1hfrk.execute-api.ca-central-1.amazonaws.com/prod`  
✅ Authentication: Cognito ID Token in `Authorization: Bearer <token>` header  
✅ All endpoints: GET, POST, PUT, DELETE, PATCH  
✅ CORS: Enabled  
✅ Security: Token-based authentication  

Your frontend is ready to integrate with the backend! 🚀

