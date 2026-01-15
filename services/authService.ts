import { User } from '../types';
import { recordUserLogin, verifyUserCredentials } from './userService';
import { logActivity } from './activityService';

export const login = async (email: string, password: string): Promise<User> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));

  // Verify credentials against the mock database
  const validUser = await verifyUserCredentials(email, password);

  if (validUser) {
    try {
        // Record login timestamp
        const updatedUser = await recordUserLogin(email);
        
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
  if (user) {
    await logActivity(user, 'LOGOUT', 'System', 'User logged out');
  }
  // Simulate cleanup
  await new Promise(resolve => setTimeout(resolve, 300));
};