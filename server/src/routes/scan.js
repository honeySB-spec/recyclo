const express = require('express');
const multer = require('multer');
const { supabaseAdmin } = require('../config/supabase');
const { analyzeItemImage } = require('../services/geminiService');
const { searchRestorationTutorials } = require('../services/youtubeService');

const router = express.Router();
// Multer in-memory storage (Render containers have ephemeral disk, so avoid local disk writes)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB max
});

/**
 * POST /api/scan
 * Multimodal AI Scanner Endpoint
 */
router.post('/', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided in request.' });
    }

    const file = req.file;
    const fileExt = file.originalname.split('.').pop() || 'jpg';
    const fileName = `scans/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    // 1. Stream image directly to Supabase Storage
    let publicImageUrl = '';
    try {
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from('item-images')
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: true
        });

      if (uploadError) {
        console.warn('[Supabase Storage] Upload warning:', uploadError.message);
      } else {
        const { data: publicUrlData } = supabaseAdmin.storage
          .from('item-images')
          .getPublicUrl(fileName);
        publicImageUrl = publicUrlData.publicUrl;
      }
    } catch (storageErr) {
      console.warn('[Storage Error]', storageErr.message);
    }

    // 2. Multimodal AI Analysis with Gemini
    const aiAnalysis = await analyzeItemImage(file.buffer, file.mimetype);

    // 3. Concurrently fetch YouTube tutorials & relevant restoration products
    const [youtubeTutorials, productsResult] = await Promise.all([
      searchRestorationTutorials(aiAnalysis.restoreRecommendation?.youtubeSearchQuery || aiAnalysis.itemName, 3),
      supabaseAdmin
        .from('restoration_products')
        .select('*')
        .limit(6)
    ]);

    // Match products based on recommended products or category
    const products = productsResult.data || [];

    res.json({
      success: true,
      imageUrl: publicImageUrl,
      analysis: aiAnalysis,
      youtubeTutorials,
      restorationProducts: products
    });
  } catch (error) {
    console.error('[Scan Route Error]', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process item scan.'
    });
  }
});

module.exports = router;
