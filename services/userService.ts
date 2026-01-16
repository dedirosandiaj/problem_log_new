import { User } from '../types';
import { supabase } from '../lib/supabaseClient';

export const getUsers = async (): Promise<User[]> => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('name');
  
  if (error) throw error;
  
  // Mapping DB columns to User type (snake_case to camelCase if needed)
  return data.map((u: any) => ({
    ...u,
    lastLogin: u.last_login, // Map from DB column
    permissions: u.permissions || []
  }));
};

export const getUserById = async (id: string): Promise<User | null> => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error || !data) return null;

  return {
    ...data,
    lastLogin: data.last_login,
    permissions: data.permissions || []
  };
};

export const createUser = async (userData: any): Promise<User> => {
  const { password, ...rest } = userData;
  
  const { data, error } = await supabase
    .from('users')
    .insert([{
      name: userData.name,
      email: userData.email,
      password: password || 'password123',
      role: userData.role,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=random`,
      permissions: userData.permissions,
      last_login: null
    }])
    .select()
    .single();

  if (error) throw error;
  
  return {
    ...data,
    lastLogin: data.last_login
  };
};

export const updateUser = async (id: string, userData: any): Promise<User> => {
  const updates: any = {
    name: userData.name,
    email: userData.email,
    role: userData.role,
    permissions: userData.permissions
  };

  if (userData.password) {
    updates.password = userData.password;
  }
  
  // Update avatar if name changes
  if (userData.name) {
    updates.avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=random`;
  }

  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  return {
    ...data,
    lastLogin: data.last_login
  };
};

export const deleteUser = async (id: string): Promise<void> => {
  const { error } = await supabase.from('users').delete().eq('id', id);
  if (error) throw error;
};

export const recordUserLogin = async (email: string): Promise<User> => {
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('users')
      .update({ last_login: now })
      .eq('email', email)
      .select()
      .single();

    if (error) throw error;
    
    return {
        ...data,
        lastLogin: data.last_login
    };
};

export const verifyUserCredentials = async (email: string, passwordInput: string): Promise<User | null> => {
    // Note: In a real app, use supabase.auth.signInWithPassword or bcrypt hash check
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('password', passwordInput)
      .single();
    
    if (error || !data) return null;

    return {
        ...data,
        lastLogin: data.last_login
    };
};