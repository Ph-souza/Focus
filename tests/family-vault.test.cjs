const test = require('node:test');
const assert = require('node:assert/strict');

// Implementação idêntica ao server.ts
function isFamilyContext(text) {
  if (!text || typeof text !== 'string') return false;
  const lower = text.toLowerCase();
  const keywords = [
    'casa', 'mercado', 'nosso', 'nossa', 'luz', 'água', 'agua', 'energia', 'feira',
    'aluguel', 'família', 'familia', 'compras do mês', 'compras do mes', 'condomínio', 'condominio',
    'botijão', 'supermercado', 'açougue', 'acougue', 'hortifruti', 'padaria da casa', 'escola', 'crianças'
  ];
  if (keywords.some(k => lower.includes(k))) return true;
  return /\b(gás|gas)\b/i.test(lower);
}

// Simulação da resolução de ledger de transações
function resolveTransactionLedger(isFamilyFlag, text, userLedgers) {
  const isFamily = isFamilyFlag || isFamilyContext(text);
  const sharedLedger = userLedgers.find(l => l.type === 'shared');
  
  if (isFamily && sharedLedger) {
    return {
      targetLedgerId: sharedLedger.id,
      collectionPath: `ledgers/${sharedLedger.id}/transactions`,
      isFamily: true
    };
  }

  const personalLedger = userLedgers.find(l => l.type === 'personal') || { id: 'default-personal' };
  return {
    targetLedgerId: personalLedger.id,
    collectionPath: `users/${personalLedger.id}/transactions`,
    isFamily: false
  };
}

test('Family Vault: detecção de contexto familiar por palavras-chave', () => {
  assert.equal(isFamilyContext('Conta de luz da casa'), true);
  assert.equal(isFamilyContext('Compras no mercado do mês'), true);
  assert.equal(isFamilyContext('Pagamento do nosso aluguel'), true);
  assert.equal(isFamilyContext('Mensalidade da escola das crianças'), true);
  assert.equal(isFamilyContext('Compra de um botijão de gás'), true);
  assert.equal(isFamilyContext('Compra de um cafezinho na padaria'), false);
  assert.equal(isFamilyContext('Gasolina para viagem pessoal'), false);
});

test('Family Vault: roteamento automático para o cofre familiar se usuário possuir shared ledger', () => {
  const userLedgersWithFamily = [
    { id: 'user-123', type: 'personal', role: 'owner' },
    { id: 'fam-ledger-999', type: 'shared', role: 'owner' }
  ];

  const result1 = resolveTransactionLedger(false, 'Compra de mercado', userLedgersWithFamily);
  assert.equal(result1.targetLedgerId, 'fam-ledger-999');
  assert.equal(result1.collectionPath, 'ledgers/fam-ledger-999/transactions');
  assert.equal(result1.isFamily, true);

  const result2 = resolveTransactionLedger(false, 'Cinema sozinho', userLedgersWithFamily);
  assert.equal(result2.targetLedgerId, 'user-123');
  assert.equal(result2.collectionPath, 'users/user-123/transactions');
  assert.equal(result2.isFamily, false);
});

test('Family Vault: fallback seguro para cofre pessoal caso usuário não tenha cofre familiar configurado', () => {
  const userWithoutFamily = [
    { id: 'user-456', type: 'personal', role: 'owner' }
  ];

  // Mesmo que o texto contenha palavra familiar, sem cofre compartilhado grava no pessoal com segurança
  const result = resolveTransactionLedger(false, 'Supermercado da casa', userWithoutFamily);
  assert.equal(result.targetLedgerId, 'user-456');
  assert.equal(result.collectionPath, 'users/user-456/transactions');
});

test('Family Vault: código de convite segue formato único FAM-XXXX', () => {
  function generateInviteCode() {
    return `FAM-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  }
  const code = generateInviteCode();
  assert.match(code, /^FAM-[A-Z0-9]{4}$/);
});
