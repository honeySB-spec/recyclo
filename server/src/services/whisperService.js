const axios = require('axios');

/**
 * Transcribes audio buffer using Google Gemini Multimodal Audio API
 * @param {Buffer} audioBuffer - Audio buffer (e.g. webm, wav, mp3)
 * @param {string} mimeType - MIME type of the audio
 * @returns {Promise<string>} Transcribed text
 */
async function transcribeAudio(audioBuffer, mimeType = 'audio/webm') {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured in server environment.');
  }

  // Sanitize mimeType (strip codecs e.g. "audio/webm;codecs=opus" -> "audio/webm")
  const cleanMimeType = mimeType.split(';')[0].trim() || 'audio/webm';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  const payload = {
    contents: [
      {
        parts: [
          {
            text: "Transcribe the following speech recording verbatim into plain text. Do not add explanations, quotes, labels, or formatting. If no intelligible speech is heard, return an empty string."
          },
          {
            inline_data: {
              mime_type: cleanMimeType,
              data: audioBuffer.toString('base64')
            }
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.1
    }
  };

  const response = await axios.post(url, payload, {
    headers: { 'Content-Type': 'application/json' }
  });

  const candidate = response.data?.candidates?.[0];
  if (!candidate || !candidate.content?.parts) {
    return '';
  }

  const textPart = candidate.content.parts.slice().reverse().find(p => p.text && !p.thought) || candidate.content.parts[0];
  return (textPart?.text || '').trim();
}

module.exports = {
  transcribeAudio
};
