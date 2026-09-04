import { collection, doc, writeBatch, setDoc, serverTimestamp, getDocs, deleteDoc } from 'firebase/firestore';
import { db, auth } from './firebase';

export async function clearMockData(userId: string, realName: string = 'Usuário') {
  const collectionsToClear = [
    `users/${userId}/transactions`,
    `users/${userId}/goals`,
    `users/${userId}/tasks`,
    `users/${userId}/appointments`,
    `users/${userId}/chatMessages`
  ];

  for (const colPath of collectionsToClear) {
    try {
      const colRef = collection(db, colPath);
      const snapshot = await getDocs(colRef);
      const deletePromises = snapshot.docs.map(docSnap => deleteDoc(docSnap.ref));
      await Promise.all(deletePromises);
    } catch (err) {
      console.error(`Error clearing ${colPath}:`, err);
    }
  }

  try {
    const currentUser = auth.currentUser;
    const finalName = currentUser?.displayName || currentUser?.providerData[0]?.displayName || (realName !== 'Amanda Costa' ? realName : 'Usuário');
    const finalPhoto = currentUser?.photoURL || currentUser?.providerData[0]?.photoURL || '';
    const finalEmail = currentUser?.email || currentUser?.providerData[0]?.email || '';

    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      name: finalName,
      email: finalEmail,
      photoURL: finalPhoto,
      dateOfBirth: '',
      monthlyBudget: 0
    }, { merge: true });
  } catch (err) {
    console.error('Error resetting user document:', err);
  }
}

