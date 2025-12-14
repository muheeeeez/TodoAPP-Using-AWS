# Frontend Application Flow Documentation

## 🗺️ Routes Overview

The frontend has 3 main routes based on Nuxt 4's file-based routing:

```
/                     → Landing page (public)
/auth/login          → Login page (guest only)
/auth/signup         → Signup page (guest only)
/tasks               → Tasks management (authenticated only)
```

---

## 📍 Route Details

### 1. `/` - Landing Page (Public)
**File:** `frontend/pages/index.vue`

**Purpose:** Public-facing landing page for visitors

**Features:**
- Hero section with app description
- "Get Started" button → redirects to `/auth/signup`
- "Sign In" button → redirects to `/auth/login`
- Features showcase section
- No authentication required

**Middleware:** `guest` middleware
- If user IS authenticated → redirects to `/tasks`
- If user NOT authenticated → allows access

**Layout:** No layout (`layout: false`)
- Uses custom header/footer within the page

---

### 2. `/auth/login` - Login Page (Guest Only)
**File:** `frontend/pages/auth/login.vue`

**Purpose:** User authentication via Cognito

**Features:**
- Email input field
- Password input field
- "Sign In" button
- Link to signup page
- Error message display

**Flow:**
1. User enters email and password
2. Form submits to `handleLogin()`
3. Calls `auth.signIn()` from `useAuth()` composable
4. On success:
   - JWT token stored in `authStore`
   - User data stored in `authStore`
   - Redirects to `/tasks`
5. On error:
   - Error message displayed

**Middleware:** `guest` middleware
- If authenticated → redirects to `/tasks`
- If not authenticated → allows access

**Layout:** No layout (`layout: false`)

---

### 3. `/auth/signup` - Signup Page (Guest Only)
**File:** `frontend/pages/auth/signup.vue`

**Purpose:** User registration via Cognito

**Features:**
- Email input field
- Password input field (min 8 chars)
- Confirm password field
- "Sign Up" button
- Link to login page
- Error message display

**Flow:**
1. User enters email, password, confirm password
2. Frontend validates password match
3. Form submits to `handleSignUp()`
4. Calls `auth.signUp()` from `useAuth()` composable
5. On success:
   - Account created in Cognito
   - Email verification sent by Cognito
   - Redirects to `/auth/login`
6. On error:
   - Error message displayed

**Middleware:** `guest` middleware
- If authenticated → redirects to `/tasks`
- If not authenticated → allows access

**Layout:** No layout (`layout: false`)

---

### 4. `/tasks` - Tasks Management (Authenticated Only)
**File:** `frontend/pages/tasks.vue`

**Purpose:** Main application page for managing tasks

**Features:**
- Welcome section with title
- Status filter tabs (All, Pending, In Progress, Completed, Cancelled)
- "New Task" button
- Task grid displaying filtered tasks
- Create task modal
- Edit task modal
- Loading state
- Error message display
- Empty state

**Flow:**
1. Page loads
2. `onMounted()` calls `tasksStore.fetchTasks()`
3. Tasks fetched from API
4. Tasks displayed in grid
5. User can:
   - Filter tasks by status
   - Create new task
   - Edit existing task
   - Change task status (Start, Complete, Cancel)
   - Delete task
   - Mark task as done

**Middleware:** `auth` middleware
- If authenticated → allows access
- If not authenticated → redirects to `/auth/login`
- If trying to access auth pages while authenticated → redirects to `/tasks`

**Layout:** Uses default layout (`default`)
- Includes `AppHeader` with user info and sign-out button
- Container wrapper with padding

---

## 🔐 Authentication Flow

### Initial App Load
```
1. App starts
   ↓
2. Plugin: auth.client.ts runs
   ↓
3. Checks if authStore has token
   ↓
4. If token exists:
   - Calls auth.checkSession()
   - Validates token with Cognito
   - Restores user session
   ↓
5. If token invalid/expired:
   - Clears authStore
   - Clears Cognito localStorage
```

