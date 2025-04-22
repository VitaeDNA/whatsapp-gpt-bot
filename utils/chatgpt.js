const axios = require('axios');

async function askChatGPT(message) {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  const ASSISTANT_ID = process.env.ASSISTANT_ID;

  // 1. Crea un nuovo thread
  const threadRes = await axios.post(
    'https://api.openai.com/v1/threads',
    {},
    {
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );
  const threadId = threadRes.data.id;

  // 2. Aggiungi il messaggio utente al thread
  await axios.post(
    `https://api.openai.com/v1/threads/${threadId}/messages`,
    {
      role: 'user',
      content: message
    },
    {
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );

  // 3. Avvia il run dell'assistant
  const runRes = await axios.post(
    `https://api.openai.com/v1/threads/${threadId}/runs`,
    {
      assistant_id: ASSISTANT_ID
    },
    {
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );

  const runId = runRes.data.id;

  // 4. Aspetta che il run sia completato
  let status = 'in_progress';
  while (status !== 'completed') {
    await new Promise((resolve) => setTimeout(resolve, 1500)); // attesa 1.5s
    const statusRes = await axios.get(
      `https://api.openai.com/v1/threads/${threadId}/runs/${runId}`,
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    status = statusRes.data.status;
  }

  // 5. Recupera la risposta dell'assistant
  const messagesRes = await axios.get(
    `https://api.openai.com/v1/threads/${threadId}/messages`,
    {
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );

  const messages = messagesRes.data.data;
  const lastMessage = messages.find((msg) => msg.role === 'assistant');

  return lastMessage.content[0].text.value.trim();
}

module.exports = askChatGPT;
