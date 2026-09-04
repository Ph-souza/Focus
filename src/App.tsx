import { useState, useEffect } from 'react';
import { TabType, User, AppNotification, Transaction, ChatMessage, Task, Appointment } from './types';
import { Navigation } from './components/Navigation';
import { TabHome } from './components/TabHome';
import { TabTransactions } from './components/TabTransactions';
import { TabReports } from './components/TabReports';
import { TabGoals } from './components/TabGoals';
import { TabTasks } from './components/TabTasks';
import { TabChat } from './components/TabChat';
import { AuthScreen } from './components/AuthScreen';
import { ToastNotifications } from './components/ToastNotifications';
import { ProfileModal } from './components/ProfileModal';
import { FocusModeModal } from './components/FocusModeModal';
import { QuickChat } from './components/QuickChat';
import { SmartCaptureModal } from './components/SmartCaptureModal';
import { WhatsAppModal } from './components/WhatsAppModal';
import { auth, db, handleFirestoreError, OperationType, initAuth, getAccessToken, logoutWithScopes } from './lib/firebase';
import { collection, onSnapshot, query, orderBy, setDoc, doc, getDoc, where } from 'firebase/firestore';
import { MessageSquarePlus } from 'lucide-react';
import { subscribeToPushNotifications } from './lib/pushNotifications';
import { getApiUrl } from './lib/api';