### Sign Up Flow
```
User visits / (landing page)
   ↓
Clicks "Get Started"
   ↓
Redirects to /auth/signup
   ↓
Fills email, password, confirm password
   ↓
Clicks "Sign Up"
   ↓
auth.signUp() → Cognito User Pool
   ↓
Success:
   - Account created
   - Email verification sent
   - Redirects to /auth/login
   ↓
Error:
   - Error message displayed
```

### Sign In Flow
```
User visits /auth/login
   ↓
Fills email and password
   ↓
Clicks "Sign In"
   ↓
auth.signIn() → Cognito User Pool
   ↓
Success:
   - JWT token received
   - Token stored in authStore
   - User data stored in authStore
   - Redirects to /tasks
   ↓
Error:
   - Error message displayed (e.g., "Incorrect username or password")
```

### Protected Route Access
```
User tries to access /tasks
   ↓
Middleware: auth.ts runs
   ↓
Checks authStore.isAuthenticated
   ↓
If authenticated:
   - Calls auth.checkSession() to validate token
   - If valid → allows access to /tasks
   - If invalid → clears auth, redirects to /auth/login
   ↓
If not authenticated:
   - Redirects to /auth/login
```

### Sign Out Flow
```
User clicks "Sign Out" in AppHeader
   ↓
auth.signOut()
   ↓
1. Gets current Cognito user
2. Calls cognitoUser.signOut()
3. Clears Cognito localStorage
4. Clears authStore (token, user)
   ↓
Redirects to /auth/login
```

---

## 🛡️ Middleware System

### 1. `auth` Middleware
**File:** `frontend/middleware/auth.ts`

**Purpose:** Protect authenticated routes

**Logic:**
```typescript
1. Check if on auth page (/auth/login or /auth/signup)
2. If NOT on auth page AND has token:
   - Call auth.checkSession() to validate
   - If session invalid → clear auth
3. If authenticated AND on auth page:
   - Redirect to /tasks
4. If NOT authenticated AND NOT on auth page:
   - Redirect to /auth/login
```

**Applied to:**
- `/tasks` page

---

### 2. `guest` Middleware
**File:** `frontend/middleware/guest.ts`

**Purpose:** Redirect authenticated users away from auth pages

**Logic:**
```typescript
1. Check authStore.isAuthenticated
2. If authenticated:
   - Redirect to /tasks
3. If not authenticated:
   - Allow access
```

**Applied to:**
- `/` (landing page)
- `/auth/login`
- `/auth/signup`

---

## 🔄 State Management

### Auth Store
**File:** `frontend/stores/auth.ts`

**State:**
- `token` - JWT token from Cognito
- `user` - User object (email, userId)
- `isAuthenticated` - Computed (true if token AND user exist)

**Methods:**
- `setToken(token)` - Store JWT token
- `setUser(user)` - Store user data
- `clearAuth()` - Clear token and user

**Used by:**
- `useAuth()` composable
- `useApi()` composable
- Middleware

---

### Tasks Store
**File:** `frontend/stores/tasks.ts`

**State:**
- `tasks` - Array of all tasks
- `loading` - Boolean loading state
- `error` - Error message string

**Computed:**
- `pendingTasks` - Filtered pending tasks
- `inProgressTasks` - Filtered in-progress tasks
- `completedTasks` - Filtered completed tasks

**Methods:**
- `fetchTasks()` - Get all tasks from API
- `createTask(title, description)` - Create new task
- `updateTask(taskId, updates)` - Update task
- `deleteTask(taskId)` - Delete task
- `markTaskDone(taskId)` - Mark task as completed

**Used by:**
- `/tasks` page

---

## 🔌 Composables

### 1. `useAuth()`
**File:** `frontend/composables/useAuth.ts`

**Purpose:** Authentication logic with Cognito

**Methods:**
- `signUp(email, password)` - Create new user
- `signIn(email, password)` - Authenticate user
- `signOut()` - Sign out and clear session
- `checkSession()` - Validate current session

**Returns:**
- `isAuthenticated` - Computed boolean
- `user` - Computed user object

---

