import { ActivityLog, User } from '../types';

// Mock Storage untuk Activity Logs
let MOCK_ACTIVITY_LOGS: ActivityLog[] = [
  {
    id: 'log-1',
    userId: '1',
    userName: 'Administrator',
    userRole: 'Super Admin',
    action: 'LOGIN',
    target: 'System',
    details: 'User logged in successfully',
    timestamp: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'log-2',
    userId: '1',
    userName: 'Administrator',
    userRole: 'Super Admin',
    action: 'VIEW',
    target: 'Dashboard',
    details: 'Accessed Dashboard Overview',
    timestamp: new Date(Date.now() - 3500000).toISOString()
  }
];

export const getActivityLogs = async (): Promise<ActivityLog[]> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  // Sort by newest first
  return [...MOCK_ACTIVITY_LOGS].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export const logActivity = async (
  user: User, 
  action: ActivityLog['action'], 
  target: string, 
  details: string
): Promise<void> => {
  const newLog: ActivityLog = {
    id: Math.random().toString(36).substr(2, 9),
    userId: user.id,
    userName: user.name,
    userRole: user.role,
    action,
    target,
    details,
    timestamp: new Date().toISOString()
  };

  // Add to beginning of array (simulating DB append, but we want newest fast access)
  MOCK_ACTIVITY_LOGS.unshift(newLog);
  
  // Keep logs at manageable size for this demo (e.g., max 500 logs)
  if (MOCK_ACTIVITY_LOGS.length > 500) {
    MOCK_ACTIVITY_LOGS = MOCK_ACTIVITY_LOGS.slice(0, 500);
  }
};