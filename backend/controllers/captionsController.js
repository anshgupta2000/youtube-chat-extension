const { getVideoSummary } = require('../services/youtubeService');
const dotenv = require('dotenv');
const { fetchSubtitles } = require('../services/youtubeService');

const fetchSummary = async (req, res) => {
    const videoId = req.query.videoId;
    console.log("Received request for video ID:", videoId); // Log to check input
    if (!videoId) {
        return res.status(400).send({ message: "Video ID is required" });
    }

    try {
        const summary = await getVideoSummary(videoId);
        console.log("Summary fetched successfully:", summary); // Log successful fetch
        res.json(summary);
    } catch (error) {
        console.error("Error in fetching summary:", error); // Log any errors
        res.status(500).send({ message: "Failed to fetch video summary", error: error.toString() });
    }
};


const getCaptions = async (req, res) => {
    //const { videoID, lang = 'en' } = req.query;
    const videoID = req.query.videoId;  
    const lang = req.query.lang || 'en';
    console.log("Received request for captions with Video ID:", videoID, "and language:", lang);
    if (!videoID) {
        return res.status(400).json({ message: "Video ID is required" });
    }
  
    try {
      const captions = await fetchSubtitles(videoID, lang);
      console.log("Captions fetched successfully:", captions);
      res.status(200).json({ captions });
    } catch (error) {
      console.error("Error fetching captions:", error);
      res.status(500).json({ error: error.message });
    }
  };

  module.exports = { fetchSummary, getCaptions };

