const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

async function transcribeAudio(filePath) {
  const audio = fs.createReadStream(filePath);
  const formData = new FormData();
  formData.append('file', audio);
  formData.append('model', 'whisper-1');

  const response = await axios.post(
    'https://api.openai.com/v1/audio/transcriptions',
    formData,
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        ...formData.getHeaders()
      }
    }
  );

  return response.data.text;
}

module.exports = transcribeAudio;
