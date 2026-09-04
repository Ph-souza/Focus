import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { TabType, User, AppNotification, Transaction, ChatMessage, Task, Appointment } from './types';
import { Navigation } from './components/Navigation';
import { TabHome } from './components/TabHome';
import { TabTransactions } from './components/TabTransactions';
import { TabReports } from './components/TabReports';
import { TabGoals } from './components/TabGoals';
import { TabTasks } from './components/TabTasks';
import { TabChat } from './components/TabChat';
import { ToastNotifications } from './components/ToastNotifications';
import { ProfileModal } from './components/ProfileModal';
import { FocusModeModal } from './components/FocusModeModal';
import { QuickChat } from './components/QuickChat';
import { SmartCaptureModal } from './components/SmartCaptureModal';
import { WhatsAppModal } from './components/WhatsAppModal';
import { db, handleFirestoreError, OperationType } from './lib/firebase';
import { collection, onSnapshot, query, orderBy, setDoc, doc, getDoc, where } from 'firebase/firestore';
import { subscribeToPushNotifications } from './lib/pushNotifications';
import { getApiUrl } from './lib/api';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginScreen } from './components/LoginScreen';
import { CheckoutScreen } from './components/CheckoutScreen';

function Dashboard() {
  const { currentUser, logout } = useAuth();

  const user: User = {
    id: currentUser?.uid || '',
    name: currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Usuário',
    email: currentUser?.email || '',
    photoURL: currentUser?.photoURL || undefined,
    isDemo: false
  };

  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isFocusModeOpen, setIsFocusModeOpen] = useState(false);
  const [isSmartCaptureOpen, setIsSmartCaptureOpen] = useState(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [initialChatPrompt, setInitialChatPrompt] = useState<{ text: string, imageBase64?: string, mimeType?: string } | null>(null);
  const [latestMentorFeedback, setLatestMentorFeedback] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('nexus_latest_mentor_feedback');
    }
    return null;
  });

  const handleSaveMentorFeedback = (feedback: string) => {
    setLatestMentorFeedback(feedback);
    if (typeof window !== 'undefined') {
      localStorage.setItem('nexus_latest_mentor_feedback', feedback);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission();
      }
    }
  }, []);

  // Sync Google User details to Firestore doc
  useEffect(() => {
    if (!currentUser) return;
    const syncUserProfile = async () => {
      try {
        const docRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(docRef);
        const googleName = currentUser.displayName || 'Usuário';
        const googleEmail = currentUser.email || '';
        const googlePhoto = currentUser.photoURL || '';

        if (!docSnap.exists()) {
          await setDoc(docRef, {
            name: googleName,
            email: googleEmail,
            photoURL: googlePhoto,
            dateOfBirth: ''
          }, { merge: true });
        } else {
          const data = docSnap.data();
          if (googlePhoto && data?.photoURL !== googlePhoto) {
            await setDoc(docRef, {
              photoURL: googlePhoto
            }, { merge: true });
          }
        }
      } catch (err) {
        console.warn('Notice syncing user profile to Firestore:', err);
      }
    };
    syncUserProfile();
  }, [currentUser]);

  // Firestore Subscriptions
  useEffect(() => {
    if (!user.id) return;

    // 1. Transactions Listener
    const transQuery = query(
      collection(db, 'users', user.id, 'transactions'),
      orderBy('date', 'desc')
    );
    const unsubTrans = onSnapshot(transQuery, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Transaction));
      setTransactions(docs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.id}/transactions`);
    });

    // 2. Goals Listener
    const goalsQuery = query(collection(db, 'users', user.id, 'goals'));
    const unsubGoals = onSnapshot(goalsQuery, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setGoals(docs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.id}/goals`);
    });

    // 3. Tasks Listener
    const tasksQuery = query(collection(db, 'users', user.id, 'tasks'), orderBy('createdAt', 'desc'));
    const unsubTasks = onSnapshot(tasksQuery, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Task));
      setTasks(docs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.id}/tasks`);
    });

    // 4. Chat Messages Listener
    const chatQuery = query(collection(db, 'users', user.id, 'chatMessages'), orderBy('timestamp', 'asc'));
    const unsubChat = onSnapshot(chatQuery, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ChatMessage));
      setChatMessages(docs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.id}/chatMessages`);
    });

    // 5. Appointments Listener
    const appointmentsQuery = query(collection(db, 'users', user.id, 'appointments'), orderBy('createdAt', 'desc'));
    const unsubAppointments = onSnapshot(appointmentsQuery, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Appointment));
      setAppointments(docs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.id}/appointments`);
    });

    return () => {
      unsubTrans();
      unsubGoals();
      unsubTasks();
      unsubChat();
      unsubAppointments();
    };
  }, [user.id]);

  // Notifications & Push Trigger
  useEffect(() => {
    if (!user.id) return;
    
    subscribeToPushNotifications();

    const triggerWebPush = async (title: string, body: string, url: string = '/') => {
      try {
        await fetch(getApiUrl('/api/notifications/send'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, body, url })
        });
      } catch (err) {
        console.error('Failed to trigger web push', err);
      }
    };
    
    const newNotifications: AppNotification[] = [];
    
    // Check overdue/upcoming tasks
    const today = new Date().toISOString().split('T')[0];
    tasks.filter(t => !t.completed && t.deadline).forEach(t => {
      if (t.deadline! < today) {
        newNotifications.push({
          id: `task-overdue-${t.id}`,
          title: 'Tarefa Atrasada',
          message: `A tarefa "${t.title}" venceu em ${t.deadline}.`,
          type: 'warning',
          read: false,
          date: new Date().toISOString()
        });
      } else if (t.deadline === today) {
        newNotifications.push({
          id: `task-today-${t.id}`,
          title: 'Vence Hoje',
          message: `A tarefa "${t.title}" vence hoje!`,
          type: 'info',
          read: false,
          date: new Date().toISOString()
        });
      }
    });

    // Check budget limit alert
    const currentMonth = new Date().toISOString().substring(0, 7);
    const monthlyExpenses = transactions
      .filter(t => t.type === 'expense' && t.date.startsWith(currentMonth))
      .reduce((sum, t) => sum + t.amount, 0);

    const savedBudget = localStorage.getItem('nexus_monthly_budget');
    const budgetLimit = savedBudget ? parseFloat(savedBudget) : 3500;

    if (monthlyExpenses > budgetLimit) {
      newNotifications.push({
        id: `budget-exceeded-${currentMonth}`,
        title: 'Orçamento Ultrapassado',
        message: `Seus gastos este mês atingiram R$ ${monthlyExpenses.toFixed(2)}, excedendo o limite definido de R$ ${budgetLimit.toFixed(2)}.`,
        type: 'warning',
        read: false,
        date: new Date().toISOString()
      });
    }

    setNotifications(prev => {
      const existingIds = new Set(prev.map(p => p.id));
      const addedNotifs = newNotifications.filter(n => !existingIds.has(n.id));
      if (addedNotifs.length === 0) return prev;
      
      addedNotifs.forEach(an => {
        triggerWebPush(an.title, an.message);
      });

      return [...prev, ...addedNotifs];
    });

  }, [user.id, goals, tasks, appointments, transactions]);

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter(n => n.id !== id));
  };

  const handleLogout = async () => {
    setIsProfileModalOpen(false);
    await logout();
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <TabHome transactions={transactions} goals={goals} tasks={tasks} onTabChange={setActiveTab} user={user} onOpenProfile={() => setIsProfileModalOpen(true)} onOpenWhatsApp={() => setIsWhatsAppModalOpen(true)} latestMentorFeedback={latestMentorFeedback} />;
      case 'transactions':
        return <TabTransactions transactions={transactions} setTransactions={setTransactions} user={user} />;
      case 'reports':
        return <TabReports transactions={transactions} />;
      case 'goals':
        return <TabGoals goals={goals} user={user} />;
      case 'tasks':
        return <TabTasks tasks={tasks} setTasks={setTasks} user={user} />;
      case 'chat':
        return <TabChat messages={chatMessages} setMessages={setChatMessages} transactions={transactions} tasks={tasks} setTasks={setTasks} onTabChange={setActiveTab} user={user} initialPrompt={initialChatPrompt} onPromptHandled={() => setInitialChatPrompt(null)} />;
      default:
        return <TabHome transactions={transactions} goals={goals} tasks={tasks} onTabChange={setActiveTab} user={user} onOpenProfile={() => setIsProfileModalOpen(true)} onOpenWhatsApp={() => setIsWhatsAppModalOpen(true)} latestMentorFeedback={latestMentorFeedback} />;
    }
  };

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <div className={`flex h-screen overflow-hidden font-sans antialiased pb-[68px] md:pb-0`}>
      <ToastNotifications notifications={notifications} onDismiss={dismissNotification} />
      <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} user={user} onLogout={handleLogout} />
      <WhatsAppModal isOpen={isWhatsAppModalOpen} onClose={() => setIsWhatsAppModalOpen(false)} user={user} />
      <FocusModeModal 
        isOpen={isFocusModeOpen} 
        onClose={() => setIsFocusModeOpen(false)} 
        tasks={tasks} 
        setTasks={setTasks} 
        user={user} 
        onFeedbackGenerated={handleSaveMentorFeedback}
      />
      <SmartCaptureModal 
        isOpen={isSmartCaptureOpen} 
        onClose={() => setIsSmartCaptureOpen(false)} 
        onSubmit={async (text, imageBase64, mimeType) => {
          setInitialChatPrompt({ text, imageBase64, mimeType });
          setIsSmartCaptureOpen(false);
          setActiveTab('chat');
        }} 
      />
      <Navigation 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        user={user} 
        isDarkMode={isDarkMode} 
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)} 
        onOpenProfile={() => setIsProfileModalOpen(true)} 
        appointments={appointments} 
        tasks={tasks}
        onOpenFocusMode={() => setIsFocusModeOpen(true)}
        onOpenSmartCapture={() => setIsSmartCaptureOpen(true)}
      />
      
      <main className="flex-1 overflow-y-auto px-4 py-6 md:p-8">
        <div className="w-full max-w-[1536px] mx-auto border-transparent">
          {renderContent()}
        </div>
      </main>

      {activeTab !== 'chat' && (
        <QuickChat user={user} onOpenFullChat={() => setActiveTab('chat')} activeTab={activeTab} transactions={transactions} tasks={tasks} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/checkout" element={<CheckoutScreen />} />
          <Route
            path="/dashboard/*"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          {/* Fallback inteligente: redireciona para o dashboard que valida as regras de acesso */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
