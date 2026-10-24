const axios = require('axios');

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
// Default voice: Rachel or custom voice ID
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM'; 

/**
 * Generates an audio stream from text using ElevenLabs TTS API
 * @param {string} text - Spoken dialogue
 * @param {string} voiceId - Optional custom voice ID
 * @returns {Promise<ReadableStream>} Audio stream (audio/mpeg)
 */
async function generateSpeechStream(text, voiceId = ELEVENLABS_VOICE_ID) {
  if (!ELEVENLABS_API_KEY) {
    throw new Error('ELEVENLABS_API_KEY is not configured in server environment.');
  }

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`;

  const response = await axios({
    method: 'post',
    url,
    data: {
      text,
      model_id: 'eleven_turbo_v2_5',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.8,
        style: 0.0,
        use_speaker_boost: true
      }
    },
    headers: {
      'Accept': 'audio/mpeg',
      'xi-api-key': ELEVENLABS_API_KEY,
      'Content-Type': 'application/json'
    },
    responseType: 'stream'
  });

  return response.data;
}

module.exports = {
  generateSpeechStream
};
