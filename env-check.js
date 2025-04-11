
const axios = require('axios');
require('dotenv').config();

async function testOpenAIKey() {
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Ciao! Questo è un test.' }]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ La tua chiave OpenAI funziona correttamente!');
    console.log('Risposta:', response.data.choices[0].message.content);
  } catch (error) {
    console.error('❌ Errore durante la richiesta a OpenAI:');
    console.error(error.response?.status || error.code, error.response?.data?.error || error.message);
  }
}

testOpenAIKey();
