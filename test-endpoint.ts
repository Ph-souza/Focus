import fetch from 'node-fetch';

async function test() {
  const res = await fetch('http://127.0.0.1:3000/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: 'adicione um gasto de 45 reais no ifood hoje',
      history: []
    })
  });
  console.log(res.status);
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}
test();
