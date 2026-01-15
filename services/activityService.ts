import { ActivityLog, User } from '../types';
import { supabase } from '../lib/supabaseClient';

export const getActivityLogs = async (): Promise<ActivityLog[]> => {
  const { data, error } = await supabase
    .from('activity_logs')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(500);

  if (error) {
    console.error(error);
    return [];
  }

  // Map snake_case DB to camelCase Types
  return data.map((log: any) => ({
    id: log.id,
    userId: log.user_id,
    userName: log.user_name,
    userRole: log.user_role,
    action: log.action,
    target: log.target,
    details: log.details,
    timestamp: log.timestamp
  }));
};

export const logActivity = async (
  user: User, 
  action: ActivityLog['action'], 
  target: string, 
  details: string
): Promise<void> => {
  
  const { error } = await supabase
    .from('activity_logs')
    .insert([{
      user_id: user.id,
      user_name: user.name,
      user_role: user.role,
      action,
      target,
      details,
      timestamp: new Date().toISOString()
    }]);

  if (error) console.error("Failed to log activity", error);
};
