# JWT Secret Management

## Automatic JWT Secret Generation

The Todo App backend automatically generates a secure JWT secret during CDK deployment if one is not provided via environment variables.

## How It Works

### During CDK Deployment (`lib/api-stack.ts`)

```typescript
const jwtSecret = process.env.JWT_SECRET || (() => {
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('base64');
})();
```

**What happens:**
1. Checks if `JWT_SECRET` environment variable exists
2. If not found, generates a cryptographically secure 32-byte random secret
3. Encodes it as Base64 string
4. Uses this secret for all Lambda functions in the stack

### During Lambda Execution (`lambdas/utils/auth.ts`)

```typescript
const secret = process.env.JWT_SECRET || 'default-jwt-secret-for-development-only-not-for-production';
```

**What happens:**
1. Each Lambda receives the `JWT_SECRET` as an environment variable (set by CDK)
2. Uses this secret to sign and verify JWT tokens
3. Falls back to a default secret only if CDK deployment didn't set it

## Deployment Scenarios

### Scenario 1: Automatic (Default)
**No manual intervention required**

```bash
cd aws-backend
cdk deploy --all
```

✅ **Result**: CDK automatically generates a secure random JWT secret and injects it into all Lambda functions.

**Pros:**
- Zero configuration required
- Works out of the box
- Cryptographically secure

**Cons:**
- Secret changes on each deployment (invalidates existing tokens)
- Different secret per stack/environment
- Can't easily view or rotate the secret

### Scenario 2: Manual via Environment Variable
**Provide your own JWT secret**

```bash
# Set environment variable before deployment
export JWT_SECRET="your-custom-secret-here"
cdk deploy --all
```

✅ **Result**: Uses your provided secret, consistent across deployments.

**Pros:**
- Consistent secret across deployments
- Tokens remain valid after redeployment
- Can be stored in secrets management system
- Same secret across multiple environments if needed

**Cons:**
- Requires manual setup
- Must be securely stored and managed

### Scenario 3: GitHub Actions (Automatic)
**Current setup - no secret required**

The GitHub Actions workflow now works without requiring `JWT_SECRET`:

```yaml
- name: cdk deploy
  env:
    AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
    AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
    AWS_DEFAULT_REGION: ${{ secrets.AWS_REGION }}
    # JWT_SECRET not required - auto-generated
  run: cdk deploy --all --require-approval never
```

✅ **Result**: Pipeline runs successfully, secret auto-generated on each deployment.

## Token Invalidation Behavior

### With Auto-Generated Secret (Default)

**Each deployment generates a new secret:**

```
Deployment 1: Secret A generated → Users login → Tokens signed with Secret A
Deployment 2: Secret B generated → Old tokens invalid → Users must re-login
```

⚠️ **Impact**: Users are logged out after each deployment and must re-authenticate.

### With Fixed Secret (Manual)

**Same secret used across deployments:**

```
Deployment 1: Secret X used → Users login → Tokens signed with Secret X
Deployment 2: Secret X used → Old tokens still valid → Users stay logged in
```

✅ **Impact**: Users remain logged in across deployments (until token expires naturally after 24 hours).

## Recommendations

### For Development/Testing
✅ **Use Auto-Generated Secret** (current setup)
- No configuration needed
- Fast iteration
- Security not critical for dev

### For Production
⚠️ **Use Fixed Secret** (manual setup recommended)

**Option A: AWS Secrets Manager (Best Practice)**

1. Store JWT secret in AWS Secrets Manager:
```bash
aws secretsmanager create-secret \
  --name TodoAppJwtSecret \
  --secret-string "$(openssl rand -base64 32)"
```

2. Update Lambda to retrieve from Secrets Manager:
```typescript
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

async function getJwtSecret(): Promise<string> {
  const client = new SecretsManagerClient({ region: "ca-central-1" });
  const response = await client.send(
    new GetSecretValueCommand({ SecretId: "TodoAppJwtSecret" })
  );
  return response.SecretString!;
}
```

3. Grant Lambda permission to read secret in CDK.

**Option B: Environment Variable**

1. Generate secret once:
```bash
openssl rand -base64 32
# Example output: K7gNU3sdo+OL0wNhqoVWhr3g6s1xYv72ol/pe/Unols=
```

2. Store securely (not in code):
```bash
# Local .env file (don't commit)
export JWT_SECRET="K7gNU3sdo+OL0wNhqoVWhr3g6s1xYv72ol/pe/Unols="

# GitHub Secret
# Add JWT_SECRET to repository secrets

# CI/CD
# Set as environment variable in deployment pipeline
```

3. Deploy with secret:
```bash
export JWT_SECRET="your-secret-here"
cdk deploy --all
```

**Option C: AWS Systems Manager Parameter Store**

1. Store in Parameter Store:
```bash
aws ssm put-parameter \
  --name /todoapp/jwt-secret \
  --value "$(openssl rand -base64 32)" \
  --type SecureString
```

2. Retrieve in CDK:
```typescript
import { StringParameter } from 'aws-cdk-lib/aws-ssm';

const jwtSecret = StringParameter.valueForStringParameter(
  this,
  '/todoapp/jwt-secret'
);
```

## Security Best Practices

### Current Implementation (Acceptable for MVP)
✅ Auto-generated on deployment  
✅ Cryptographically secure (32 random bytes)  
✅ Unique per deployment  
⚠️ Changes on each deployment (logs users out)  
⚠️ Can't easily rotate or audit  

### Production Recommendations
1. **Use AWS Secrets Manager** for secret storage
2. **Enable automatic rotation** (e.g., every 90 days)
3. **Log secret access** for audit trail
4. **Use different secrets** per environment (dev/staging/prod)
5. **Never commit secrets** to version control
6. **Monitor for unauthorized access** via CloudWatch
7. **Implement gradual token migration** during secret rotation

## FAQ

### Q: Do I need to do anything for the app to work?
**A:** No! The current setup auto-generates secrets. Just deploy and it works.

### Q: Will users be logged out after I deploy?
**A:** Yes, with auto-generated secrets. Use a fixed secret to keep users logged in.

### Q: How do I set a fixed secret?
**A:** Export `JWT_SECRET` before deployment:
```bash
export JWT_SECRET="your-secret"
cdk deploy --all
```

### Q: Is the auto-generated secret secure?
**A:** Yes, it uses Node.js `crypto.randomBytes(32)` which is cryptographically secure.

### Q: Can I view the generated secret?
**A:** It's visible in Lambda environment variables in AWS Console, but changes on each deployment.

### Q: What happens if Lambda can't access JWT_SECRET?
**A:** It falls back to a default secret (dev only). This should never happen in production if CDK is used.

### Q: Should I add JWT_SECRET to GitHub Secrets?
**A:** Not required for current setup (auto-generates), but recommended for production to maintain consistency.

## Summary

| Aspect | Auto-Generated (Current) | Fixed Secret (Recommended for Prod) |
|--------|-------------------------|-------------------------------------|
| Setup Required | None ✅ | Manual 🔧 |
| Security | High ✅ | High ✅ |
| Users Logged Out on Deploy | Yes ⚠️ | No ✅ |
| Secret Rotation | Automatic (every deploy) | Manual 🔧 |
| Auditability | Low ⚠️ | High ✅ |
| CI/CD Complexity | Simple ✅ | Medium 🔧 |
| Best For | Development, MVP | Production |

**Current Status**: ✅ Ready to deploy with no additional configuration!

For production, consider implementing Option A (AWS Secrets Manager) for better secret management and user experience.

