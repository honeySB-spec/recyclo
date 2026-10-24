const express = require('express');
const cors = require('cors');
const path = require('path');
// Load environment variables from current directory or root workspace
require('dotenv').config();
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const scanRoute = require('./routes/scan');
const voiceAgentRoute = require('./routes/voiceAgent');
const marketplaceRoute = require('./routes/marketplace');

const app = express();
const PORT = process.env.PORT || 5001;

// Enable CORS for mobile web and local development
app.use(cors({
  origin: '*',
  exposedHeaders: ['X-Transcript', 'X-Action', 'X-Speech-Text', 'X-Matched-Listings']
}));

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Health Check endpoint for Render zero-downtime health probes
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Recyclo AI Backend',
    version: '1.0.0'
  });
});

// Mount Routes
app.use('/api/scan', scanRoute);
app.use('/api/voice-agent', voiceAgentRoute);
app.use('/api/marketplace', marketplaceRoute);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 Recyclo API Server running on port ${PORT}`);
  console.log(`📡 Ready for Render 24/7 Web Service Deployment`);
  console.log(`===============================================`);
});
