const express = require('express');
const axios = require('axios');
const cors = require('cors');
const { getSubtitles } = require('youtube-caption-extractor');
const dotenv = require('dotenv');
const captionsRouter = require('./captions'); 
const { getVideoSummary, getVideoSections, getVideoKeyInsights } = require('/Users/anshgupta/Desktop/youtube-chat-extension/server/youtubeService.js');
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
    const sections = await getVideoSections(transcriptText);
    console.log('Video sections generated:', sections);

    res.json({ sections });
  } catch (error) {
    console.error('Error fetching video sections:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch video sections' });
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
    res.status(500).json({ success: false, error: 'Failed to fetch key insights', details: error.message });
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
4. Avoid unnecessary details or explanations`
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

    return response.data.content[0].text;
  } catch (error) {
    console.error("Error generating concise summary:", error.response ? error.response.data : error.message);
    throw error;
  }
}

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
//---------------------------------------------------------------------------------------------
// const express = require('express');
// const axios = require('axios');
// const cors = require('cors');
// const { getSubtitles } = require('youtube-caption-extractor');
// const dotenv = require('dotenv');
// const captionsRouter = require('./captions'); 
// const { getVideoSummary, getVideoSections, getVideoKeyInsights } = require('/Users/anshgupta/Desktop/youtube-chat-extension/server/youtubeService.js');
// dotenv.config();

// const app = express();
// app.use(cors());
// app.use(express.json({ limit: '50mb' })); // Increased payload limit
// app.use(express.urlencoded({ extended: true, limit: '50mb' })); // Increased payload limit

// app.use('/summary', captionsRouter);

// app.get('/', (req, res) => {
//   res.send('Backend is running');
// });

// app.post('/summary/concise', async (req, res) => {
//   try {
//     const { summary, maxLength } = req.body;
    
//     const conciseSummary = await generateConciseSummary(summary, maxLength);
    
//     res.json({ summary: conciseSummary });
//   } catch (error) {
//     console.error('Error generating concise summary:', error);
//     res.status(500).json({ error: 'Failed to generate concise summary' });
//   }
// });

// app.get('/summary/video-sections', async (req, res) => {
//   try {
//     console.log('Received request for video sections');
//     const { videoId } = req.query;
//     if (!videoId) {
//       console.error('No videoId provided');
//       return res.status(400).json({ error: 'Video ID is required' });
//     }

//     console.log('Fetching subtitles for videoId:', videoId);
//     const captions = await getSubtitles({ videoID: videoId, lang: 'en' });
//     if (!captions || captions.length === 0) {
//       console.error('No captions found for videoId:', videoId);
//       return res.status(404).json({ error: 'No captions found for this video' });
//     }

//     console.log('Captions fetched successfully, processing transcript');
//     const transcriptText = captions.map(caption => caption.text).join(' ');
//     console.log('Transcript length:', transcriptText.length);

//     console.log('Generating video sections');
//     const sections = await getVideoSections(transcriptText);
//     console.log('Video sections generated:', sections);

//     res.json({ sections });
//   } catch (error) {
//     console.error('Error fetching video sections:', error);
//     res.status(500).json({ error: error.message || 'Failed to fetch video sections' });
//   }
// });

// app.get('/summary/key-insights', async (req, res) => {
//   try {
//     const { videoId } = req.query;
//     if (!videoId) {
//       return res.status(400).json({ error: 'Video ID is required' });
//     }

//     const captions = await getSubtitles({ videoID: videoId, lang: 'en' });
//     if (!captions || captions.length === 0) {
//       return res.status(404).json({ error: 'No captions found for this video' });
//     }

//     const transcriptText = captions.map(caption => caption.text).join(' ');
//     const keyInsights = await getVideoKeyInsights(transcriptText);

//     res.json({ keyInsights });
//   } catch (error) {
//     console.error('Error fetching key insights:', error);
//     res.status(500).json({ error: 'Failed to fetch key insights', details: error.message });
//   }
// });


// async function generateConciseSummary(summary, maxLength) {
//   const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
//   if (!ANTHROPIC_API_KEY) {
//     throw new Error('ANTHROPIC_API_KEY is not set in the environment variables');
//   }

//   const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
//   const MODEL_NAME = 'claude-3-5-sonnet-20240620';

//   try {
//     const response = await axios.post(ANTHROPIC_API_URL, {
//       model: MODEL_NAME,
//       max_tokens: maxLength * 2, // Increased max tokens
//       messages: [
//         { 
//           role: "user", 
//           content: `Please provide a concise summary of the following text, focusing on the most important points. The summary should be approximately ${maxLength} words long:

// ${summary}

// Your summary should:
// 1. Capture the main topic or theme
// 2. Include only the most crucial points
// 3. Be clear and easy to understand
// 4. Avoid unnecessary details or explanations`
//         }
//       ]
//     }, {
//       headers: {
//         'x-api-key': ANTHROPIC_API_KEY,
//         'anthropic-version': '2023-06-01',
//         'Content-Type': 'application/json'
//       }
//     });

//     if (response.data.error) {
//       console.error('API error:', response.data.error);
//       throw new Error(response.data.error.message);
//     }

//     return response.data.content[0].text;
//   } catch (error) {
//     console.error("Error generating concise summary:", error.response ? error.response.data : error.message);
//     throw error;
//   }
// }

// const PORT = process.env.PORT || 5001;
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });