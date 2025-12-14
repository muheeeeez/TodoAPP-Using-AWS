# DynamoDB-Based Authentication Guide

This Todo App uses a custom JWT-based authentication system with DynamoDB for user management, replacing AWS Cognito.

## Architecture Overview

```
User Registration/Login
        ↓
  API Gateway (/auth/signup or /auth/login)
        ↓
  Lambda Function (auth-signup or auth-login)
        ↓
  DynamoDB (UsersTable)
        ↓
  JWT Token Generation
        ↓
  Return Token to Frontend
        ↓
Frontend stores token and includes in all API requests
        ↓
  Protected Lambda Functions verify JWT in Authorization header
```

## Database Schema

### UsersTable

**Primary Key**: `email` (String)  
**Global Secondary Index**: `UserIdIndex` on `userId`

**Item Structure**:
```json
{
  "email": "user@example.com",           // Primary key
  "userId": "uuid-v4-string",            // Unique user ID
  "username": "displayname",             // Display name
  "passwordHash": "hashed-password",     // PBKDF2-hashed password
  "passwordSalt": "random-salt",         // Salt for password hashing
  "createdAt": "ISO-8601-timestamp",     // Account creation time
  "updatedAt": "ISO-8601-timestamp",     // Last update time
  "lastLoginAt": "ISO-8601-timestamp"    // Last login time (optional)
}
```

## Authentication Endpoints

### POST /auth/signup

Create a new user account.

