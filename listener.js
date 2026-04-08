const EventSource = require('eventsource');
const fetch = require('node-fetch');

const TOKEN = process.env.UAZAPI_TOKEN;
const SSE_URL = `https://meeting.uazapi.com/sse`;

const es = new EventSource(SSE_URL, {
  headers: {
    Authorization: `Bearer ${TOKEN}`
  }
});
const N8N_WEBHOOK = process.env.N8N_WEBHOOK;

const ultimoStatus = {};

function conectar() {
  console.log('🔌 Conectando ao SSE...');

  const es = new EventSource(SSE_URL);

  es.onmessage = async (event) => {
    try {
      const data = JSON.parse(event.data);

      if (!data.instance) return;

      const nome = data.instance.name;
      const status = data.instance.status;

      if (ultimoStatus[nome] === status) return;
      ultimoStatus[nome] = status;

      console.log(`📡 ${nome} → ${status}`);

      await fetch(N8N_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

    } catch (err) {
      console.error('Erro:', err.message);
    }
  };

  es.onerror = () => {
    console.log('Reconectando em 5s...');
    es.close();
    setTimeout(conectar, 5000);
  };
}

conectar();

// 👇 servidor fake só pra EasyPanel não derrubar o app
const http = require('http');

const PORT = process.env.PORT || 3000;

http.createServer((req, res) => {
  res.writeHead(200);
  res.end('UazAPI Listener rodando');
}).listen(PORT, () => {
  console.log(`🌐 Server rodando na porta ${PORT}`);
});