import { injectMockData } from './lib/mockData';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [needsAuth, setNeedsAuth] = useState(true);
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

  useEffect(() => {
    const unsub = initAuth(
      async (firebaseUser, token) => {
        const googleName = firebaseUser.displayName || firebaseUser.providerData[0]?.displayName || 'Usuário';
        const googleEmail = firebaseUser.email || firebaseUser.providerData[0]?.email || '';
        const googlePhoto = firebaseUser.photoURL || firebaseUser.providerData[0]?.photoURL || undefined;

        setUser({
          id: firebaseUser.uid,
          name: googleName,
          email: googleEmail,
          photoURL: googlePhoto,
          isDemo: false
        });
        setNeedsAuth(false);
        setAuthChecking(false);

        // Ensure user document exists in root users collection with Google Auth info
        try {
          const docRef = doc(db, 'users', firebaseUser.uid);
          const docSnap = await getDoc(docRef);
          if (!docSnap.exists()) {
            await setDoc(docRef, {
              name: googleName,
              email: googleEmail,
              photoURL: googlePhoto || '',
              dateOfBirth: ''
            });
          } else {
            const data = docSnap.data();
            // Update Firestore doc to use real Google details if needed
            if (data?.name === 'Amanda Costa' || data?.name === 'Amanda Costa (Demo)' || (googlePhoto && data?.photoURL !== googlePhoto)) {
              await setDoc(docRef, {
                name: (data?.name === 'Amanda Costa' || data?.name === 'Amanda Costa (Demo)') ? googleName : (data?.name || googleName),
                email: googleEmail,
                photoURL: googlePhoto || data?.photoURL || ''
              }, { merge: true });
            }
          }
        } catch (err) {
          console.warn("Notice: could not sync user doc with Firestore (possibly offline or initializing):", err);
        }
      },
      () => {
        setUser((prev) => {
          if (prev?.isDemo) {
            setNeedsAuth(false);
            return prev;
          }
          setNeedsAuth(true);
          return null;
        });
        setAuthChecking(false);
      }
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;

    const unsubTxs = onSnapshot(collection(db, `users/${user.id}/transactions`), (snapshot) => {
      const txs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
      txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTransactions(txs);
    }, (error) => handleFirestoreError(error, OperationType.LIST, `users/${user.id}/transactions`));

    const unsubTasks = onSnapshot(collection(db, `users/${user.id}/tasks`), (snapshot) => {
      const dbTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
      dbTasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setTasks(dbTasks);
    }, (error) => handleFirestoreError(error, OperationType.LIST, `users/${user.id}/tasks`));

    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    const unsubChat = onSnapshot(query(
      collection(db, `users/${user.id}/chatMessages`), 
      where('timestamp', '>=', oneYearAgo.toISOString()),
      orderBy('timestamp', 'asc')
    ), (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage));
      setChatMessages(msgs);
    }, (error) => handleFirestoreError(error, OperationType.LIST, `users/${user.id}/chatMessages`));

    const unsubGoals = onSnapshot(collection(db, `users/${user.id}/goals`), (snapshot) => {
      const gs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setGoals(gs);
    }, (error) => handleFirestoreError(error, OperationType.LIST, `users/${user.id}/goals`));

    const unsubUser = onSnapshot(doc(db, `users/${user.id}`), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.name === 'Amanda Costa' || data.name === 'Amanda Costa (Demo)') {
          delete data.name;
          delete data.photoURL;
        }
        const currentGooglePhoto = auth.currentUser?.photoURL || auth.currentUser?.providerData[0]?.photoURL || undefined;
        const finalPhoto = currentGooglePhoto || data.photoURL;

        setUser(prev => prev ? { 
          ...prev, 
          ...data,
          photoURL: finalPhoto || prev?.photoURL || ''
        } : null);
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, `users/${user.id}`));

    const fetchGoogleCalendar = async () => {
      const token = await getAccessToken();
      if (!token) return [];
      
      try {
        const now = new Date();
        const startOfRange = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfRange = new Date(now.getFullYear(), now.getMonth() + 2, 0, 23, 59, 59);

        const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${startOfRange.toISOString()}&timeMax=${endOfRange.toISOString()}&singleEvents=true&orderBy=startTime`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) return [];
        const data = await res.json();
        
        return (data.items || []).map((item: any) => {
          const dateStr = item.start?.dateTime || item.start?.date;
          const dt = new Date(dateStr);
          return {
            id: item.id,
            title: item.summary || 'Evento',
            time: item.start?.dateTime ? dt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'O Dia Todo',
            type: 'Google Calendar',
            day: dt.getDate(),
            date: dt.toISOString()
          } as Appointment;
        });
      } catch (err) {
        console.error('Failed to fetch google calendar', err);
        return [];
      }
    };

    const unsubAppointments = onSnapshot(collection(db, `users/${user.id}/appointments`), async (snapshot) => {
      const dbApts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
      const gcalApts = await fetchGoogleCalendar();
      setAppointments([...dbApts, ...gcalApts]);
    }, (error) => handleFirestoreError(error, OperationType.LIST, `users/${user.id}/appointments`));

    return () => {
      unsubTxs();
      unsubTasks();
      unsubChat();
      unsubGoals();
      unsubUser();
      unsubAppointments();
    };
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;
    
    // Subscribe to Web Push Notifications on login
    subscribeToPushNotifications();

    // Trigger Web Push instead of simple browser notifications
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
    
    // Check Goals nearing completion (e.g. >= 80%)
    goals.forEach(goal => {
      if (goal.targetAmount > 0) {
        const percent = (goal.currentAmount / goal.targetAmount) * 100;
        if (percent >= 80 && percent < 100) {
          const title = 'Meta Próxima! 🎉';
          const msg = `Sua caixinha "${goal.title}" atingiu ${percent.toFixed(0)}% do objetivo.`;
          newNotifications.push({ id: `goal-${goal.id}`, title, message: msg, type: 'success' });
        }
      }
    });

    // Check Tasks pending
    const pendingTasks = tasks.filter(t => !t.completed);
    if (pendingTasks.length > 0) {
      const topTask = pendingTasks[0];
      newNotifications.push({ 
        id: `task-${topTask.id}`, 
        title: 'Lembrete de Tarefa', 
        message: `Você tem a tarefa pendente: "${topTask.title}".`, 
        type: 'warning' 
      });
    }

    // Check Appointments today
    const currentDay = new Date().getDate();
    const aptsToday = appointments.filter(a => a.day === currentDay);
    if (aptsToday.length > 0) {
       const topApt = aptsToday[0];
       newNotifications.push({ 
        id: `apt-${topApt.id}`, 
        title: 'Compromisso Hoje', 
        message: `Você tem um compromisso "${topApt.title}" às ${topApt.time}.`, 
        type: 'info' 
      });
    }

    // Monthly Budget Alert verification
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const currentMonthTx = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    const monthlyExpenses = currentMonthTx.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const budgetLimit = 5000; // Example static limit or could come from user profile

    if (monthlyExpenses > budgetLimit * 0.8) {
      newNotifications.push({
        id: `budget-${currentMonth}-${currentYear}`,
        title: 'Alerta de Orçamento Mensal ⚠️',
        message: `Você já gastou R$ ${monthlyExpenses.toFixed(2)}, o que representa mais de 80% do seu limite estipulado.`,
        type: 'warning'
      });
    }

    setNotifications(prev => {
      const addedNotifs = newNotifications.filter(nn => !prev.some(pn => pn.id === nn.id));
      
      addedNotifs.forEach(an => {
        // Send Web Push instead of old window.Notification
        triggerWebPush(an.title, an.message);
      });

      return [...prev, ...addedNotifs];
    });

  }, [user, goals, tasks, appointments, transactions]);

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter(n => n.id !== id));
  };

  const handleLoginUser = (newUser: User) => {
    setUser(newUser);
    setNeedsAuth(false);
    if (newUser.isDemo) {
      injectMockData(newUser.id).catch((err) => {
        console.warn("Demo mode mock data notice:", err);
      });
    }
  };

  const handleLogout = async () => {
    setIsProfileModalOpen(false);
    try {
      await logoutWithScopes();
    } catch (e) {
      console.error("Logout error", e);
    }
    setUser(null);
    setNeedsAuth(true);
  };

  const handleSwitchToRealAccount = async () => {
    setIsProfileModalOpen(false);
    try {
      await logoutWithScopes();
    } catch (e) {
      console.error("Logout error", e);
    }
    setUser(null);
    setNeedsAuth(true);
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

  if (authChecking) {
    return <div className="min-h-screen flex items-center justify-center bg-[#09090b]"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (!user || needsAuth) {
    return <AuthScreen onLogin={handleLoginUser} />;
  }

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
