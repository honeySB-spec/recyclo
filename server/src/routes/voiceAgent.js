const express = require('express');
const multer = require('multer');
const { supabaseAdmin } = require('../config/supabase');
const { transcribeAudio } = require('../services/whisperService');
const { processVoiceAgentQuery } = require('../services/geminiService');
const { generateSpeechStream } = require('../services/elevenlabsService');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB max audio
});

/**
 * POST /api/voice-agent
 * Full Voice Agent Pipeline:
 * Audio Upload -> Whisper STT -> Gemini Reasoning / DB Querying -> ElevenLabs TTS Stream
 */
router.post('/', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio recording received.' });
    }

    const userRole = req.body.role || 'collector'; // 'collector' or 'generator'
    const userLocation = req.body.location || 'Metropolis';
    const clientFormat = req.query.format || 'stream'; // 'stream' or 'json'

    // Step 1: Transcribe incoming audio using Whisper
    console.log(`[Voice Agent] Transcribing audio for role: ${userRole}...`);
    const transcript = await transcribeAudio(req.file.buffer, req.file.mimetype || 'audio/webm');
    console.log(`[Voice Agent] Transcribed text: "${transcript}"`);

    // Step 2: Query Supabase for active marketplace listings to ground the Gemini context
    const { data: availableListings, error: dbError } = await supabaseAdmin
      .from('marketplace_listings')
      .select('id, item_name, category, condition, user_asking_price, materials, location, status')
      .eq('status', 'available')
      .order('created_at', { ascending: false })
      .limit(15);

    if (dbError) {
      console.warn('[Voice Agent DB Warning]', dbError.message);
    }

    // Step 3: Run Gemini LLM reasoning with live marketplace context
    const agentResponse = await processVoiceAgentQuery({
      transcript,
      userRole,
      locationContext: userLocation,
      availableListings: availableListings || []
    });

    console.log(`[Voice Agent] Generated Speech: "${agentResponse.speechText}"`);

    // Step 4: Handle automated DB actions if confirmed by agent
    if (agentResponse.action === 'confirm_booking' && agentResponse.selectedListingId) {
      await supabaseAdmin
        .from('marketplace_listings')
        .update({ status: 'pending_pickup' })
        .eq('id', agentResponse.selectedListingId);
    }

    // Step 5: Synthesize speech via ElevenLabs
    const audioStream = await generateSpeechStream(agentResponse.speechText);

    // If client requested stream, pipe ElevenLabs audio directly to HTTP response
    if (clientFormat === 'stream') {
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('X-Transcript', encodeURIComponent(transcript));
      res.setHeader('X-Action', agentResponse.action || 'read_inventory');
      res.setHeader('X-Speech-Text', encodeURIComponent(agentResponse.speechText));
      res.setHeader('X-Matched-Listings', JSON.stringify(agentResponse.matchedListingIds || []));

      audioStream.pipe(res);
    } else {
      // Buffer stream to send JSON with base64 audio and metadata
      const chunks = [];
      audioStream.on('data', chunk => chunks.push(chunk));
      audioStream.on('end', () => {
        const audioBuffer = Buffer.concat(chunks);
        res.json({
          success: true,
          transcript,
          agentResponse,
          audioBase64: `data:audio/mpeg;base64,${audioBuffer.toString('base64')}`
        });
      });
      audioStream.on('error', err => {
        console.error('[Audio Stream Error]', err);
        res.status(500).json({ error: 'Failed to stream audio.' });
      });
    }

  } catch (error) {
    console.error('[Voice Agent Pipeline Error]', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Voice agent processing failed.'
    });
  }
});

module.exports = router;
