const express = require('express');
const router = express.Router();
//const { fetchSubtitles } = require('../services/youtubeService.js');
//const { getVideoSummary } = require('../services/youtubeService.js');
const { fetchSubtitles, getVideoSummary, getCaptionsOnly } = require('../services/youtubeService.js');

router.get('/', fetchSubtitles);


router.get('/captions', async (req, res) => {
    const videoID = req.query.videoId;
    const lang = req.query.lang || 'en';
    console.log("Received request for captions with Video ID:", videoID, "and language:", lang);
    if (!videoID) {
        return res.status(400).json({ message: "Video ID is required" });
    }
  
    try {
        const captions = await fetchSubtitles(videoID, lang);
        //const { transcriptText: captions } = await fetchSubtitles(videoID, lang);
        console.log("Captions fetched successfully:", captions);
        res.status(200).json({ captions });
    } catch (error) {
        console.error("Error fetching captions:", error);
        res.status(500).json({ error: error.message });
    }
});

router.get('/only-captions', async (req, res) => {
    const videoID = req.query.videoId;
    const lang = req.query.lang || 'en';
    console.log("Received request for only captions with Video ID:", videoID, "and language:", lang);
    if (!videoID) {
        return res.status(400).json({ message: "Video ID is required" });
    }
  
    try {
        const captions = await getCaptionsOnly(videoID, lang);
        console.log("Captions fetched successfully:", captions);
        res.status(200).json({ captions });
    } catch (error) {
        console.error("Error fetching only captions:", error);
        res.status(500).json({ error: error.message });
    }
});
module.exports = router;