### 2. `useApi()`
**File:** `frontend/composables/useApi.ts`

**Purpose:** API integration with backend

**Methods:**
- `getTasks()` - GET /todo
- `createTask(input)` - POST /todo
- `updateTask(taskId, input)` - PUT /todo/{taskId}
- `deleteTask(taskId)` - DELETE /todo/{taskId}
- `markTaskDone(taskId)` - PATCH /todo/{taskId}/done

**Features:**
- Adds Authorization header with JWT token
- Handles 401 errors (triggers logout)
- Parses API error responses

---

## 🎨 Layouts

### Default Layout
**File:** `frontend/layouts/default.vue`

**Used by:** `/tasks` page

**Contains:**
- `AppHeader` component (logo, user email, sign out button)
- Main content area with container
- Padding and styling

---

## 📄 Pages vs Layouts

### Pages with Layouts:
- `/tasks` → Uses `default` layout (has AppHeader)

### Pages without Layouts:
- `/` → Custom landing page (own header/footer)
- `/auth/login` → Standalone auth page
- `/auth/signup` → Standalone auth page

---

## 🚀 Application Startup Flow

```
1. User opens app (e.g., https://d26sbga84c89mx.cloudfront.net)
   ↓
2. Nuxt app initializes
   ↓
3. Plugin: auth.client.ts runs
   - Checks authStore for existing token
   - If token exists → calls auth.checkSession()
   - Validates with Cognito
   ↓
4. Router determines initial route
   ↓
5. If user NOT authenticated:
   - Route: / (landing page)
   - guest middleware allows access
   ↓
6. If user IS authenticated:
   - Route: / (landing page)
   - guest middleware redirects to /tasks
   ↓
7. User navigates (clicks links, types URL)
   ↓
8. Middleware runs on route change
   - Checks authentication
   - Redirects if necessary
   ↓
9. Page component loads
   - Fetches data (if needed)
   - Renders UI
```

---

## 🔑 Key Points

1. **File-based Routing:** Nuxt 4 automatically creates routes from `/pages` directory structure
2. **Middleware Protection:** `auth` and `guest` middleware control access
3. **Session Persistence:** Auth state persists in localStorage via Cognito
4. **Automatic Logout:** 401 errors from API trigger automatic logout
5. **Responsive Design:** All pages are mobile-friendly
6. **Security:** Protected routes require valid JWT token from Cognito

---

## 📊 Route Access Matrix

| Route | Authenticated User | Unauthenticated User |
|-------|-------------------|---------------------|
| `/` | Redirects to `/tasks` | Shows landing page |
| `/auth/login` | Redirects to `/tasks` | Shows login form |
| `/auth/signup` | Redirects to `/tasks` | Shows signup form |
| `/tasks` | Shows task management | Redirects to `/auth/login` |

---

## 🎯 User Journey Examples

### First-time User:
```
1. Opens app → / (landing page)
2. Clicks "Get Started" → /auth/signup
3. Signs up → Redirects to /auth/login
4. Logs in → Redirects to /tasks
5. Uses task management features
6. Clicks "Sign Out" → Redirects to /auth/login
```

### Returning User (with valid session):
```
1. Opens app → /
2. guest middleware detects authentication
3. Redirects to /tasks
4. Session restored from localStorage
5. Tasks loaded automatically
```

### User with expired session:
```
1. Opens app → /
2. Plugin runs auth.checkSession()
3. Session invalid → clears auth
4. Shows landing page (/)
5. User must log in again
```

---

## 🔍 Debugging Tips

1. **Check Auth State:** Look at `authStore.token` and `authStore.user` in browser console
2. **Check Middleware:** Console logs in middleware show redirect logic
3. **Check API Calls:** Network tab shows Authorization header with JWT token
4. **Check Cognito:** LocalStorage has Cognito keys (prefixed with `CognitoIdentityServiceProvider`)
5. **Check Routes:** Nuxt DevTools shows active route and middleware

---

This comprehensive flow ensures secure authentication, proper route protection, and smooth user experience throughout the application.

