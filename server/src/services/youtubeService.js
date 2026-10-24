const axios = require('axios');

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

/**
 * Searches YouTube for upcycling and restoration video tutorials
 * @param {string} query - Keyword query (e.g., "restore vintage oak chair DIY")
 * @param {number} maxResults - Number of videos to fetch (default: 3)
 */
async function searchRestorationTutorials(query, maxResults = 3) {
  if (!YOUTUBE_API_KEY) {
    console.warn('[YouTube Service] YOUTUBE_API_KEY not set. Returning curated fallback tutorials.');
    return [
      {
        videoId: 'dQw4w9WgXcQ',
        title: `How to Restore & Upcycle: ${query}`,
        thumbnail: 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=500&auto=format&fit=crop&q=60',
        channelTitle: 'Upcycle Masters',
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`
      }
    ];
  }

  try {
    const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        part: 'snippet',
        q: `${query} DIY restoration upcycle tutorial`,
        type: 'video',
        maxResults,
        key: YOUTUBE_API_KEY,
        safeSearch: 'moderate'
      }
    });

    return response.data.items.map(item => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
      channelTitle: item.snippet.channelTitle,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`
    }));
  } catch (error) {
    console.error('[YouTube Service] Error fetching videos:', error.message);
    return [];
  }
}

module.exports = {
  searchRestorationTutorials
};