**Request**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "username": "John Doe"  // Optional
}
```

**Response** (201 Created):
```json
{
  "message": "Account created successfully",
  "user": {
    "userId": "uuid",
    "email": "user@example.com",
    "username": "John Doe",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Password Requirements**:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

**Errors**:
- `400` - Invalid email or password doesn't meet requirements
- `409` - Email already exists

### POST /auth/login

Authenticate and receive JWT token.

**Request**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response** (200 OK):
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "userId": "uuid",
    "email": "user@example.com",
    "username": "John Doe"
  }
}
```

**Errors**:
- `400` - Missing email or password
- `401` - Invalid credentials

## JWT Token

### Token Structure

The JWT token contains:

**Header**:
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

**Payload**:
```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "iat": 1642248000,    // Issued at (Unix timestamp)
  "exp": 1642334400     // Expires at (Unix timestamp, 24 hours later)
}
```

**Signature**: HMAC-SHA256(header.payload.JWT_SECRET)

### Token Expiration

- **Lifetime**: 24 hours
- **Refresh**: Not implemented (user must re-login after expiration)

### Using the Token

Include the token in the `Authorization` header for all protected endpoints:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Security Features

### Password Hashing

- **Algorithm**: PBKDF2 with SHA-512
- **Iterations**: 100,000
- **Key Length**: 64 bytes
- **Salt**: 16 bytes random (unique per user)

### JWT Secret

The JWT secret is stored as an environment variable (`JWT_SECRET`) and should be:
- At least 32 characters long
- Random and cryptographically secure
- Never committed to version control
- Different for each environment (dev/staging/prod)

**Important**: The current implementation generates a secret on deployment. For production, set a fixed secret in environment variables.

### HTTPS Only

- All API requests must use HTTPS
- API Gateway enforces TLS 1.2+

### Rate Limiting

- API Gateway throttling: 50 req/sec, burst 100
- Consider implementing additional rate limiting at the Lambda level for auth endpoints

## Protected Endpoints

All task-related endpoints (`/todo/*`) require authentication:

1. Lambda handler calls `getUserId(event)`
2. `getUserId` extracts token from Authorization header
3. Token is verified and decoded
4. `userId` is extracted from token payload
5. If verification fails, `401 Unauthorized` is returned

## Frontend Integration

### Sign Up Flow

```typescript
const auth = useAuth();
await auth.signUp(email, password, username);
// User can now sign in
```

### Sign In Flow

```typescript
const auth = useAuth();
await auth.signIn(email, password);
// Token is stored in state
// User is redirected to /tasks
```

### Making Authenticated Requests

```typescript
const authStore = useAuthStore();
const token = authStore.token;

const response = await fetch(`${apiUrl}/todo`, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
});
```

### Session Management

```typescript
// Check if session is still valid
const auth = useAuth();
const isValid = await auth.checkSession();

if (!isValid) {
  // Redirect to login
  await router.push('/auth/login');
}
```

## Implementation Details

### Lambda Handler Pattern

```typescript
export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    // Get userId from JWT token
    const userId = getUserId(event); // Throws error if invalid
    
    // Use userId for database operations
    // ...
    
  } catch (error) {
    return handleError(error, event);
  }
};
```

### Error Handling

All authentication errors return standardized responses:

```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired token",
  "statusCode": 401,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Deployment

### Environment Variables

Set the following in your CDK stack or Lambda configuration:

```bash
JWT_SECRET=your-secret-key-at-least-32-characters-long
USERS_TABLE_NAME=UsersTable  # Set automatically by CDK
```

### CDK Deployment

```bash
cd aws-backend
npm run build
cdk deploy TodoDatabaseStack  # Deploy users table
cdk deploy TodoApiStack       # Deploy auth lambdas
```

### Testing

```bash
# Sign up
curl -X POST https://your-api.execute-api.ca-central-1.amazonaws.com/prod/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecurePass123","username":"Test User"}'

# Sign in
curl -X POST https://your-api.execute-api.ca-central-1.amazonaws.com/prod/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecurePass123"}'

# Use token for protected endpoint
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
curl -X GET https://your-api.execute-api.ca-central-1.amazonaws.com/prod/todo \
  -H "Authorization: Bearer $TOKEN"
```

## Security Best Practices

### For Production

1. **JWT Secret Management**:
   - Use AWS Secrets Manager or Parameter Store
   - Rotate secrets regularly
   - Use different secrets per environment

2. **Rate Limiting**:
   - Implement stricter rate limits on auth endpoints
   - Consider exponential backoff for failed login attempts
   - Log failed login attempts

3. **Password Policy**:
   - Consider adding special character requirement
   - Implement password history
   - Add password expiration (optional)

4. **Token Security**:
   - Consider shorter token lifetime (e.g., 1 hour)
   - Implement refresh tokens
   - Add token revocation mechanism

5. **Email Verification**:
   - Add email verification flow
   - Use SES for sending verification emails
   - Don't allow login until email is verified

6. **Account Security**:
   - Implement account lockout after failed attempts
   - Add 2FA/MFA support
   - Log all authentication events

7. **Database**:
   - Enable DynamoDB point-in-time recovery
   - Set up CloudWatch alarms for unusual activity
   - Enable DynamoDB encryption (already implemented)

## Migration from Cognito

If migrating from Cognito:

1. Export existing users from Cognito
2. Hash passwords (if available) or force password reset
3. Import users into UsersTable
4. Update all Lambda functions to use new auth
5. Update frontend to use new auth endpoints
6. Test thoroughly before switching production traffic
7. Maintain Cognito stack temporarily for rollback capability

## Troubleshooting

### "Invalid or expired token"
- Check token hasn't expired (24-hour lifetime)
- Verify JWT_SECRET matches between token generation and verification
- Ensure Authorization header format is correct: `Bearer <token>`

### "Password does not meet requirements"
- Verify password has: 8+ chars, 1 uppercase, 1 lowercase, 1 number
- Check for leading/trailing whitespace

### "Email already exists"
- User tried to register with existing email
- Check UsersTable for existing record

### "USERS_TABLE_NAME environment variable is not set"
- CDK deployment may have failed
- Verify Lambda environment variables in AWS Console

## Future Enhancements

Potential improvements:
- Refresh token mechanism
- Email verification
- Password reset flow
- Social login integration
- Multi-factor authentication
- Account management endpoints (update profile, change password)
- Admin user roles and permissions
- Session management (view active sessions, logout from all devices)

## Comparison: DynamoDB Auth vs. Cognito

| Feature | DynamoDB Auth | Cognito |
|---------|--------------|---------|
| Cost | Pay per request (~$0.25 per million reads) | Free tier: 50K MAU, then $0.0055/MAU |
| Setup Complexity | Medium (custom implementation) | Low (managed service) |
| Customization | High | Medium |
| Security Features | Custom implementation required | Built-in (MFA, email verification, etc.) |
| Password Recovery | Need to implement | Built-in |
| Social Login | Need to implement | Built-in |
| Token Management | Custom JWT | OAuth2/OpenID Connect |
| Compliance | Self-managed | SOC, PCI DSS, HIPAA, etc. |
| Scalability | DynamoDB limits | Highly scalable |

**When to use DynamoDB Auth**:
- Full control over auth flow required
- Cost optimization for high user volumes
- Custom business logic needed
- Learning/educational purposes

**When to use Cognito**:
- Need quick setup
- Want managed security features
- Compliance requirements
- Social login required
- Don't want to maintain auth infrastructure

