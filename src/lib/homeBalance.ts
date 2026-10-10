import type { Transaction } from '../types';

/** Available balance through the local calendar day, independent of month selection. */
export function calculateHomeBalance(transactions: Transaction[], today: string) {
  let balanceCents = 0;
  let incomeCents = 0;
  let expenseCents = 0;
  const month = today.slice(0, 7);

  for (const transaction of transactions) {
    const date = transaction.date?.slice(0, 10);
    if (!date || date > today) continue;
    const amount = Number(transaction.amount);
    if (!Number.isFinite(amount)) continue;
    const cents = Math.round(amount * 100);
    const income = transaction.type === 'income' || transaction.type === 'receita';
    const expense = transaction.type === 'expense' || transaction.type === 'despesa' || transaction.type === 'investimento_meta';
    if (!income && !expense) continue;
    balanceCents += income ? cents : -cents;
    if (date.startsWith(month)) {
      if (income) incomeCents += cents;
      else expenseCents += cents;
    }
  }

  return { balance: balanceCents / 100, totalIncome: incomeCents / 100, totalExpense: expenseCents / 100 };
}
