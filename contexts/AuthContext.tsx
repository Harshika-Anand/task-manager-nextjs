'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { UserProfile, LoginCredentials, RegisterCredentials, ApiResponse } from '@/types';

// Define the shape of our auth context
interface AuthContextType {
  // State
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Actions
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  register: (credentials: RegisterCredentials) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

// Create the context with default values
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Props for the AuthProvider component
interface AuthProviderProps {
  children: ReactNode;
}

// AuthProvider component that wraps our app
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Computed value - user is authenticated if user exists
  const isAuthenticated = !!user;

  // Function to get current user from API
  const refreshUser = async () => {
    try {
      console.log('🔄 Refreshing user data...');
      
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include', // Include cookies
      });

      console.log('Auth check response status:', response.status);

      if (response.ok) {
        const result: ApiResponse<UserProfile> = await response.json();
        console.log('Auth check result:', result);
        
        if (result.success && result.data) {
          setUser(result.data);
          console.log('✅ User data refreshed:', result.data.email);
        } else {
          console.log('❌ Auth check failed - no user data');
          setUser(null);
        }
      } else {
        console.log('❌ Auth check failed - response not ok:', response.status);
        setUser(null);
      }
    } catch (error) {
      console.error('❌ Error refreshing user:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Login function
  const login = async (credentials: LoginCredentials) => {
    try {
      console.log('🔐 Attempting login...');
      setIsLoading(true);

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(credentials),
      });

      const result: ApiResponse = await response.json();

      if (result.success && result.data) {
        setUser(result.data.user);
        console.log('✅ Login successful');
        return { success: true };
      } else {
        console.log('❌ Login failed:', result.error);
        return { success: false, error: result.error || 'Login failed' };
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (credentials: RegisterCredentials) => {
    try {
      console.log('📝 Attempting registration...');
      setIsLoading(true);

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const result: ApiResponse = await response.json();

      if (result.success) {
        console.log('✅ Registration successful');
        
        // After successful registration, automatically log in
        const loginResult = await login({
          email: credentials.email,
          password: credentials.password,
        });
        
        return loginResult;
      } else {
        console.log('❌ Registration failed:', result.error);
        return { success: false, error: result.error || 'Registration failed' };
      }
    } catch (error) {
      console.error('❌ Registration error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      console.log('🚪 Logging out...');
      setIsLoading(true);

      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      setUser(null);
      console.log('✅ Logout successful');
    } catch (error) {
      console.error('❌ Logout error:', error);
      // Even if the API call fails, clear the local state
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Check for existing session on app load
  useEffect(() => {
    refreshUser();
  }, []);

  // Context value object
  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}