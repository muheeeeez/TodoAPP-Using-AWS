# Todo App Frontend

A modern Todo application built with **Nuxt 4**, featuring beautiful animations, responsive design, and seamless integration with AWS backend services.

## 🚀 Features

- ✨ **Modern UI/UX** - Beautiful gradient design with smooth animations
- 🔐 **Authentication** - Cognito integration for secure user management
- 📱 **Responsive** - Works perfectly on desktop, tablet, and mobile
- ⚡ **Fast** - Optimized with Nuxt 4's latest features
- 🎨 **Animations** - Smooth transitions and hover effects
- 📝 **Full CRUD** - Create, read, update, and delete tasks
- 🏷️ **Status Management** - Track task status (pending, in-progress, completed)
- 💾 **State Management** - Reactive state with Nuxt composables

## 📁 Project Structure

```
frontend/
├── app/                    # App entry point
├── assets/                 # Static assets
│   └── css/                # Global styles
├── components/             # Vue components
│   ├── AppHeader.vue       # Navigation header
│   ├── TaskCard.vue        # Task display card
│   ├── TaskForm.vue        # Task create/edit form
│   └── TaskStatusBadge.vue # Status badge component
├── composables/            # Composable functions
│   ├── useApi.ts          # API integration
│   └── useAuth.ts         # Authentication logic
├── layouts/                # Layout components
│   └── default.vue        # Default layout
├── middleware/             # Route middleware
│   └── auth.ts            # Authentication guard
├── pages/                  # Route pages
│   ├── index.vue          # Main todo list page
│   └── auth/              # Auth pages
│       ├── login.vue      # Login page
│       └── signup.vue     # Signup page
├── stores/                 # State management
│   ├── auth.ts            # Auth state
│   └── tasks.ts           # Tasks state
└── types/                  # TypeScript types
    └── task.ts            # Task type definitions
```

## 🛠️ Setup

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# API Gateway URL (from AWS CDK deployment)
NUXT_PUBLIC_API_BASE_URL=https://your-api-gateway-url.execute-api.ca-central-1.amazonaws.com/prod

# Cognito Configuration (from AWS CDK deployment)
NUXT_PUBLIC_COGNITO_USER_POOL_ID=ca-central-1_xxxxxxxxx
NUXT_PUBLIC_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Note:** These values will be available after deploying your AWS backend. Check the CDK outputs for:
- `ApiUrl` - Your API Gateway URL
- `UserPoolId` - Your Cognito User Pool ID
- `UserPoolClientId` - Your Cognito Client ID

## 🎨 Design System

### Colors
- **Primary**: Blue (#3b82f6)
- **Success**: Green (#10b981)
- **Danger**: Red (#ef4444)
- **Warning**: Yellow (#f59e0b)

### Animations
- Page transitions with fade and slide effects
- Hover animations on interactive elements
- Smooth list animations for task cards
- Loading states with spinners

## 📡 API Integration

The frontend integrates with the following backend endpoints:

- `GET /todo` - Fetch all tasks
- `POST /todo` - Create new task
- `PUT /todo/{taskId}` - Update task
- `DELETE /todo/{taskId}` - Delete task
- `PATCH /todo/{taskId}/done` - Mark task as done

All requests include JWT authentication tokens from Cognito.

## 🔐 Authentication Flow

1. User signs up/logs in via Cognito
2. Cognito returns JWT token
3. Token is stored in application state
4. All API requests include token in `Authorization` header
5. API Gateway validates token before processing requests

## 🚧 Development Notes

### Mock Authentication
Currently, authentication uses mock tokens in development mode. To implement full Cognito integration:

1. Install AWS Amplify or Cognito SDK
2. Update `composables/useAuth.ts` with real Cognito methods
3. Configure Cognito User Pool and Client ID

### API Base URL
The API base URL is configured via environment variables. Make sure to set it after deploying your backend.

## 📦 Technologies

- **Nuxt 4** - Vue.js framework
- **Vue 3** - Progressive JavaScript framework
- **TypeScript** - Type safety
- **CSS3** - Modern styling with animations

## 🎯 Best Practices Used

- ✅ TypeScript for type safety
- ✅ Composable pattern for reusable logic
- ✅ State management with Nuxt useState
- ✅ Route middleware for authentication
- ✅ Component-based architecture
- ✅ Responsive design
- ✅ Accessibility considerations
- ✅ Error handling
- ✅ Loading states
- ✅ Smooth animations

## 📝 Next Steps

1. Deploy AWS backend and get API Gateway URL
2. Configure environment variables
3. Implement full Cognito authentication (currently mocked)
4. Test all CRUD operations
5. Deploy frontend to CloudFront/S3

## 🤝 Contributing

This is a portfolio project. Feel free to use it as a reference or starting point for your own projects!
