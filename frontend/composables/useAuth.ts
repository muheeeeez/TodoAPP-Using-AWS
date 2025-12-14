import { CognitoUserPool, CognitoUser, AuthenticationDetails, CognitoUserAttribute } from 'amazon-cognito-identity-js';
import { useAuthStore } from '~/stores/auth';

export const useAuth = () => {
  const config = useRuntimeConfig();
  const authStore = useAuthStore();
  const router = useRouter();

  const userPoolId = computed(() => config.public.cognitoUserPoolId);
  const clientId = computed(() => config.public.cognitoClientId);

  // Initialize Cognito User Pool
  const getUserPool = () => {
    if (!userPoolId.value || !clientId.value) {
      throw new Error('Cognito configuration is missing. Please check your environment variables.');
    }
    return new CognitoUserPool({
      UserPoolId: userPoolId.value,
      ClientId: clientId.value,
    });
  };

  // Sign up
  const signUp = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const userPool = getUserPool();

      const attributeList = [
        new CognitoUserAttribute({
          Name: 'email',
          Value: email,
        }),
      ];

      return new Promise((resolve, reject) => {
        userPool.signUp(email, password, attributeList, [], (err, result) => {
          if (err) {
            // Handle specific Cognito errors
            let errorMessage = 'Failed to create account';
            if (err.code === 'UsernameExistsException') {
              errorMessage = 'An account with this email already exists';
            } else if (err.code === 'InvalidPasswordException') {
              errorMessage = 'Password does not meet requirements';
            } else if (err.message) {
              errorMessage = err.message;
            }
            reject(new Error(errorMessage));
            return;
          }

          if (result) {
            // User created successfully, but needs to verify email
            // In production, Cognito will send verification email
            resolve({
              success: true,
              message: 'Account created! Please check your email to verify your account.',
            });
          }
        });
      });
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create account');
    }
  };

  // Sign in
  const signIn = async (email: string, password: string): Promise<{ success: boolean }> => {
    try {
      const userPool = getUserPool();

      const authenticationDetails = new AuthenticationDetails({
        Username: email,
        Password: password,
      });

      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: userPool,
      });

      return new Promise((resolve, reject) => {
        cognitoUser.authenticateUser(authenticationDetails, {
          onSuccess: (result) => {
            const idToken = result.getIdToken().getJwtToken();
            const accessToken = result.getAccessToken().getJwtToken();
            
            // Extract user ID from ID token
            const payload = JSON.parse(atob(idToken.split('.')[1]));
            const userId = payload.sub; // Cognito user ID (sub claim)
            const userEmail = payload.email || email;

            // Store tokens and user info
            authStore.setToken(idToken); // Use ID token for API Gateway
            authStore.setUser({
              email: userEmail,
              userId: userId,
            });

            resolve({ success: true });
          },
          onFailure: (err) => {
            let errorMessage = 'Failed to sign in';
            if (err.code === 'NotAuthorizedException') {
              errorMessage = 'Incorrect email or password';
            } else if (err.code === 'UserNotConfirmedException') {
              errorMessage = 'Please verify your email before signing in';
            } else if (err.message) {
              errorMessage = err.message;
            }
            reject(new Error(errorMessage));
          },
          newPasswordRequired: (userAttributes, requiredAttributes) => {
            // Handle new password required (first time login after admin creation)
            reject(new Error('New password required. Please contact support.'));
          },
        });
      });
    } catch (error: any) {
      throw new Error(error.message || 'Failed to sign in');
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      const userPool = getUserPool();
      const cognitoUser = userPool.getCurrentUser();
      
      if (cognitoUser) {
        cognitoUser.signOut();
      }
      
      // Clear Cognito localStorage (Cognito stores session data there)
      if (typeof window !== 'undefined') {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.startsWith('CognitoIdentityServiceProvider')) {
            localStorage.removeItem(key);
          }
        });
      }
      
      // Clear our auth state
      authStore.clearAuth();
      
      // Redirect to login
      await router.push('/auth/login');
    } catch (error) {
      // Even if sign out fails, clear local auth state and Cognito storage
      if (typeof window !== 'undefined') {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.startsWith('CognitoIdentityServiceProvider')) {
            localStorage.removeItem(key);
          }
        });
      }
      authStore.clearAuth();
      await router.push('/auth/login');
    }
  };

  // Check current session and restore if valid
  const checkSession = async (): Promise<boolean> => {
    try {
      // If no Cognito config, don't try to check session
      if (!userPoolId.value || !clientId.value) {
        authStore.clearAuth();
        return false;
      }

      const userPool = getUserPool();
      const cognitoUser = userPool.getCurrentUser();

      if (!cognitoUser) {
        authStore.clearAuth();
        return false;
      }

      return new Promise((resolve) => {
        cognitoUser.getSession((err: Error | null, session: any) => {
          if (err || !session || !session.isValid()) {
            // Clear Cognito storage if session is invalid
            if (typeof window !== 'undefined') {
              const keys = Object.keys(localStorage);
              keys.forEach(key => {
                if (key.startsWith('CognitoIdentityServiceProvider')) {
                  localStorage.removeItem(key);
                }
              });
            }
            authStore.clearAuth();
            resolve(false);
            return;
          }

          // Restore session
          const idToken = session.getIdToken().getJwtToken();
          const payload = JSON.parse(atob(idToken.split('.')[1]));
          const userId = payload.sub;
          const userEmail = payload.email || '';

          authStore.setToken(idToken);
          authStore.setUser({
            email: userEmail,
            userId: userId,
          });

          resolve(true);
        });
      });
    } catch (error) {
      // Clear everything on error
      if (typeof window !== 'undefined') {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.startsWith('CognitoIdentityServiceProvider')) {
            localStorage.removeItem(key);
          }
        });
      }
      authStore.clearAuth();
      return false;
    }
  };

  // Check if user is authenticated
  const isAuthenticated = computed(() => authStore.isAuthenticated);

  return {
    signUp,
    signIn,
    signOut,
    checkSession,
    isAuthenticated,
    user: computed(() => authStore.user),
  };
};