export async function injectMockData(userId: string) {
  // Clear old data first
  await clearMockData(userId, 'Amanda Costa');

  const batch = writeBatch(db);

  // 1. Update user profile to fictitious persona "Amanda Costa"
  const userRef = doc(db, 'users', userId);
  batch.set(userRef, {
    name: 'Amanda Costa',
    photoURL: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?fit=crop&w=150&h=150', // friendly professional photo
    dateOfBirth: '1992-05-15'
  }, { merge: true });

  // 2. Add some fictional goals
  const goalsRef = collection(db, `users/${userId}/goals`);
  const goals = [
    { title: 'Reserva de Emergência', targetAmount: 10000, currentAmount: 4500, deadline: '2026-12-31', color: '#10b981', icon: 'shield' },
    { title: 'Viagem para o Chile', targetAmount: 5000, currentAmount: 1200, deadline: '2026-10-15', color: '#3b82f6', icon: 'plane' },
    { title: 'Trocar o Notebook', targetAmount: 4500, currentAmount: 4500, deadline: '2026-05-10', color: '#8b5cf6', icon: 'laptop' }
  ];
  goals.forEach(g => {
    const docRef = doc(goalsRef);
    batch.set(docRef, { ...g, userId, createdAt: serverTimestamp(), updatedAt: serverTimestamp(), type: 'financial' });
  });

  // 3. Add transactions (Expenses and Income)
  const txRef = collection(db, `users/${userId}/transactions`);
  const thisMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const lastMonth = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 7);
  const twoMonthsAgo = new Date(new Date().setMonth(new Date().getMonth() - 2)).toISOString().slice(0, 7);
  const threeMonthsAgo = new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString().slice(0, 7);
  
  const transactions = [
    // Income
    { title: 'Salário (Empresa)', amount: 6500, type: 'income', category: 'salary', date: `${thisMonth}-05` },
    { title: 'Freelance Design', amount: 1500, type: 'income', category: 'freelance', date: `${thisMonth}-12` },
    { title: 'Salário (Empresa)', amount: 6500, type: 'income', category: 'salary', date: `${lastMonth}-05` },
    { title: 'Salário (Empresa)', amount: 6500, type: 'income', category: 'salary', date: `${twoMonthsAgo}-05` },
    { title: 'Bônus Anual', amount: 3200, type: 'income', category: 'freelance', date: `${twoMonthsAgo}-15` },
    { title: 'Salário (Empresa)', amount: 6500, type: 'income', category: 'salary', date: `${threeMonthsAgo}-05` },
    
    // Expenses this month
    { title: 'Aluguel apto', amount: 2200, type: 'expense', category: 'housing', date: `${thisMonth}-08` },
    { title: 'Conta de Energia', amount: 185.5, type: 'expense', category: 'bills', date: `${thisMonth}-10` },
    { title: 'Supermercado', amount: 650, type: 'expense', category: 'food', date: `${thisMonth}-11` },
    { title: 'Netflix', amount: 39.9, type: 'expense', category: 'entertainment', date: `${thisMonth}-02` },
    { title: 'Restaurante Fim de Semana', amount: 240, type: 'expense', category: 'food', date: `${thisMonth}-14` },
    { title: 'Academia', amount: 120, type: 'expense', category: 'health', date: `${thisMonth}-05` },
    { title: 'Uber', amount: 89, type: 'expense', category: 'transport', date: `${thisMonth}-15` },
    { title: 'Uber', amount: 45, type: 'expense', category: 'transport', date: `${thisMonth}-18` },
    
    // Expenses last month
    { title: 'Aluguel apto', amount: 2200, type: 'expense', category: 'housing', date: `${lastMonth}-08` },
    { title: 'Conta de Energia', amount: 195, type: 'expense', category: 'bills', date: `${lastMonth}-10` },
    { title: 'Supermercado', amount: 820, type: 'expense', category: 'food', date: `${lastMonth}-05` },
    { title: 'Voo Chile (Parcela 1/4)', amount: 450, type: 'expense', category: 'travel', date: `${lastMonth}-20` },
    { title: 'Restaurante Fim de Semana', amount: 190, type: 'expense', category: 'food', date: `${lastMonth}-12` },
    { title: 'Academia', amount: 120, type: 'expense', category: 'health', date: `${lastMonth}-05` },
    { title: 'Farmácia', amount: 135, type: 'expense', category: 'health', date: `${lastMonth}-22` },

    // Expenses 2 months ago
    { title: 'Aluguel apto', amount: 2200, type: 'expense', category: 'housing', date: `${twoMonthsAgo}-08` },
    { title: 'Supermercado', amount: 890, type: 'expense', category: 'food', date: `${twoMonthsAgo}-05` },
    { title: 'Celular Novo', amount: 2400, type: 'expense', category: 'electronics', date: `${twoMonthsAgo}-15` },
    { title: 'Conta de Energia', amount: 165, type: 'expense', category: 'bills', date: `${twoMonthsAgo}-10` },
    { title: 'Restaurante Especial', amount: 320, type: 'expense', category: 'food', date: `${twoMonthsAgo}-28` },

    // Expenses 3 months ago
    { title: 'Aluguel apto', amount: 2200, type: 'expense', category: 'housing', date: `${threeMonthsAgo}-08` },
    { title: 'Supermercado', amount: 740, type: 'expense', category: 'food', date: `${threeMonthsAgo}-05` },
    { title: 'Conta de Energia', amount: 180, type: 'expense', category: 'bills', date: `${threeMonthsAgo}-10` },
    { title: 'Manutenção do Carro', amount: 950, type: 'expense', category: 'transport', date: `${threeMonthsAgo}-20` },
  ];
  transactions.forEach(t => {
    const docRef = doc(txRef);
    batch.set(docRef, { ...t, userId, createdAt: serverTimestamp() });
  });

  // 4. Add tasks
  const tasksRef = collection(db, `users/${userId}/tasks`);
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().slice(0, 10);
  
  const tasks = [
    { title: 'Pagar conta de energia', completed: false, priority: 'high', deadline: today, description: 'Vencimento hoje!' },
    { title: 'Reunião de status com o time', completed: true, priority: 'medium', deadline: today, description: 'Google Meet às 14h' },
    { title: 'Comprar passagens para o Chile', completed: false, priority: 'high', deadline: tomorrow, description: 'Aproveitar promoção' },
    { title: 'Cancelar assinatura do Spotify (usar Family)', completed: false, priority: 'low', deadline: tomorrow, description: 'Economizar R$ 21/mês' },
    { title: 'Renovar seguro do carro', completed: false, priority: 'medium', deadline: '', description: 'Cotar com a Porto Seguro' }
  ];
  tasks.forEach(t => {
    const docRef = doc(tasksRef);
    batch.set(docRef, { ...t, userId, createdAt: serverTimestamp() });
  });

  // 5. Add appointments
  const aptsRef = collection(db, `users/${userId}/appointments`);
  const apts = [
    { title: 'Dentista - Revisão', date: today, time: '16:00', type: 'health', location: 'Clínica Sorriso' },
    { title: 'Pilates', date: tomorrow, time: '08:00', type: 'health', location: 'Studio Zen' }
  ];
  apts.forEach(a => {
    const docRef = doc(aptsRef);
    const day = new Date(a.date).getDate();
    batch.set(docRef, { ...a, day, userId, createdAt: serverTimestamp() });
  });

  // Commit the batch
  await batch.commit();
}

