const axios = require('axios');
const { google } = require('googleapis');

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

module.exports = { getVideoSummary };




// const axios = require('axios');

// const getYouTubeTranscripts = async (videoId) => {
//     try {
//         const response = await axios.get(`http://localhost:5002/get_transcript`, {
//             params: { video_id: videoId }
//         });
//         return response.data;
//     } catch (error) {
//         console.error("Error fetching YouTube transcript: ", error);
//         throw error;
//     }
// };

// module.exports = { getYouTubeTranscripts };

//------------------------------------------------------------------------------------


// const { google } = require('googleapis');
// const OAuth2 = google.auth.OAuth2;

// const oauth2Client = new OAuth2(
//   process.env.CLIENT_ID,
//   process.env.CLIENT_SECRET,
//   process.env.REDIRECT_URI
// );

// const getAccessToken = async (code) => {
//   const { tokens } = await oauth2Client.getToken(code);
//   oauth2Client.setCredentials(tokens);
//   return tokens;
// };

// const getYoutubeCaptions = async (videoId) => {
//   try {
//     const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

//     const response = await youtube.captions.list({
//       part: 'snippet',
//       videoId: videoId
//     });

//     if (!response.data.items || response.data.items.length === 0) {
//       throw new Error('No captions found for this video');
//     }

//     // Filter for English captions or any preferred language
//     const captions = response.data.items.filter(item => item.snippet.language === 'en');

//     if (captions.length === 0) {
//       throw new Error('No English captions found for this video');
//     }

//     return captions;
//   } catch (error) {
//     console.error('Error fetching YouTube captions:', error);
//     return null;
//   }
// };

// module.exports = {
//   getAccessToken,
//   getYoutubeCaptions
// };