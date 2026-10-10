import { useAccountStorage } from './hooks/useAccountStorage';
import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { TabType, User, AppNotification, Transaction, ChatMessage, Task, Appointment, Rotina } from './types';
import { Navigation } from './components/Navigation';
import { TabHome } from './components/TabHome';
import { TabTransactions } from './components/TabTransactions';
import { TabReports } from './components/TabReports';
import { TabGoals } from './components/TabGoals';
import { TabChat } from './components/TabChat';
import { TabMore } from './components/TabMore';
import { TabCalendar } from './components/TabCalendar';
import { TabProjetos } from './components/TabProjetos';
import { TabFocus } from './components/TabFocus';
import { TabFinances } from './components/TabFinances';
import { TabHelp } from './components/TabHelp';
import { ToastNotifications } from './components/ToastNotifications';
import { ProfileModal } from './components/ProfileModal';
import { FocusModeModal } from './components/FocusModeModal';
import { QuickChat } from './components/QuickChat';
import { SmartCaptureModal } from './components/SmartCaptureModal';
import { WhatsAppModal } from './components/WhatsAppModal';
import { db, auth, handleFirestoreError, OperationType } from './lib/firebase';
import { collection, onSnapshot, query, orderBy, doc, where, limit } from 'firebase/firestore';
import { subscribeToPushNotifications } from './lib/pushNotifications';
import { getApiUrl } from './lib/api';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginScreen } from './components/LoginScreen';
import { CheckoutScreen } from './components/CheckoutScreen';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { TermsOfUse } from './components/TermsOfUse';
import { LandingPage } from './components/LandingPage';
import { ImportModule } from './components/ImportModule';
import { WelcomeOverlay } from './components/WelcomeOverlay';
import { AdminPanel } from './components/AdminPanel';
import PainelPage from './app/painel/page';
import { AdminProtectedRoute } from './components/AdminProtectedRoute';
import { RootRoute } from './components/RootRoute';

