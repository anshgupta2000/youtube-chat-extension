let fetch;
import('node-fetch').then(mod => {
    fetch = mod.default;  // mod.default is required because it's an ES module
    global.fetch = fetch;  
});

const axios = require('axios');
const { google } = require('googleapis');
const { getSubtitles } = require('youtube-caption-extractor');

const getVideoSummary = async (videoId) => {
    try {
        const response = await axios.get(`http://localhost:5002/get_summary`, {
            params: { video_id: videoId }
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching video summary: ", error);
        throw error;
    }
};


const fetchSubtitles = async (videoID, lang = 'en') => {
    try {
      const subtitles = await getSubtitles({ videoID, lang });
      return subtitles;
    } catch (error) {
      console.error('Error fetching subtitles:', error);
      throw error;
    }
  };
module.exports = { getVideoSummary, fetchSubtitles };