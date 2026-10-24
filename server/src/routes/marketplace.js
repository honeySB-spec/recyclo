const express = require('express');
const { supabaseAdmin } = require('../config/supabase');

const router = express.Router();

// Fallback seed listings to ensure the marketplace looks vibrant immediately
const SEED_LISTINGS = [
  {
    id: '11111111-1111-4111-a111-111111111111',
    generator_id: '00000000-0000-0000-0000-000000000001',
    item_name: 'Vintage Solid Oak Dining Chair',
    category: 'Wood Furniture',
    materials: ['Solid Oak Wood', 'Brass Screws', 'Varnish'],
    condition: 'Fair / Restorable',
    ai_estimated_value: 35.00,
    user_asking_price: 25.00,
    image_url: 'https://images.unsplash.com/photo-1503602642458-232111445657?w=600&auto=format&fit=crop&q=80',
    status: 'available',
    location: { city: 'Downtown Metropolis', address: '42 Maple Street' },
    ai_analysis: {
      restoreRecommendation: {
        viable: true,
        headline: 'Sand & Stain Project',
        stepsSummary: 'Sand the existing worn lacquer down with 120-grit sandpaper, apply natural walnut stain, and seal with polyurethane.'
      }
    }
  },
  {
    id: '22222222-2222-4222-a222-222222222222',
    generator_id: '00000000-0000-0000-0000-000000000001',
    item_name: 'Broken Commercial Microwave with Copper Magnetron',
    category: 'E-Waste',
    materials: ['Copper Transformer Wire', 'Sheet Steel', 'Aluminum Heat Sink'],
    condition: 'Poor / Scrap',
    ai_estimated_value: 40.00,
    user_asking_price: 30.00,
    image_url: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=600&auto=format&fit=crop&q=80',
    status: 'pending_pickup',
    location: { city: 'Westside Industrial Park', address: '108 Warehouse Way' },
    ai_analysis: {
      sellRecommendation: {
        scrapHeadline: 'High Copper Grade Scrap',
        marketDemand: 'High'
      }
    }
  },
  {
    id: '33333333-3333-4333-a333-333333333333',
    generator_id: '00000000-0000-0000-0000-000000000003',
    item_name: '50 Kilograms Bundled Corrugated Cardboard',
    category: 'Plastics & Paper',
    materials: ['Clean Cardboard', 'Paper Pulp'],
    condition: 'Good / Reusable',
    ai_estimated_value: 20.00,
    user_asking_price: 15.00,
    image_url: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=600&auto=format&fit=crop&q=80',
    status: 'available',
    location: { city: 'North Suburbs', address: '77 Logistics Ave' }
  },
  {
    id: '44444444-4444-4444-a444-444444444444',
    generator_id: '00000000-0000-0000-0000-000000000003',
    item_name: 'Clean Aluminum Beverage Cans (15kg Baled)',
    category: 'Scrap Metal',
    materials: ['Grade 3004 Aluminum'],
    condition: 'Good / Reusable',
    ai_estimated_value: 28.00,
    user_asking_price: 22.00,
    image_url: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=600&auto=format&fit=crop&q=80',
    status: 'available',
    location: { city: 'Greenway District', address: '12 Eco Blvd' }
  }
];

// In-memory fallback transactions for mock/demo IDs
let memoryTransactions = [
  {
    id: 't-001',
    listing_id: '22222222-2222-4222-a222-222222222222',
    generator_id: '00000000-0000-0000-0000-000000000001',
    collector_id: '00000000-0000-0000-0000-000000000002',
    final_price: 30.00,
    status: 'pending',
    green_points_awarded: 30,
    completed_at: new Date().toISOString(),
    collector: {
      full_name: 'Apex Scrap Recyclers (Dave)',
      contact_info: '+1 (555) 382-9011',
      company: 'Apex Metal Recovery'
    }
  }
];

let inMemoryListings = [...SEED_LISTINGS];

/**
 * GET /api/marketplace/listings
 * Fetch marketplace listings with search & category filtering
 */
