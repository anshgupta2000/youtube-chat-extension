const express = require('express');
const axios = require('axios');
const cors = require('cors');
const { getSubtitles } = require('youtube-caption-extractor');
const dotenv = require('dotenv');
const captionsRouter = require('./captions'); 
const { 
  getVideoSummary, 
  getVideoSections, 
  getVideoKeyInsights, 
  getYouTubeChapters,
  findVideoMoment 
} = require('/Users/anshgupta/Desktop/youtube-chat-extension/server/youtubeService.js');
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased payload limit
app.use(express.urlencoded({ extended: true, limit: '50mb' })); // Increased payload limit

app.use('/summary', captionsRouter);

app.get('/', (req, res) => {
  res.send('Backend is running');
});

app.post('/summary/concise', async (req, res) => {
  try {
    const { summary, maxLength } = req.body;
    
    const conciseSummary = await generateConciseSummary(summary, maxLength);
    
    res.json({ summary: conciseSummary });
  } catch (error) {
    console.error('Error generating concise summary:', error);
    res.status(500).json({ error: 'Failed to generate concise summary' });
  }
});

app.get('/summary/video-sections', async (req, res) => {
  try {
    console.log('Received request for video sections');
    const { videoId } = req.query;
    if (!videoId) {
      console.error('No videoId provided');
      return res.status(400).json({ error: 'Video ID is required' });
    }

    // First, try to get YouTube chapters
    const youtubeChapters = await getYouTubeChapters(videoId);
    
    if (youtubeChapters && youtubeChapters.length > 0) {
      console.log('YouTube chapters found, using them');
      return res.json({ success: true, sections: youtubeChapters, source: 'youtube' });
    }

    // If no YouTube chapters, proceed with our AI-generated sections
    console.log('No YouTube chapters found, generating AI sections');
    console.log('Fetching subtitles for videoId:', videoId);
    const captions = await getSubtitles({ videoID: videoId, lang: 'en' });
    if (!captions || captions.length === 0) {
      console.error('No captions found for videoId:', videoId);
      return res.status(404).json({ error: 'No captions found for this video' });
    }

    console.log('Captions fetched successfully, processing transcript');
    const transcriptText = captions.map(caption => caption.text).join(' ');
    console.log('Transcript length:', transcriptText.length);

    console.log('Generating video sections');
    const sections = await getVideoSections(transcriptText, captions);
    console.log('Video sections generated:', sections);

    res.json({ success: true, sections, source: 'ai' });
  } catch (error) {
    console.error('Error fetching video sections:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch video sections', details: error.message });
  }
});

app.get('/summary/generate-ai-sections', async (req, res) => {
  try {
    console.log('Received request to generate AI sections');
    const { videoId } = req.query;
    if (!videoId) {
      console.error('No videoId provided');
      return res.status(400).json({ error: 'Video ID is required' });
    }

    console.log('Fetching subtitles for videoId:', videoId);
    const captions = await getSubtitles({ videoID: videoId, lang: 'en' });
    if (!captions || captions.length === 0) {
      console.error('No captions found for videoId:', videoId);
      return res.status(404).json({ error: 'No captions found for this video' });
    }

    console.log('Captions fetched successfully, processing transcript');
    const transcriptText = captions.map(caption => caption.text).join(' ');
    console.log('Transcript length:', transcriptText.length);

    console.log('Generating AI video sections');
    const sections = await getVideoSections(transcriptText, captions);
    console.log('AI video sections generated:', sections);

    res.json({ success: true, sections, source: 'ai' });
  } catch (error) {
    console.error('Error generating AI sections:', error);
    res.status(500).json({ success: false, error: 'Failed to generate AI sections', details: error.message });
  }
});

app.get('/summary/key-insights', async (req, res) => {
  try {
    const { videoId } = req.query;
    if (!videoId) {
      return res.status(400).json({ error: 'Video ID is required' });
    }

    const captions = await getSubtitles({ videoID: videoId, lang: 'en' });
    if (!captions || captions.length === 0) {
      return res.status(404).json({ error: 'No captions found for this video' });
    }

    const transcriptText = captions.map(caption => caption.text).join(' ');
    const keyInsights = await getVideoKeyInsights(transcriptText);

    res.json({ success: true, keyInsights });
  } catch (error) {
    console.error('Error fetching key insights:', error);
    res.status(500).json({ error: 'Failed to fetch key insights', details: error.message });
  }
});

async function generateConciseSummary(summary, maxLength) {
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not set in the environment variables');
  }

  const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
  const MODEL_NAME = 'claude-3-5-sonnet-20240620';

  try {
    const response = await axios.post(ANTHROPIC_API_URL, {
      model: MODEL_NAME,
      max_tokens: maxLength * 2, // Increased max tokens
      messages: [
        { 
          role: "user", 
          content: `Please provide a concise summary of the following text, focusing on the most important points. The summary should be approximately ${maxLength} words long:

${summary}

Your summary should:
1. Capture the main topic or theme
2. Include only the most crucial points
3. Be clear and easy to understand
4. Avoid unnecessary details or explanations
5. Use emojis to highlight key points
6. Format the response as a JSON object with the following structure:
{
  "mainIdea": "A brief one-sentence overview of the video's main topic",
  "keyPoints": [
    {
      "emoji": "An appropriate emoji for this point",
      "title": "A short title for this key point",
      "description": "A brief explanation of the key point"
    },
    // ... (3-4 key points total)
  ]
}`
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

    const content = response.data.content[0].text;
    console.log('API response content:', content);

    let parsedContent;
    try {
      const jsonStart = content.indexOf('{');
      const jsonEnd = content.lastIndexOf('}') + 1;
      const jsonContent = content.slice(jsonStart, jsonEnd);
      parsedContent = JSON.parse(jsonContent);
    } catch (parseError) {
      console.error('Error parsing JSON:', parseError);
      throw new Error("Failed to parse summary. Invalid JSON format.");
    }

    return parsedContent;
  } catch (error) {
    console.error("Error generating concise summary:", error.response ? error.response.data : error.message);
    throw error;
  }
}

app.post('/summary/find-moment', async (req, res) => {
  try {
    const { videoId, query } = req.body;
    if (!videoId || !query) {
      return res.status(400).json({ error: 'Video ID and query are required' });
    }

    console.log('Searching for moment in video:', videoId);
    console.log('Query:', query);

    const timestamp = await findVideoMoment(videoId, query);
    console.log('Timestamp found:', timestamp);
    res.json({ success: true, timestamp });
  } catch (error) {
    console.error('Error finding video moment:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to find the requested moment in the video', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


//---------------------------------------------------------------------------------------------
