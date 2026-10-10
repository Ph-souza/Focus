const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function compile(file) {
  return ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true }
  }).outputText;
}
const storageModule = { exports: {} };
vm.runInNewContext(compile('src/lib/accountStorage.ts'), { exports: storageModule.exports, module: storageModule });
const { createAccountStorage } = storageModule.exports;
function fixture() {
  const values = new Map();
  let active = 'A';
  const raw = { getItem: k => values.has(k) ? values.get(k) : null, setItem: (k,v) => values.set(k,v), removeItem: k => values.delete(k) };
  return { values, raw, switchTo: uid => active = uid, account: uid => createAccountStorage(uid, () => active, raw, 'A') };
}
test('account B cannot read A projects; switching back preserves A data', () => {
  const f = fixture(), a = f.account('A'), b = f.account('B');
  a.setItem('nexus_focus_projects_list', 'private A');
  f.switchTo('B');
  assert.equal(b.getItem('nexus_focus_projects_list'), null);
  b.setItem('nexus_focus_projects_list', 'private B');
  f.switchTo('A');
  assert.equal(a.getItem('nexus_focus_projects_list'), 'private A');
});
test('late callbacks cannot write or delete data after account switch', () => {
  const f = fixture(), a = f.account('A'), b = f.account('B');
  a.setItem('notes', 'original');
  f.switchTo('B');
  a.setItem('notes', 'late'); a.removeItem('notes');
  assert.equal(a.getItem('notes'), null);
  assert.equal(b.getItem('notes'), null);
  f.switchTo('A');
  assert.equal(a.getItem('notes'), 'original');
});
test('legacy cache migrates only into explicitly identified original account, without deleting source', () => {
  const f = fixture();
  f.raw.setItem('nexus_focus_projects_list', 'legacy');
  f.switchTo('B');
  assert.equal(f.account('B').getItem('nexus_focus_projects_list'), null);
  f.switchTo('A');
  assert.equal(f.account('A').getItem('nexus_focus_projects_list'), 'legacy');
  assert.equal(f.raw.getItem('nexus_focus_projects_list'), 'legacy');
});
test('logged out sessions cannot read or write personal cache', () => {
  const f = fixture();
  f.switchTo(null);
  const guest = f.account(null);
  guest.setItem('notes', 'data');
  assert.equal(guest.getItem('notes'), null);
  assert.equal(f.values.size, 0);
});
test('a stale auth load cannot install another account listener or restore its premium state', async () => {
  const states = []; let stateIndex = 0, effect, authCallback;
  const auth = { currentUser: null };
  const pending = new Map(), listeners = [];
  const React = {
    createContext: () => ({Provider: 'provider'}), createElement: () => null, Fragment: 'fragment',
    useState: initial => { const i=stateIndex++; states[i]=initial; return [initial, value=>states[i]=value]; },
    useEffect: fn => { effect=fn; }, useContext: () => null
  };
  const firebase = { doc: (_db,...parts)=>parts.join('/'),
    getDoc: ref => new Promise(resolve=>pending.set(ref,resolve)),
    setDoc: async()=>{}, serverTimestamp: ()=>0,
    onSnapshot: (ref,next,error)=>{const l={ref,next,error,unsubscribed:false};listeners.push(l);return ()=>l.unsubscribed=true;}
  };
  const mod={exports:{}};
  vm.runInNewContext(compile('src/contexts/AuthContext.tsx'), {
    exports:mod.exports,module:mod,
    require: name => name==='react'?React:name==='firebase/auth'?{onAuthStateChanged:(_auth,cb)=>{authCallback=cb;return ()=>{};}}:
      name==='firebase/firestore'?firebase:{auth,db:{},signInWithGoogle:async()=>null,signOutUser:async()=>{}},
    console, sessionStorage:{removeItem:()=>{}},window:{location:{}}
  });
  mod.exports.AuthProvider({children:null}); effect();
  auth.currentUser={uid:'A',email:'a@example.com'};
  const first=authCallback(auth.currentUser);
  auth.currentUser={uid:'B',email:'b@example.com'};
  const second=authCallback(auth.currentUser);
  assert.equal(states[1],false); assert.equal(states[2],null);
  pending.get('users/B')({exists:()=>true});
  await second;
  pending.get('users/A')({exists:()=>true});
  await first;
  assert.equal(listeners.length,1); assert.equal(listeners[0].ref,'users/B');
  listeners[0].next({exists:()=>true,data:()=>({isPremium:true})});
  assert.equal(states[1],true);
  auth.currentUser={uid:'C',email:'c@example.com'};
  const third=authCallback(auth.currentUser);
  listeners[0].next({exists:()=>true,data:()=>({isPremium:true})});
  assert.equal(states[1],false);
  pending.get('users/C')({exists:()=>false}); await third;
  assert.equal(listeners[0].unsubscribed,true);
});