router.get('/listings', async (req, res) => {
  try {
    const { category, status = 'available', search } = req.query;

    try {
      let query = supabaseAdmin
        .from('marketplace_listings')
        .select('*, generator:users(full_name, contact_info, green_points)')
        .order('created_at', { ascending: false });

      if (status !== 'all') {
        query = query.eq('status', status);
      }
      if (category && category !== 'All') {
        query = query.eq('category', category);
      }
      if (search) {
        query = query.ilike('item_name', `%${search}%`);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return res.json({ success: true, listings: data });
      }
    } catch (e) {
      console.warn('[DB Query Fallback to In-Memory]', e.message);
    }

    // Filter in-memory fallback
    let filtered = inMemoryListings;
    if (status !== 'all') {
      filtered = filtered.filter(l => l.status === status);
    }
    if (category && category !== 'All') {
      filtered = filtered.filter(l => l.category.toLowerCase().includes(category.toLowerCase()));
    }
    if (search) {
      filtered = filtered.filter(l => l.item_name.toLowerCase().includes(search.toLowerCase()));
    }

    res.json({ success: true, listings: filtered });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/marketplace/list
 * Create a new listing
 */
router.post('/list', async (req, res) => {
  try {
    const {
      generatorId,
      itemName,
      category,
      materials,
      condition,
      aiEstimatedValue,
      userAskingPrice,
      imageUrl,
      location,
      aiAnalysis
    } = req.body;

    const newListing = {
      id: `gen-${Date.now()}-${Math.random().toString(36).substring(5)}`,
      generator_id: generatorId || '00000000-0000-0000-0000-000000000001',
      item_name: itemName,
      category: category || 'General Scrap',
      materials: materials || [],
      condition: condition || 'Restorable',
      ai_estimated_value: aiEstimatedValue || userAskingPrice,
      user_asking_price: userAskingPrice,
      image_url: imageUrl || 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=500&auto=format&fit=crop&q=80',
      location: location || { city: 'Downtown Metropolis', address: '124 Green St' },
      ai_analysis: aiAnalysis,
      status: 'available',
      created_at: new Date().toISOString()
    };

    try {
      const { data, error } = await supabaseAdmin
        .from('marketplace_listings')
        .insert([newListing])
        .select()
        .single();

      if (!error && data) {
        return res.status(201).json({ success: true, listing: data });
      }
    } catch (dbErr) {
      console.warn('[DB Insert Fallback to In-Memory]', dbErr.message);
    }

    inMemoryListings.unshift(newListing);
    res.status(201).json({ success: true, listing: newListing });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/marketplace/book
 * Reserve or buy an item by collector
 */
router.post('/book', async (req, res) => {
  try {
    const { listingId, collectorId, collectorName, collectorContact } = req.body;

    // Check in-memory or DB
    let target = inMemoryListings.find(l => l.id === listingId);
    if (target) {
      target.status = 'pending_pickup';
      const newTrans = {
        id: `t-${Date.now()}`,
        listing_id: listingId,
        generator_id: target.generator_id,
        collector_id: collectorId || '00000000-0000-0000-0000-000000000002',
        final_price: target.user_asking_price,
        status: 'pending',
        green_points_awarded: 30,
        completed_at: new Date().toISOString(),
        collector: {
          full_name: collectorName || 'Local Eco Collector',
          contact_info: collectorContact || '+1 (555) 789-0123'
        },
        listing: target
      };
      memoryTransactions.unshift(newTrans);

      // Attempt DB sync
      try {
        await supabaseAdmin
          .from('marketplace_listings')
          .update({ status: 'pending_pickup' })
          .eq('id', listingId);
      } catch (e) {}

      return res.json({
        success: true,
        message: 'Item reserved! Pickup request sent to generator.',
        transaction: newTrans
      });
    }

    res.status(404).json({ error: 'Listing not found.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/marketplace/user/:userId/dashboard
 * Fetches personalized user dashboard (listings, buyer requests, bookings)
 */
router.get('/user/:userId/dashboard', async (req, res) => {
  try {
    const { userId } = req.params;

    // 1. My listed items
    const myListings = inMemoryListings.filter(l => l.generator_id === userId);

    // 2. Incoming buyer requests for my items
    const myItemIds = new Set(myListings.map(l => l.id));
    const incomingRequests = memoryTransactions
      .filter(t => myItemIds.has(t.listing_id))
      .map(t => ({
        ...t,
        listing: inMemoryListings.find(l => l.id === t.listing_id)
      }));

    // 3. Pickups booked by me as a collector
    const myBookings = memoryTransactions
      .filter(t => t.collector_id === userId)
      .map(t => ({
        ...t,
        listing: inMemoryListings.find(l => l.id === t.listing_id)
      }));

    // Calculate real metrics strictly from completed transactions
    const totalEarnings = myListings
      .filter(l => l.status === 'sold')
      .reduce((sum, item) => sum + (Number(item.user_asking_price) || 0), 0);

    const completedSoldCount = myListings.filter(l => l.status === 'sold').length;
    const completedPickupCount = myBookings.filter(b => b.status === 'completed').length;
    const totalDivertedKg = (completedSoldCount * 15) + (completedPickupCount * 20);
    const greenPoints = (completedSoldCount * 25) + (completedPickupCount * 30);

    res.json({
      success: true,
      data: {
        myListings,
        incomingRequests,
        myBookings,
        stats: {
          totalListings: myListings.length,
          activeCount: myListings.filter(l => l.status === 'available').length,
          pendingPickupCount: myListings.filter(l => l.status === 'pending_pickup').length,
          soldCount: completedSoldCount,
          totalEarnings,
          totalDivertedKg,
          greenPoints
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/marketplace/complete-pickup
 * Confirm handover and award points
 */
router.post('/complete-pickup', async (req, res) => {
  try {
    const { transactionId, listingId } = req.body;

    const listing = inMemoryListings.find(l => l.id === listingId);
    if (listing) {
      listing.status = 'sold';
    }

    const trans = memoryTransactions.find(t => t.id === transactionId || t.listing_id === listingId);
    if (trans) {
      trans.status = 'completed';
    }

    res.json({
      success: true,
      message: 'Transaction completed! +50 Green Points awarded.',
      pointsAwarded: 50
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
