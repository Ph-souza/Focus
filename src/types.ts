export type TransactionType = 'income' | 'expense' | 'investimento_meta' | 'receita' | 'despesa';

export type LedgerType = 'personal' | 'shared';
export type LedgerRole = 'owner' | 'guest';

export interface Ledger {
  id: string;
  type: LedgerType;
  role: LedgerRole;
  name?: string;
  sharedWith?: string;
  ownerEmail?: string;
  ownerName?: string;
  ownerUid?: string;
  members?: string[];
  createdAt?: string;
}

export interface FamilyInvite {
  id?: string;
  code: string;
  ledgerId: string;
  ownerUid: string;
  ownerName: string;
  ownerEmail: string;
  status: 'pending' | 'accepted' | 'expired';
  createdAt?: any;
  expiresAt?: any;
}

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  date: string;
  category?: string;
  metaId?: string; // Vincula a transação a uma meta específica
  description?: string;
  ledgerId?: string; // Vincula a transação a um cofre/ledger específico (Pessoal ou Familiar)
  isFamily?: boolean; // Flag contextual de gasto familiar/doméstico detectado pela IA
  addedBy?: string; // UID de quem adicionou a transação
}

export type Transacao = Transaction;

export interface Goal {
  id: string;
  title: string;
  currentAmount: number;
  targetAmount: number;
  icon?: string;
  valorAcumulado?: number; // Compatibilidade com atualização de meta
  ledgerId?: string; // Vincula a meta a um cofre específico
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

export interface Rotina {
  id: string;
  title: string;
  date: string;
  time: string;
  completed: boolean;
  createdAt?: any;
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: string;
}

export type TabType = 'home' | 'calendar' | 'projects' | 'focus' | 'finances' | 'transactions' | 'reports' | 'goals' | 'chat' | 'more' | 'help';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'info';
  read?: boolean;
  date?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  photoURL?: string;
  dateOfBirth?: string;
  monthlyBudget?: number;
  isDemo?: boolean;
  iosShortcutToken?: string;
  whatsappNumber?: string;
  ledgers?: Ledger[];
  activeLedgerId?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning';
}
