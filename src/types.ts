export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  date: string;
  category?: string;
}

export interface Goal {
  id: string;
  title: string;
  currentAmount: number;
  targetAmount: number;
  icon?: string;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  deadline?: string;
  description?: string;
  date?: string;
  time?: string;
  createdAt?: any;
}

export interface Appointment {
  id: string;
  title: string;
  time: string;
  type: string;
  day: number;
  date?: string;
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: string;
}

export type TabType = 'home' | 'transactions' | 'reports' | 'goals' | 'tasks' | 'chat';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'info';
}

export interface User {
  id: string;
  name: string;
  email: string;
  photoURL?: string;
  dateOfBirth?: string;
  monthlyBudget?: number;
  isDemo?: boolean;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning';
}
