const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const askChatGPT = require('./utils/chatgpt');
const transcribeAudio = require('./utils/whisper');

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

// 🌐 Verifica iniziale Webhook Meta
app.get('/webhook', (req, res) => {
  const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token && mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ Webhook verificato!');
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// 📥 Ricezione messaggi WhatsApp
app.post('/webhook', async (req, res) => {
  console.log('📩 Webhook ricevuto:', JSON.stringify(req.body, null, 2));

  try {
    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const message = changes?.value?.messages?.[0];

    if (message) {
      const from = message.from;
      let userMsg = '';
      let mediaId = '';

      if (message.type === 'text') {
        userMsg = message.text.body;
      } else if (message.type === 'audio') {
        mediaId = message.audio.id;
        const audioPath = await downloadMedia(mediaId, 'audio');
        userMsg = await transcribeAudio(audioPath);
      } else if (message.type === 'image') {
        mediaId = message.image.id;
        await downloadMedia(mediaId, 'image');
        userMsg = 'Immagine ricevuta.';
      }

      // GPT response
      const reply = await askChatGPT(userMsg);
      await sendWhatsAppMessage(from, reply);
    }

    res.sendStatus(200);
  } catch (err) {
    console.error('❌ Errore webhook:', err);
    res.sendStatus(500);
  }
});

// 🔽 Funzione download media
async function downloadMedia(mediaId, mediaType) {
  const url = `https://graph.facebook.com/v18.0/${mediaId}`;
  const headers = {
    Authorization: `Bearer ${process.env.META_ACCESS_TOKEN}`
  };

  const response = await axios.get(url, { headers });
  const mediaUrl = response.data.url;

  const extension = mediaType === 'audio' ? '.ogg' : '.jpg';
  const filePath = path.join(__dirname, 'media', 'received', `${mediaId}${extension}`);

  const writer = fs.createWriteStream(filePath);
  const mediaResponse = await axios.get(mediaUrl, {
    headers,
    responseType: 'stream'
  });

  mediaResponse.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', () => resolve(filePath));
    writer.on('error', reject);
  });
}

// 📤 Invio risposta su WhatsApp
async function sendWhatsAppMessage(to, text) {
  await axios.post(
    `https://graph.facebook.com/v18.0/${process.env.PHONE_NUMBER_ID}/messages`,
    {
      messaging_product: 'whatsapp',
      to,
      text: { body: text }
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.META_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    }
  );
}

app.listen(port, () => {
