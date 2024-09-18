let fetch;
import('node-fetch').then(mod => {
    fetch = mod.default;
    global.fetch = fetch;  
});
const axios = require('axios');
const { getSubtitles, getVideoDetails } = require('youtube-caption-extractor');
const dotenv = require('dotenv');
dotenv.config();
const MODEL_NAME = 'claude-3-5-sonnet-20240620';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

const retryWithExponentialBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      const delay = baseDelay * Math.pow(2, i);
      console.log(`Retry attempt ${i + 1}. Waiting for ${delay}ms before next attempt.`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

const getVideoSummary = async (transcript) => {
  try {
    if (!transcript) throw new Error("Transcript text is empty");
    const response = await axios.post(ANTHROPIC_API_URL, {
      model: MODEL_NAME,
      max_tokens: 1000,
      messages: [
        { 
          role: "user", 
          content: `Provide a concise summary of the following video transcript:
                    ${transcript}
                    Format the response as a JSON object with the following structure:
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
                    }
                    Choose emojis that best represent each key point. Ensure the summary is engaging and highlights the most important information.`
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
    console.error("Error fetching video summary:", error.response ? error.response.data : error.message);
    throw error;
  }
};

const getVideoSections = async (transcript, captions) => {
  try {
    console.log('Generating video sections from transcript');
    if (!transcript) throw new Error("Transcript text is empty");
    console.log('Transcript length:', transcript.length);

    const apiCall = async () => {
      const response = await axios.post(ANTHROPIC_API_URL, {
        model: MODEL_NAME,
        max_tokens: 1000,
        messages: [
          { 
            role: "user", 
            content: `Analyze the following video transcript and divide it into 5-8 logical sections:
                      ${transcript}
                      Format the response as a JSON array of objects with the following structure:
                      [
                        {
                          "emoji": "An appropriate emoji for this section",
                          "timestamp": "Approximate timestamp in seconds where the section begins",
                          "title": "A concise title for this section (5-7 words max)",
                          "description": "A brief description of the section (1-2 sentences)"
                        },
                        // ... (5-8 sections total)
                      ]
                      Ensure the sections cover the entire content of the video in a logical sequence.
                      Use the provided transcript to estimate accurate timestamps for each section.
                      Return only the JSON array, without any additional text before or after it.`
          }
        ]
      }, {
        headers: {
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        }
      });
      return response;
    };

    const response = await retryWithExponentialBackoff(apiCall);

    if (response.data.error) {
      console.error('API error:', response.data.error);
      throw new Error(response.data.error.message);
    }

    console.log('Received response from Anthropic API');
    const content = response.data.content[0].text;
    console.log('API response content:', content);

    let parsedContent;
    try {
      const jsonStart = content.indexOf('[');
      const jsonEnd = content.lastIndexOf(']') + 1;
      const jsonContent = content.slice(jsonStart, jsonEnd);
      parsedContent = JSON.parse(jsonContent);
    } catch (parseError) {
      console.error('Error parsing JSON:', parseError);
      throw new Error("Failed to parse video sections. Invalid JSON format.");
    }

    if (!Array.isArray(parsedContent)) {
      console.error('Parsed content is not an array');
      throw new Error("Invalid video sections format. Expected an array.");
    }

    // Adjust timestamps based on captions
    parsedContent = parsedContent.map(section => {
      const nearestCaption = captions.reduce((prev, curr) => {
        return (Math.abs(curr.start - section.timestamp) < Math.abs(prev.start - section.timestamp) ? curr : prev);
      });
      return { ...section, timestamp: nearestCaption.start };
    });

    return parsedContent;
  } catch (error) {
    console.error("Error fetching video sections:", error.message);
    throw error;
  }
};

const getYouTubeChapters = async (videoId) => {
  try {
    // Fetch the page content
    const response = await axios.get(`https://www.youtube.com/watch?v=${videoId}`);
    const html = response.data;

    // Function to extract chapters from ytInitialData
    const extractFromYtInitialData = (data) => {
      const chapterData = data.playerOverlays?.playerOverlayRenderer?.decoratedPlayerBarRenderer?.decoratedPlayerBarRenderer?.playerBar?.multiMarkersPlayerBarRenderer?.markersMap?.find(m => m.key === "DESCRIPTION_CHAPTERS")?.value?.chapters;
      if (chapterData) {
        return chapterData.map(chapter => ({
          timestamp: chapter.chapterRenderer.timeRangeStartMillis / 1000,
          title: chapter.chapterRenderer.title.simpleText,
        }));
      }
      return null;
    };

    // Function to extract chapters from ytInitialPlayerResponse
    const extractFromYtInitialPlayerResponse = (data) => {
      if (data.chapters) {
        return data.chapters.map(chapter => ({
          timestamp: chapter.startTime,
          title: chapter.title,
        }));
      }
      return null;
    };

    // Try to extract from ytInitialData
    const ytInitialDataMatch = html.match(/ytInitialData\s*=\s*({.*?});/);
    if (ytInitialDataMatch) {
      const ytInitialData = JSON.parse(ytInitialDataMatch[1]);
      const chapters = extractFromYtInitialData(ytInitialData);
      if (chapters) return await enhanceChapters(chapters);
    }

    // Try to extract from ytInitialPlayerResponse
    const ytInitialPlayerResponseMatch = html.match(/ytInitialPlayerResponse\s*=\s*({.*?});/);
    if (ytInitialPlayerResponseMatch) {
      const ytInitialPlayerResponse = JSON.parse(ytInitialPlayerResponseMatch[1]);
      const chapters = extractFromYtInitialPlayerResponse(ytInitialPlayerResponse);
      if (chapters) return await enhanceChapters(chapters);
    }

    // If no chapters found, return null
    return null;
  } catch (error) {
    console.error('Error fetching YouTube chapters:', error);
    return null;
  }
};

const enhanceChapters = async (chapters) => {
  const enhancedChapters = [];
  for (const chapter of chapters) {
    const description = await generateChapterDescription(chapter.title);
    const emoji = await selectEmoji(chapter.title);
    enhancedChapters.push({
      emoji: emoji,
      timestamp: chapter.timestamp,
      title: chapter.title,
      description: description
    });
  }
  return enhancedChapters;
};

const generateChapterDescription = async (title) => {
  try {
    const response = await axios.post(ANTHROPIC_API_URL, {
      model: MODEL_NAME,
      max_tokens: 100,
      messages: [
        { 
          role: "user", 
          content: `Generate a brief one-sentence description for a video chapter titled "${title}". Keep it concise and relevant.`
        }
      ]
    }, {
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      }
    });

    return response.data.content[0].text.trim();
  } catch (error) {
    console.error("Error generating chapter description:", error);
    return "";
  }
};

const selectEmoji = async (title) => {
  try {
    const response = await axios.post(ANTHROPIC_API_URL, {
      model: MODEL_NAME,
      max_tokens: 10,
      messages: [
        { 
          role: "user", 
          content: `Select a single appropriate emoji for a video chapter titled "${title}". Respond with only the emoji.`
        }
      ]
    }, {
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      }
    });

    return response.data.content[0].text.trim();
  } catch (error) {
    console.error("Error selecting emoji:", error);
    return "📌";
  }
};


const getVideoKeyInsights = async (transcript) => {
  try {
    if (!transcript) throw new Error("Transcript text is empty");
    const response = await axios.post(ANTHROPIC_API_URL, {
      model: MODEL_NAME,
      max_tokens: 1000,
      messages: [
        { 
          role: "user", 
          content: `Analyze the following video transcript and provide 3-5 key insights:
                    ${transcript}
                    Format the response as a JSON array of objects with the following structure:
                    [
                      {
                        "emoji": "An appropriate emoji for this insight",
                        "title": "A concise title for this key insight",
                        "description": "A brief explanation of the key insight (1-2 sentences)"
                      },
                      // ... (3-5 insights total)
                    ]
                    Return only the JSON array, without any additional text before or after it.`
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
      const jsonStart = content.indexOf('[');
      const jsonEnd = content.lastIndexOf(']') + 1;
      const jsonContent = content.slice(jsonStart, jsonEnd);
      parsedContent = JSON.parse(jsonContent);
    } catch (parseError) {
      console.error('Error parsing JSON:', parseError);
      throw new Error("Failed to parse key insights. Invalid JSON format.");
    }

    if (!Array.isArray(parsedContent)) {
      throw new Error("Invalid key insights format. Expected an array.");
    }

    return parsedContent;
  } catch (error) {
    console.error("Error fetching video key insights:", error.response ? error.response.data : error.message);
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
    
    const summary = await getVideoSummary(transcriptText);
    return summary;
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

const getDetailedCaptions = async (videoID, lang = 'en') => {
  try {
    const subtitles = await getSubtitles({ videoID, lang });
    if (!subtitles || subtitles.length === 0) {
      throw new Error('No subtitles found');
    }
    return subtitles;
  } catch (error) {
    console.error('Error fetching detailed captions:', error);
    throw error;
  }
};

const answerQuestion = async (question, captions, chatHistory) => {
  try {
    const context = captions.map(caption => 
      `[${caption.start}s - ${parseFloat(caption.start) + parseFloat(caption.dur)}s]: ${caption.text}`
    ).join('\n');

    const chatHistoryContext = chatHistory.map(msg => `${msg.sender}: ${msg.message}`).join('\n');

    const response = await axios.post(ANTHROPIC_API_URL, {
      model: MODEL_NAME,
      max_tokens: 500,
      messages: [
        { 
          role: "user", 
          content: `You are an assistant for a YouTube video. Here are the video captions with timestamps:

${context}

Previous chat history:
${chatHistoryContext}

Based on this context and the chat history, please answer the following question:
${question}

Provide a brief, concise answer (2-3 sentences max). Focus only on the most relevant information from the video content.`
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
    console.error("Error answering question:", error.response ? error.response.data : error.message);
    throw error;
  }
};

const findVideoMoment = async (videoID, query) => {
  try {
    console.log(`Finding moment for video ${videoID} with query: ${query}`);
    const captions = await getDetailedCaptions(videoID);
    if (!captions || captions.length === 0) {
      throw new Error('No captions found for this video');
    }

    console.log(`Captions fetched, total length: ${captions.length}`);
    const transcriptText = captions.map(caption => `[${caption.start}] ${caption.text}`).join('\n');

    console.log('Sending request to Claude API');
    const response = await axios.post(ANTHROPIC_API_URL, {
      model: MODEL_NAME,
      max_tokens: 300,
      messages: [
        { 
          role: "user", 
          content: `Given the following video transcript with timestamps, find the most relevant timestamp for the query: "${query}". Return ONLY the timestamp in seconds as a number, without any additional text, explanations, or units.

Transcript:
${transcriptText}

Query: ${query}`
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

    const content = response.data.content[0].text.trim();
    console.log('Received response from Claude:', content);

    // Extract the first number from the response
    const match = content.match(/\d+(\.\d+)?/);
    if (!match) {
      console.log('No valid timestamp found in Claude response');
      throw new Error('Failed to extract a valid timestamp from the API response');
    }

    const timestamp = parseFloat(match[0]);
    if (isNaN(timestamp)) {
      console.log('Extracted value is not a valid number');
      throw new Error('Failed to extract a valid timestamp from the API response');
    }

    console.log(`Found timestamp: ${timestamp}`);
    return Math.round(timestamp); // Round to nearest second
  } catch (error) {
    console.error("Error finding video moment:", error.message);
    throw error;
  }
};

module.exports = { 
  getVideoSummary, 
  fetchSubtitles, 
  getCaptionsOnly, 
  getDetailedCaptions, 
  answerQuestion,
  getVideoSections,
  getYouTubeChapters,
  getVideoKeyInsights,
  findVideoMoment
};


//---------------------------------------------------------------------------------------------
