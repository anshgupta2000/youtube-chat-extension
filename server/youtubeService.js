let fetch;
import('node-fetch').then(mod => {
    fetch = mod.default;  // mod.default is required because it's an ES module
    global.fetch = fetch;  
});
const axios = require('axios');
const { getSubtitles } = require('youtube-caption-extractor');
const MODEL_NAME = 'claude-3-5-sonnet-20240620';
const ANTHROPIC_API_KEY = 'my_anthropic_key'; 
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

const getVideoSummary = async (transcript) => {
  try {
      if (!transcript) throw new Error("Transcript text is empty");
      const response = await axios.post(ANTHROPIC_API_URL, {
          model: MODEL_NAME,
          max_tokens: 2048,
          messages: [
            { 
                role: "user", 
                content: `You are a YouTube video summarizer. Provide a concise summary of the following video transcript:
                                    ${transcript}
                                    Your summary should include:
                                    1. The main topic or theme of the video
                                    2. Key points or arguments presented
                                    3. Any important conclusions or takeaways
                                    Please keep the summary brief and to the point.`
            }
        ]
      }, {
          headers: {
              'x-api-key': ANTHROPIC_API_KEY,
              'anthropic-version': '2023-06-01',
              'Content-Type': 'application/json'
          }
      });

      if (response.data.error) {
          console.error('API error:', response.data.error);
          throw new Error(response.data.error.message);
      }

      return response.data;
  } catch (error) {
      console.error("Error fetching video summary:", error.response ? error.response.data : error.message);
      throw error;
  }
};

const fetchSubtitles = async (videoID, lang = 'en') => {
  try {
    const subtitles = await getSubtitles({ videoID, lang });
    if (!subtitles || subtitles.length === 0) {
      throw new Error('No subtitles found');
    }
    const transcriptText = subtitles.map(sub => sub.text).join(' ');
    console.log("Transcript text:", transcriptText);
    
    return await getVideoSummary(transcriptText);
  } catch (error) {
    console.error('Error fetching subtitles and summary:', error);
    throw error;
  }
};

const getCaptionsOnly = async (videoID, lang = 'en') => {
  try {
    const subtitles = await getSubtitles({ videoID, lang });
    if (!subtitles || subtitles.length === 0) {
      throw new Error('No subtitles found');
    }
    const joinedCaptions = subtitles.map(sub => sub.text).join(' ');
    console.log("Joined Captions:", joinedCaptions);
    
    return joinedCaptions;
  } catch (error) {
    console.error('Error fetching captions:', error);
    throw error;
  }
};

module.exports = { getVideoSummary, fetchSubtitles, getCaptionsOnly };
