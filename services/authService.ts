import { User } from '../types';
import { recordUserLogin, verifyUserCredentials, getUserById } from './userService';
import { logActivity } from './activityService';

const STORAGE_KEY = 'problem_log_session';

export const login = async (email: string, password: string): Promise<User> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));

  // Verify credentials against the mock database
  const validUser = await verifyUserCredentials(email, password);

  if (validUser) {
    try {
        // Record login timestamp
        const updatedUser = await recordUserLogin(email);
        
        // Persist session to local storage
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));

        // Log Activity
        await logActivity(updatedUser, 'LOGIN', 'System', 'User logged in successfully');
        
        return updatedUser;
    } catch (e) {
        return validUser;
    }
  }
  
  throw new Error('Email atau password salah. (Default: admin@problemlog.com / password)');
};

export const logout = async (user?: User): Promise<void> => {
  // Clear persistence
  localStorage.removeItem(STORAGE_KEY);

  if (user) {
    await logActivity(user, 'LOGOUT', 'System', 'User logged out');
  }
  // Simulate cleanup
  await new Promise(resolve => setTimeout(resolve, 300));
};

export const restoreSession = async (): Promise<User | null> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored);
    if (!parsed || !parsed.id) return null;

    // Verify user still exists in DB and get latest data (permissions/role might have changed)
    const freshUser = await getUserById(parsed.id);
    
    if (freshUser) {
       // Update local storage with fresh data
       localStorage.setItem(STORAGE_KEY, JSON.stringify(freshUser));
       return freshUser;
    }
    
    // If user not found in DB (deleted), clear storage
    localStorage.removeItem(STORAGE_KEY);
    return null;
  } catch (e) {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
};