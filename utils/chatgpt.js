const axios = require('axios');

async function askChatGPT(message) {
  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: message }]
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );

  return response.data.choices[0].message.content.trim();
}

module.exports = askChatGPT;
