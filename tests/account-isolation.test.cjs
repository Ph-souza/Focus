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
test('a stale auth response cannot restore another account premium state or listener', async () => {
  const states = []; let stateIndex = 0, effect, authCallback;
  const auth = { currentUser: null };
  const access = new Map(), listeners = [];
  const React = {
    createContext: () => ({Provider: 'provider'}), createElement: () => null, Fragment: 'fragment',
    useState: initial => { const i=stateIndex++; states[i]=initial; return [initial, value=>states[i]=value]; },
    useEffect: fn => { effect=fn; }, useContext: () => null
  };
  const firebase = { doc: (_db,...parts)=>parts.join('/'),
    onSnapshot: (ref,next,error)=>{const l={ref,next,error,unsubscribed:false};listeners.push(l);return ()=>l.unsubscribed=true;}
  };
  const mod={exports:{}};
  vm.runInNewContext(compile('src/contexts/AuthContext.tsx'), {
    exports:mod.exports,module:mod,
    require: name => name==='react'?React:name==='firebase/auth'?{onAuthStateChanged:(_auth,cb)=>{authCallback=cb;return ()=>{};}}:
      name==='firebase/firestore'?firebase:name.endsWith('/lib/api')?{getApiUrl:path=>path}:{auth,db:{},signInWithGoogle:async()=>null,signOutUser:async()=>{}},
    console, sessionStorage:{removeItem:()=>{}},window:{location:{}},
    fetch: (_url, init) => new Promise(resolve => access.set(init.headers.Authorization.slice(7), resolve))
  });
  mod.exports.AuthProvider({children:null}); effect();
  const user = uid => ({uid, email:uid.toLowerCase()+'@example.com', getIdToken:async()=>uid});
  const response = premium => ({ok:true, json:async()=>({userDocExists:true,isPremium:premium,isAdmin:false})});
  auth.currentUser=user('A');
  const first=authCallback(auth.currentUser);
  auth.currentUser=user('B');
  const second=authCallback(auth.currentUser);
  await Promise.all([first,second]);
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(states[1],false); assert.equal(states[3],null);
  const listenerB=listeners.find(listener=>listener.ref==='users/B');
  assert.ok(listenerB); assert.equal(listeners.filter(listener=>!listener.unsubscribed).length,1);
  access.get('B')(response(true));
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(states[1],true);
  access.get('A')(response(false));
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(states[1],true);
  auth.currentUser=user('C');
  const third=authCallback(auth.currentUser);
  await third;
  await new Promise(resolve=>setImmediate(resolve));
  listenerB.next({exists:()=>true,data:()=>({isPremium:true})});
  assert.equal(states[1],false);
  access.get('C')(response(false));
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(listenerB.unsubscribed,true);
  assert.equal(states[1],false);
});
