const axios = require('axios');

function getGeminiApiUrl() {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
}

function parseCandidateJson(candidate) {
  if (!candidate || !candidate.content || !candidate.content.parts) {
    throw new Error('No candidate content received from Gemini API.');
  }

  // Find the text part (ignoring thoughts if present)
  const textPart = candidate.content.parts.slice().reverse().find(p => p.text && !p.thought) || candidate.content.parts[0];
  if (!textPart || !textPart.text) {
    throw new Error('Empty text part in Gemini candidate response.');
  }

  let text = textPart.text.trim();
  // Strip markdown code fences if model enclosed JSON in ```json ... ```
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }

  return JSON.parse(text);
}

/**
 * Analyzes an uploaded item image using Gemini Multimodal Vision API
 * Returns structured JSON with scrap pricing and restoration recommendations
 */
async function analyzeItemImage(imageBuffer, mimeType = 'image/jpeg') {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in server environment.');
  }

  const base64Image = imageBuffer.toString('base64');

  const systemInstruction = `
You are the AI Engine for Recyclo, a circular economy and waste-to-resource marketplace.
Analyze the user's item image carefully. Identify:
1. Item name, material composition, and condition.
2. Fair market scrap/resale value estimates (in USD).
3. "Restore vs. Sell" recommendations:
   - Upcycling/Restoration pathway: DIY steps, tools/materials needed, YouTube search keyword for DIY tutorials, and tool categories to cross-sell.
   - Scrap/Marketplace listing pathway: optimized listing title, condition assessment, and compelling marketplace description for local collectors.

Output MUST be valid JSON strictly matching the schema without markdown code blocks.
`;

  const prompt = `Analyze this discarded or used item and output raw JSON with this exact structure:
{
  "itemName": "string",
  "category": "Wood Furniture | E-Waste | Scrap Metal | Plastics | Textiles | Appliances | Glass",
  "materials": ["string"],
  "condition": "Poor / Scrap | Fair / Restorable | Good / Reusable",
  "estimatedScrapValue": {
    "min": number,
    "max": number,
    "suggestedAskingPrice": number
  },
  "restoreRecommendation": {
    "viable": boolean,
    "headline": "string",
    "stepsSummary": "string",
    "materialsNeeded": ["string"],
    "youtubeSearchQuery": "string",
    "suggestedProducts": ["string"]
  },
  "sellRecommendation": {
    "scrapHeadline": "string",
    "marketDemand": "High | Medium | Low",
    "recommendedTitle": "string",
    "recommendedDescription": "string"
  }
}`;

  const payload = {
    contents: [
      {
        parts: [
          { text: systemInstruction },
          { text: prompt },
          {
            inline_data: {
              mime_type: mimeType,
              data: base64Image
            }
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.2,
      response_mime_type: 'application/json'
    }
  };

  const response = await axios.post(getGeminiApiUrl(), payload, {
    headers: { 'Content-Type': 'application/json' }
  });

  return parseCandidateJson(response.data?.candidates?.[0]);
}

/**
 * Handles conversational reasoning for the Voice Agent (Waste Generator or Collector)
 */
async function processVoiceAgentQuery({ transcript, userRole = 'collector', locationContext = 'Metropolis', availableListings = [] }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in server environment.');
  }

  const systemPrompt = `
You are Recyclo's intelligent Voice Agent handling inbound phone and web voice calls.
You speak clearly, warmly, and concisely because your output will be synthesized directly into voice audio via ElevenLabs.
DO NOT use markdown symbols, bullet points, asterisks, or tables in the "speechText" field. Use natural conversational English suitable for speech synthesis.

Context:
- User Role: ${userRole}
- User Location: ${locationContext}
- Available Listings Database Snapshot: ${JSON.stringify(availableListings)}

Your Tasks:
If userRole is 'collector':
1. Understand what materials (e.g. scrap copper, iron, cardboard, electronics) or quantities the collector wants.
2. Search through the available listings snapshot.
3. In "speechText", naturally summarize the matching items, their prices, and locations in 2 to 3 spoken sentences. Ask if they would like to claim or book any of them.
4. If they explicitly confirm booking an item, set action to "confirm_booking" and specify the listingId.

If userRole is 'generator':
1. Understand the item(s) the household member is describing.
2. Estimate the scrap or salvage value.
3. Suggest a quick restoration idea or offer to create an immediate marketplace listing so a collector can pick it up.
4. In "speechText", explain the potential payout and ask if they would like you to publish the listing.

Return raw JSON only:
{
  "speechText": "Natural text ready for ElevenLabs TTS without markdown symbols",
  "action": "read_inventory | confirm_booking | draft_listing | clarify",
  "matchedListingIds": ["uuid"],
  "selectedListingId": "uuid or null",
  "draftListing": {
    "itemName": "string or null",
    "category": "string or null",
    "suggestedPrice": number or null,
    "materials": ["string"]
  }
}
`;

  const payload = {
    contents: [
      {
        parts: [
          { text: systemPrompt },
          { text: `User Transcribed Speech: "${transcript}"` }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.3,
      response_mime_type: 'application/json'
    }
  };

  const response = await axios.post(getGeminiApiUrl(), payload, {
    headers: { 'Content-Type': 'application/json' }
  });

  return parseCandidateJson(response.data?.candidates?.[0]);
}

module.exports = {
  analyzeItemImage,
  processVoiceAgentQuery
};
