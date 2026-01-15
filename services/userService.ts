
import { User, UserRole, MenuPermission } from '../types';

// Extend User type locally for mock database storage to include password
interface DbUser extends User {
  password?: string;
}

// Mock Database Data
// Password default untuk semua user adalah: 'password123' (kecuali admin)
let MOCK_USERS_DB: DbUser[] = [
  {
    id: '1',
    name: 'Administrator',
    email: 'admin@problemlog.com',
    role: UserRole.SUPERADMIN,
    avatar: 'https://ui-avatars.com/api/?name=Administrator&background=0ea5e9&color=fff',
    lastLogin: '-', 
    permissions: ['dashboard', 'users', 'reports', 'settings', 'locations', 'log_activity', 'mail', 'data_master', 'complaints'],
    password: 'password' // Default password for admin
  },
  {
    id: '2',
    name: 'Siti Aminah',
    email: 'siti@problemlog.com',
    role: UserRole.HELPDESK,
    avatar: 'https://ui-avatars.com/api/?name=Siti+Aminah&background=random',
    lastLogin: new Date(Date.now() - 86400000).toISOString(),
    permissions: ['dashboard', 'reports', 'mail', 'complaints'],
    password: 'password123'
  },
  {
    id: '3',
    name: 'Joko Widodo',
    email: 'joko@problemlog.com',
    role: UserRole.CASH_MANAGEMENT,
    avatar: 'https://ui-avatars.com/api/?name=Joko+Widodo&background=random',
    lastLogin: new Date(Date.now() - 172800000).toISOString(),
    permissions: ['dashboard', 'mail'],
    password: 'password123'
  },
  {
    id: '4',
    name: 'Rina Marlina',
    email: 'rina@problemlog.com',
    role: UserRole.TECHNICIAN,
    avatar: 'https://ui-avatars.com/api/?name=Rina+Marlina&background=random',
    lastLogin: new Date(Date.now() - 250000000).toISOString(),
    permissions: ['dashboard', 'mail'],
    password: 'password123'
  },
  {
    id: '5',
    name: 'Andi Pratama',
    email: 'andi@problemlog.com',
    role: UserRole.TECHNICIAN,
    avatar: 'https://ui-avatars.com/api/?name=Andi+Pratama&background=random',
    lastLogin: new Date(Date.now() - 400000).toISOString(),
    permissions: ['dashboard', 'mail'],
    password: 'password123'
  }
];

// Helper to sanitize user object (remove password) before returning to frontend
const sanitizeUser = (user: DbUser): User => {
  const { password, ...safeUser } = user;
  return safeUser;
};

export const getUsers = async (): Promise<User[]> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return MOCK_USERS_DB.map(sanitizeUser);
};

export const createUser = async (userData: Omit<User, 'id' | 'avatar' | 'lastLogin'> & { password?: string }): Promise<User> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const { password, ...userFields } = userData;

  const newUser: DbUser = {
    ...userFields,
    id: Math.random().toString(36).substr(2, 9),
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=random`,
    lastLogin: '-',
    password: password || 'password123' // Default if not provided
  };
  MOCK_USERS_DB.push(newUser);
  return sanitizeUser(newUser);
};

export const updateUser = async (id: string, data: Partial<User> & { password?: string }): Promise<User> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const index = MOCK_USERS_DB.findIndex(u => u.id === id);
  if (index === -1) throw new Error("User not found");
  
  // Extract password from data if exists
  const { password, ...otherData } = data;
  
  MOCK_USERS_DB[index] = { 
      ...MOCK_USERS_DB[index], 
      ...otherData 
  };

  // Only update password if provided and not empty
  if (password && password.trim() !== '') {
      MOCK_USERS_DB[index].password = password;
  }
  
  // Update avatar if name changes
  if (data.name) {
     MOCK_USERS_DB[index].avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=random`;
  }
  
  return sanitizeUser(MOCK_USERS_DB[index]);
};

export const recordUserLogin = async (email: string): Promise<User> => {
    const index = MOCK_USERS_DB.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
    if (index !== -1) {
        const now = new Date().toISOString();
        MOCK_USERS_DB[index] = {
            ...MOCK_USERS_DB[index],
            lastLogin: now
        };
        return sanitizeUser(MOCK_USERS_DB[index]);
    }
    throw new Error('User data not found for login recording');
};

// New function to verify credentials
export const verifyUserCredentials = async (email: string, passwordInput: string): Promise<User | null> => {
    const user = MOCK_USERS_DB.find(u => 
        u.email.toLowerCase() === email.toLowerCase() && 
        u.password === passwordInput
    );
    
    return user ? sanitizeUser(user) : null;
};

export const deleteUser = async (id: string): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  MOCK_USERS_DB = MOCK_USERS_DB.filter(u => u.id !== id);
};
