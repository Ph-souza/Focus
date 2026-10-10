const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const mod = { exports: {} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/homeBalance.ts', 'utf8'), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS }
}).outputText, { exports: mod.exports, module: mod });
const { calculateHomeBalance } = mod.exports;
const tx = (date, type, amount) => ({ id: String(Math.random()), title: 'Test', date, type, amount });

test('carries prior years and months beyond the five latest entries; monthly indicators remain monthly', () => {
  const history = [tx('2025-12-31', 'receita', 1000), tx('2026-09-01', 'income', 500),
    tx('2026-09-02', 'despesa', 100), tx('2026-10-01', 'income', 200),
    tx('2026-10-02', 'expense', 20), tx('2026-10-03', 'investimento_meta', 30),
    tx('2026-10-04', 'receita', 50), tx('2026-10-10', 'despesa', 10)];
  const result = calculateHomeBalance(history, '2026-10-10');
  assert.equal(result.balance, 1590);
  assert.equal(result.totalIncome, 250);
  assert.equal(result.totalExpense, 60);
  const nextMonth = calculateHomeBalance(history, '2026-11-01');
  assert.equal(nextMonth.balance, 1590);
  assert.equal(nextMonth.totalIncome, 0);
  assert.equal(nextMonth.totalExpense, 0);
});

test('future entries do not change current balance and become effective on their date', () => {
  const history = [tx('2026-10-10', 'income', 100), tx('2026-10-11', 'expense', 25), tx('2026-11-01', 'income', 1000)];
  assert.equal(calculateHomeBalance(history, '2026-10-10').balance, 100);
  assert.equal(calculateHomeBalance(history, '2026-10-11').balance, 75);
});

test('empty, zero and negative balances are real values with cent precision', () => {
  assert.equal(calculateHomeBalance([], '2026-10-10').balance, 0);
  assert.equal(calculateHomeBalance([tx('2026-10-01', 'income', 0.1), tx('2026-10-02', 'receita', 0.2), tx('2026-10-03', 'expense', 0.3)], '2026-10-10').balance, 0);
  assert.equal(calculateHomeBalance([tx('2026-10-01', 'expense', 50)], '2026-10-10').balance, -50);
});
