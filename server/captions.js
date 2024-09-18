const express = require('express');
const router = express.Router();
const { fetchSubtitles, getVideoSummary, getCaptionsOnly, getDetailedCaptions, answerQuestion } = require('/Users/anshgupta/Desktop/youtube-chat-extension/server/youtubeService.js');

router.get('/', fetchSubtitles);

router.get('/captions', async (req, res) => {
    const videoID = req.query.videoId;
    const lang = req.query.lang || 'en';
    console.log("Received request for captions with Video ID:", videoID, "and language:", lang);
    if (!videoID) {
        return res.status(400).json({ message: "Video ID is required" });
    }
  
    try {
        const summary = await fetchSubtitles(videoID, lang);
        console.log("Summary fetched successfully:", summary);
        res.status(200).json({ captions: { content: [{ text: summary }] } });
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
        console.log("Captions fetched successfully");
        res.status(200).json({ captions });
    } catch (error) {
        console.error("Error fetching only captions:", error);
        res.status(500).json({ error: error.message });
    }
});

router.get('/detailed-captions', async (req, res) => {
    const videoID = req.query.videoId;
    const lang = req.query.lang || 'en';
    console.log("Received request for detailed captions with Video ID:", videoID, "and language:", lang);
    if (!videoID) {
      return res.status(400).json({ message: "Video ID is required" });
    }
  
    try {
      const captions = await getDetailedCaptions(videoID, lang);
      console.log("Detailed captions fetched successfully");
      res.status(200).json({ captions });
    } catch (error) {
      console.error("Error fetching detailed captions:", error);
      res.status(500).json({ error: error.message });
    }
  });
  
  router.post('/answer-question', async (req, res) => {
    const { videoID, question, chatHistory } = req.body;
    if (!videoID || !question) {
      return res.status(400).json({ message: "Video ID and question are required" });
    }
  
    try {
      const captions = await getDetailedCaptions(videoID);
      const answer = await answerQuestion(question, captions, chatHistory || [], videoID);
      res.status(200).json({ answer });
    } catch (error) {
      console.error("Error answering question:", error);
      res.status(500).json({ error: error.message });
    }
  });
  
module.exports = router;
//---------------------------------------------------------------------------------------------
