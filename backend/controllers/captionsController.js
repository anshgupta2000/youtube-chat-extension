const { getVideoSummary } = require('../services/youtubeService');
const dotenv = require('dotenv');

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


module.exports = { fetchSummary };


// const { getYouTubeTranscripts } = require('../services/youtubeService');
// const dotenv = require('dotenv');
// const fetchCaptions = async (req, res) => {
//     const videoId = req.query.videoId;
//     if (!videoId) {
//         return res.status(400).send({ message: "Video ID is required" });
//     }

//     try {
//         const captions = await getYouTubeTranscripts(videoId);
//         res.json(captions);
//     } catch (error) {
//         res.status(500).send({ message: "Failed to fetch captions", error: error.toString() });
//     }
// };

// module.exports = { fetchCaptions };

//------------------------------------------------------------------------------------

// const { getYoutubeCaptions, getAccessToken } = require('../services/youtubeService');
// const dotenv = require('dotenv');

// const fetchCaptions = async (req, res) => {
//   const { videoId, code } = req.query;

//   if (!videoId) {
//     return res.status(400).json({ message: 'Video ID is required' });
//   }

//   if (!code) {
//     return res.status(400).json({ message: 'Authorization code is required' });
//   }

//   try {
//     const tokens = await getAccessToken(code);
//     const captions = await getYoutubeCaptions(videoId);

//     if (!captions) {
//       return res.status(500).json({ message: 'Failed to fetch captions' });
//     }

//     res.json(captions);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// module.exports = {
//   fetchCaptions
// };
