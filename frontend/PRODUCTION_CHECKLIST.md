# Production Checklist

## ✅ Fixed Issues

### 1. Auto-Login Problem
**Problem:** Users were being automatically logged in without creating an account.

**Fix:**
- Updated `auth.client.ts` plugin to only check session if a token exists in the store
- Added proper error handling to prevent auto-login on errors
- Clear Cognito localStorage when session check fails

### 2. Sign Out Not Working
**Problem:** Sign out button wasn't clearing authentication properly.

**Fix:**
- Updated `signOut()` function to clear Cognito's localStorage
- Cognito stores session data in localStorage with keys starting with `CognitoIdentityServiceProvider`
- Now properly clears both our auth state AND Cognito's stored session
- Added error handling to ensure redirect happens even if sign out fails

### 3. Session Restoration
**Problem:** Session was being restored even when invalid.

**Fix:**
- `checkSession()` now validates session properly
- Clears Cognito localStorage if session is invalid
- Only checks session if Cognito credentials are configured
- Properly handles errors and clears state on failure

## 🔧 Production Configuration

### Required Environment Variables

Make sure these are set in GitHub Secrets (for CI/CD) and `.env` file (for local dev):

```env
NUXT_PUBLIC_API_BASE_URL=https://your-api-gateway-url.execute-api.ca-central-1.amazonaws.com/prod/todo
NUXT_PUBLIC_COGNITO_USER_POOL_ID=ca-central-1_xxxxxxxxx
NUXT_PUBLIC_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
```

### API Configuration Check

1. **API Gateway URL Format:**
   - Should include `/todo` path: `https://xxx.execute-api.ca-central-1.amazonaws.com/prod/todo`
   - Check CDK output: `ApiUrl` from `TodoApiStack`

2. **Cognito Configuration:**
   - Get `UserPoolId` from CDK output: `UserPoolId` from `TodoAuthStack`
   - Get `UserPoolClientId` from CDK output: `UserPoolClientId` from `TodoAuthStack`

3. **API Gateway Authorization:**
   - All endpoints require Cognito JWT token
   - Token sent in `Authorization: Bearer <token>` header
   - API Gateway validates token automatically

### How to Get CDK Outputs

After deploying, run:
```bash
cd aws-backend
cdk list  # List all stacks
cdk outputs TodoApiStack  # Get API URL
cdk outputs TodoAuthStack  # Get Cognito IDs
```

Or check AWS Console:
- CloudFormation → Your Stack → Outputs tab

## 🧪 Testing Checklist

### Authentication Flow
- [ ] Landing page loads without requiring login
- [ ] Clicking "Sign In" redirects to `/auth/login`
- [ ] Login page requires email and password
- [ ] Sign up creates account and redirects to login
- [ ] After login, redirects to `/tasks` page
- [ ] Sign out button clears session and redirects to login
- [ ] Cannot access `/tasks` without being logged in
- [ ] Cannot access `/auth/login` when already logged in

### API Integration
- [ ] Tasks load after login
- [ ] Create task works
- [ ] Update task works
- [ ] Delete task works
- [ ] Mark done works
- [ ] 401 errors redirect to login

### Production Build
- [ ] Environment variables are set in GitHub Secrets
- [ ] Build succeeds with environment variables
- [ ] Frontend deploys to CloudFront/S3
- [ ] API calls work from deployed frontend

## 🐛 Debugging

### If auto-login still happens:
1. Clear browser localStorage: `localStorage.clear()` in console
2. Clear browser cookies
3. Check if Cognito credentials are set correctly
4. Check browser console for errors

### If sign out doesn't work:
1. Check browser console for errors
2. Verify Cognito credentials are set
3. Check if localStorage is being cleared (inspect Application tab)

### If API calls fail:
1. Check `NUXT_PUBLIC_API_BASE_URL` is set correctly
2. Verify API Gateway URL includes `/todo` path
3. Check token is being sent in Authorization header
4. Verify Cognito User Pool is configured correctly in API Gateway

## 📝 Notes

- Cognito stores session in localStorage automatically
- Our code now properly clears Cognito's localStorage on sign out
- Session check only happens if token exists in our store
- All authentication errors properly clear state and redirect

