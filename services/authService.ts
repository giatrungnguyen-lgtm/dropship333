
import { User, UserRole, UserStatus } from '../types';

const USERS_KEY = 'ds_manager_users';
const CURRENT_USER_KEY = 'ds_manager_current_user';

const DEFAULT_PERMISSIONS = ['dashboard', 'orders', 'products', 'reports', 'ai'];

// Initial admin user if none exists
const INITIAL_USERS: User[] = [
  {
    id: 'u-admin',
    email: 'admin@dropship.com',
    fullName: 'Quản trị viên',
    role: UserRole.ADMIN,
    status: UserStatus.APPROVED,
    createdAt: new Date().toISOString(),
    permissions: ['dashboard', 'orders', 'products', 'reports', 'ai', 'users']
  }
];

export const getStoredUsers = (): User[] => {
  const stored = localStorage.getItem(USERS_KEY);
  if (!stored) {
    localStorage.setItem(USERS_KEY, JSON.stringify(INITIAL_USERS));
    return INITIAL_USERS;
  }
  return JSON.parse(stored);
};

export const saveUsers = (users: User[]) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const registerUser = (email: string, fullName: string, role: UserRole = UserRole.PARTNER): User | string => {
  const users = getStoredUsers();
  if (users.find(u => u.email === email)) {
    return "Email đã tồn tại trong hệ thống.";
  }

  const newUser: User = {
    id: `u-${Math.floor(Math.random() * 10000)}`,
    email,
    fullName,
    role,
    status: UserStatus.PENDING,
    createdAt: new Date().toISOString(),
    permissions: role === UserRole.ADMIN ? [...DEFAULT_PERMISSIONS, 'users'] : [...DEFAULT_PERMISSIONS]
  };

  const updatedUsers = [...users, newUser];
  saveUsers(updatedUsers);
  return newUser;
};

export const loginUser = (email: string): User | string => {
  const users = getStoredUsers();
  const user = users.find(u => u.email === email.toLowerCase());
  
  if (!user) return "Không tìm thấy tài khoản với email này.";
  if (user.status === UserStatus.BLOCKED) return "Tài khoản của bạn đã bị khóa.";
  if (user.status === UserStatus.PENDING) return "PENDING_APPROVAL"; // Special flag for the UI
  
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  return user;
};

export const getCurrentUser = (): User | null => {
  const stored = localStorage.getItem(CURRENT_USER_KEY);
  return stored ? JSON.parse(stored) : null;
};

export const logoutUser = () => {
  localStorage.removeItem(CURRENT_USER_KEY);
};

export const updateUserStatus = (userId: string, status: UserStatus) => {
  const users = getStoredUsers();
  const updated = users.map(u => u.id === userId ? { ...u, status } : u);
  saveUsers(updated);
};

export const deleteUser = (userId: string) => {
  const users = getStoredUsers();
  const updated = users.filter(u => u.id !== userId);
  saveUsers(updated);
};
