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

