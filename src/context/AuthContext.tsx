import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types/index.ts';
import { api, getStoredToken, setStoredToken, clearStoredToken } from '../services/api.ts';

interface AuthContextType {
  user: User | null;
  role: Role;
  token: string;
  loading: boolean;
  switchRole: (targetRole: Role) => Promise<void>;
  loginAdmin: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string>(getStoredToken());
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchCurrentUser = async () => {
    try {
      setLoading(true);
      const res = await api.getMe();
      if (res.user) {
        setUser(res.user);
      } else {
        // Default to student user
        setUser({
          id: 'usr-student-01',
          name: 'Alex Rivera',
          email: 'alex.rivera@college.edu',
          role: 'student',
          semester: 6,
          department: 'Computer Science & Engineering',
        });
      }
    } catch {
      // In case of error, default to student role
      setUser({
        id: 'usr-student-01',
        name: 'Alex Rivera',
        email: 'alex.rivera@college.edu',
        role: 'student',
        semester: 6,
        department: 'Computer Science & Engineering',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, [token]);

  const switchRole = async (targetRole: Role) => {
    if (targetRole === 'student') {
      try {
        setLoading(true);
        const res = await api.login({ role: 'student' });
        setStoredToken(res.token);
        setToken(res.token);
        setUser(res.user);
      } catch (err) {
        console.error('Role switch failed:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const loginAdmin = async (email: string, password: string) => {
    try {
      setLoading(true);
      const res = await api.login({ role: 'admin', email, password });
      setStoredToken(res.token);
      setToken(res.token);
      setUser(res.user);
    } catch (err: any) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    // Return to student session
    clearStoredToken();
    setStoredToken('student-token-22k1');
    setToken('student-token-22k1');
    setUser({
      id: 'usr-student-01',
      name: 'Alex Rivera',
      email: 'alex.rivera@college.edu',
      role: 'student',
      semester: 6,
      department: 'Computer Science & Engineering',
    });
  };

  const role: Role = user?.role || 'student';

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        token,
        loading,
        switchRole,
        loginAdmin,
        logout,
        refreshUser: fetchCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