function Dashboard() {
  const accountStorage = useAccountStorage();
  const { currentUser, logout } = useAuth();

  const [userProfile, setUserProfile] = useState<{
    name?: string;
    dateOfBirth?: string;
    photoURL?: string;
    whatsappNumber?: string;
    iosShortcutToken?: string;
  }>({});

  // 1. Perfil do Usuário com validação direta de auth.currentUser.uid
  useEffect(() => {
    const activeUid = currentUser?.uid;
    if (!activeUid) {
      setUserProfile({});
      return;
    }

    const unsub = onSnapshot(doc(db, 'users', activeUid), (docSnap) => {
      // Aborta imediatamente se o usuário ativo mudou
      if (auth.currentUser?.uid !== activeUid) return;
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserProfile({
          name: data.name,
          dateOfBirth: data.dateOfBirth,
          photoURL: data.photoURL,
          whatsappNumber: data.whatsappNumber || data.whatsappFormatted,
          iosShortcutToken: data.iosShortcutToken
        });
      }
    }, (error) => {
      console.warn('Notice user profile snapshot error:', error);
    });

    return () => {
      unsub();
      setUserProfile({});
    };
  }, [currentUser?.uid]);

  const activeAuthUid = currentUser?.uid || '';

  const user: User = {
    id: activeAuthUid,
    name: userProfile.name || currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Usuário',
    email: currentUser?.email || '',
    photoURL: userProfile.photoURL || currentUser?.photoURL || undefined,
    dateOfBirth: userProfile.dateOfBirth || '',
    whatsappNumber: userProfile.whatsappNumber || '',
    iosShortcutToken: userProfile.iosShortcutToken || '',
    isDemo: false
  };

  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [rotinas, setRotinas] = useState<Rotina[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nexus_dark_mode');
      if (saved !== null) return saved === 'true';
    }
    return true;
  });
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isFocusModeOpen, setIsFocusModeOpen] = useState(false);
  const [isSmartCaptureOpen, setIsSmartCaptureOpen] = useState(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [initialChatPrompt, setInitialChatPrompt] = useState<{ text: string, imageBase64?: string, mimeType?: string } | null>(null);
  const [latestMentorFeedback, setLatestMentorFeedback] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return accountStorage.getItem('nexus_latest_mentor_feedback');
    }
    return null;
  });

  const handleSaveMentorFeedback = (feedback: string) => {
    setLatestMentorFeedback(feedback);
    if (typeof window !== 'undefined') {
      accountStorage.setItem('nexus_latest_mentor_feedback', feedback);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission();
      }
    }
  }, []);


  // 2. ISOLAMENTO ESTRITO DE CONSULTAS (P0):
  // Todas as consultas dependem estritamente de auth.currentUser.uid no momento da chamada.
  // Se auth.currentUser for nulo, a requisição é sumariamente abortada e todo o estado purgado.
  useEffect(() => {
    const activeUid = currentUser?.uid;

    // Purga imediata de qualquer resíduo em memória da sessão anterior
    setTransactions([]);
    setGoals([]);
    setTasks([]);
    setChatMessages([]);
    setAppointments([]);
    setRotinas([]);
    setNotifications([]);

    if (!activeUid) {
      return;
    }

    // 1. Transactions Listener (Limit 5 mais recentes)
    const transQuery = query(
      collection(db, 'users', activeUid, 'transactions'),
      orderBy('date', 'desc'),
      limit(5)
    );
    const unsubTrans = onSnapshot(transQuery, (snapshot) => {
      if (auth.currentUser?.uid !== activeUid) return;
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Transaction));
      setTransactions(docs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${activeUid}/transactions`);
    });

    // 2. Goals Listener
    const goalsQuery = query(collection(db, 'users', activeUid, 'goals'));
    const unsubGoals = onSnapshot(goalsQuery, (snapshot) => {
      if (auth.currentUser?.uid !== activeUid) return;
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setGoals(docs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${activeUid}/goals`);
    });

    // 3. Tasks Listener (Limit 20)
    const tasksQuery = query(collection(db, 'users', activeUid, 'tasks'), orderBy('createdAt', 'desc'), limit(20));
    const unsubTasks = onSnapshot(tasksQuery, (snapshot) => {
      if (auth.currentUser?.uid !== activeUid) return;
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Task));
      setTasks(docs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${activeUid}/tasks`);
    });

    // 4. Chat Messages Listener
    const chatQuery = query(collection(db, 'users', activeUid, 'chatMessages'), orderBy('timestamp', 'asc'));
    const unsubChat = onSnapshot(chatQuery, (snapshot) => {
      if (auth.currentUser?.uid !== activeUid) return;
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ChatMessage));
      setChatMessages(docs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${activeUid}/chatMessages`);
    });

    // 5. Appointments Listener
    const appointmentsQuery = query(collection(db, 'users', activeUid, 'appointments'), orderBy('createdAt', 'desc'), limit(10));
    const unsubAppointments = onSnapshot(appointmentsQuery, (snapshot) => {
      if (auth.currentUser?.uid !== activeUid) return;
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Appointment));
      setAppointments(docs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${activeUid}/appointments`);
    });

    // 6. Rotinas Listener
    const rotinasQuery = query(collection(db, 'users', activeUid, 'rotinas'), orderBy('date', 'desc'), limit(5));
    const unsubRotinas = onSnapshot(rotinasQuery, (snapshot) => {
      if (auth.currentUser?.uid !== activeUid) return;
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Rotina));
      setRotinas(docs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${activeUid}/rotinas`);
    });

    return () => {
      unsubTrans();
      unsubGoals();
      unsubTasks();
      unsubChat();
      unsubAppointments();
      unsubRotinas();
      // Purga estrita na desmontagem do efeito
      setTransactions([]);
      setGoals([]);
      setTasks([]);
      setChatMessages([]);
      setAppointments([]);
      setRotinas([]);
    };
  }, [currentUser?.uid]);

  // Notifications & Push Trigger
  useEffect(() => {
    if (!user.id) return;
    
    subscribeToPushNotifications();

    const triggerWebPush = async (title: string, body: string, url: string = '/') => {
      try {
        const token = await auth.currentUser?.getIdToken();
        await fetch(getApiUrl('/api/notifications/send'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
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

    const savedBudget = accountStorage.getItem('nexus_monthly_budget');
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

  }, [user.id, goals, tasks, appointments, transactions, rotinas]);

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
        return <TabHome transactions={transactions} goals={goals} tasks={tasks} rotinas={rotinas} onTabChange={setActiveTab} user={user} onOpenProfile={() => setIsProfileModalOpen(true)} onOpenWhatsApp={() => setIsWhatsAppModalOpen(true)} latestMentorFeedback={latestMentorFeedback} />;
      case 'calendar':
        return <TabCalendar rotinas={rotinas} user={user} />;
      case 'projects':
        return <TabProjetos user={user} onTabChange={setActiveTab} />;
      case 'focus':
        return <TabFocus onTabChange={setActiveTab} />;
      case 'finances':
        return <TabFinances transactions={transactions} goals={goals} user={user} onTabChange={setActiveTab} />;
      case 'transactions':
        return <TabTransactions transactions={transactions} setTransactions={setTransactions} user={user} />;
      case 'reports':
        return <TabReports transactions={transactions} />;
      case 'goals':
        return <TabGoals goals={goals} user={user} />;
      case 'chat':
        return <TabChat messages={chatMessages} setMessages={setChatMessages} transactions={transactions} tasks={tasks} setTasks={setTasks} onTabChange={setActiveTab} user={user} initialPrompt={initialChatPrompt} onPromptHandled={() => setInitialChatPrompt(null)} />;
      case 'more':
        return <TabMore user={user} onTabChange={setActiveTab} onOpenProfile={() => setIsProfileModalOpen(true)} onOpenWhatsApp={() => setIsWhatsAppModalOpen(true)} onToggleDarkMode={() => setIsDarkMode(!isDarkMode)} onLogout={handleLogout} isDarkMode={isDarkMode} />;
      case 'help':
        return <TabHelp />;
      default:
        return <TabHome transactions={transactions} goals={goals} tasks={tasks} rotinas={rotinas} onTabChange={setActiveTab} user={user} onOpenProfile={() => setIsProfileModalOpen(true)} onOpenWhatsApp={() => setIsWhatsAppModalOpen(true)} latestMentorFeedback={latestMentorFeedback} />;
    }
  };

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    if (isDarkMode) {
      root.classList.add('dark');
      body.classList.add('dark');
    } else {
      root.classList.remove('dark');
      body.classList.remove('dark');
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('nexus_dark_mode', isDarkMode ? 'true' : 'false');
    }
  }, [isDarkMode]);

  return (
    <div 
      className="flex h-screen overflow-hidden font-sans antialiased pb-[68px] md:pb-0 text-slate-900 dark:text-white transition-colors duration-300 bg-cover bg-center bg-fixed bg-no-repeat relative selection:bg-blue-500/30 selection:text-blue-500"
      style={{
        backgroundImage: isDarkMode ? "url('/assets/bg-dark.jpg')" : "url('/assets/bg-light.jpg')",
        backgroundColor: isDarkMode ? "#030712" : "#f1f5f9"
      }}
    >
      <ToastNotifications notifications={notifications} onDismiss={dismissNotification} />
      <WelcomeOverlay onStartTour={() => window.dispatchEvent(new CustomEvent('start-tour'))} />
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
      
      <main className="flex-1 overflow-y-auto px-4 pt-4 pb-24 md:p-8">
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
          <Route path="/" element={<RootRoute />} />
          <Route path="/homepage" element={<LandingPage />} />
          <Route path="/page" element={<Navigate to="/homepage" replace />} />
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/checkout" element={<CheckoutScreen />} />
          <Route path="/import" element={<ImportModule />} />
          <Route path="/privacidade" element={<PrivacyPolicy />} />
          <Route path="/termos" element={<TermsOfUse />} />
          <Route
            path="/painel"
            element={
              <AdminProtectedRoute>
                <PainelPage />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/dashboard/*"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          {/* Fallback inteligente: redireciona para a raiz onde o RootRoute avalia o destino */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
