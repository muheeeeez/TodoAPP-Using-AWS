# Environment Variables Check

## ✅ Your Current .env File

Based on what I can see, your `.env` file has:
- ✅ `NUXT_PUBLIC_API_BASE_URL` - Set correctly
- ✅ `NUXT_PUBLIC_COGNITO_USER_POOL_ID` - Set (ca-central-1_cL9Ql6ziH)
- ⚠️ `NUXT_PUBLIC_COGNITO_CLIENT_ID` - **NEEDS TO BE SET**

## 🔍 How to Get Cognito Client ID

### Option 1: AWS Console
1. Go to AWS Console → Cognito → User Pools
2. Click on your User Pool: `TaskAppUsers`
3. Go to "App integration" tab
4. Under "App clients and analytics", you'll see your Client ID

### Option 2: CloudFormation Console
1. Go to AWS Console → CloudFormation
2. Find stack: `TodoAuthStack`
3. Click "Outputs" tab
4. Look for `UserPoolClientId` output

### Option 3: AWS CLI
```bash
aws cloudformation describe-stacks --stack-name TodoAuthStack --query "Stacks[0].Outputs[?OutputKey=='UserPoolClientId'].OutputValue" --output text
```

## 📝 Update Your .env File

Once you have the Client ID, update your `.env` file:

```env
# API Gateway URL (includes /todo path)
NUXT_PUBLIC_API_BASE_URL=https://fdlpp1hfrk.execute-api.ca-central-1.amazonaws.com/prod/todo

# Cognito Configuration
NUXT_PUBLIC_COGNITO_USER_POOL_ID=ca-central-1_cL9Ql6ziH
NUXT_PUBLIC_COGNITO_CLIENT_ID=YOUR_CLIENT_ID_HERE
```

## ✅ Verification

After updating, restart your dev server:
```bash
npm run dev
```

Then check browser console - you should NOT see:
- "Cognito configuration is missing" errors
- Authentication should work properly

## 🚀 For Production

Make sure these same values are in GitHub Secrets:
- `NUXT_PUBLIC_API_BASE_URL`
- `NUXT_PUBLIC_COGNITO_USER_POOL_ID`
- `NUXT_PUBLIC_COGNITO_CLIENT_ID`

