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
          content: `Provide a brief summary of the following video transcript in 5-7 lines:
                    ${transcript}
                    Focus on:
                    1. The main topic or theme
                    2. 2-3 key points or arguments
                    3. A brief conclusion or takeaway
                    Be concise and to the point.`
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
    console.error("Error fetching video summary:", error.response ? error.response.data : error.message);
    throw error;
  }
};

const getVideoSections = async (transcript) => {
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
                      For each section:
                      1. Provide a concise title (5-7 words max)
                      2. Write a brief description (1-2 sentences)
                      3. Include the approximate timestamp in seconds where the section begins
                      Format the response as a JSON array of objects with 'timestamp', 'title', and 'description' properties.
                      Ensure the sections cover the entire content of the video in a logical sequence.
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
      // Find the start and end of the JSON array
      const startIndex = content.indexOf('[');
      const endIndex = content.lastIndexOf(']') + 1;
      const jsonContent = content.substring(startIndex, endIndex);
      parsedContent = JSON.parse(jsonContent);
      console.log('Parsed content:', parsedContent);
    } catch (parseError) {
      console.error('Error parsing JSON:', parseError);
      throw new Error("Failed to parse video sections. Invalid JSON format.");
    }

    if (!Array.isArray(parsedContent)) {
      console.error('Parsed content is not an array');
      throw new Error("Invalid video sections format. Expected an array.");
    }

    return parsedContent;
  } catch (error) {
    console.error("Error fetching video sections:", error.message);
    throw error;
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
                    For each key insight:
                    1. Identify a significant concept, idea, or takeaway from the video
                    2. Explain its importance or relevance in 1-2 sentences
                    3. If applicable, relate it to broader contexts or implications
                    Format the response as a JSON array of strings, where each string is a complete insight.
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
      // Find the start and end of the JSON array
      const startIndex = content.indexOf('[');
      const endIndex = content.lastIndexOf(']') + 1;
      const jsonContent = content.substring(startIndex, endIndex);
      parsedContent = JSON.parse(jsonContent);
    } catch (parseError) {
      console.error('Error parsing JSON:', parseError);
      // If parsing fails, split the content into an array of insights
      parsedContent = content.split('\n').filter(item => item.trim() !== '');
    }

    if (!Array.isArray(parsedContent)) {
      parsedContent = [content];
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

module.exports = { 
  getVideoSummary, 
  fetchSubtitles, 
  getCaptionsOnly, 
  getDetailedCaptions, 
  answerQuestion,
  getVideoSections,
  getVideoKeyInsights
};


//---------------------------------------------------------------------------------------------
// let fetch;
// import('node-fetch').then(mod => {
//     fetch = mod.default;
//     global.fetch = fetch;  
// });
// const axios = require('axios');
// const { getSubtitles, getVideoDetails } = require('youtube-caption-extractor');
// const dotenv = require('dotenv');
// dotenv.config();
// const MODEL_NAME = 'claude-3-5-sonnet-20240620';
// const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
// const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

// const retryWithExponentialBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
//   for (let i = 0; i < maxRetries; i++) {
//     try {
//       return await fn();
//     } catch (error) {
//       if (i === maxRetries - 1) throw error;
//       const delay = baseDelay * Math.pow(2, i);
//       console.log(`Retry attempt ${i + 1}. Waiting for ${delay}ms before next attempt.`);
//       await new Promise(resolve => setTimeout(resolve, delay));
//     }
//   }
// };

// const getVideoSummary = async (transcript) => {
//   try {
//     if (!transcript) throw new Error("Transcript text is empty");
//     const response = await axios.post(ANTHROPIC_API_URL, {
//       model: MODEL_NAME,
//       max_tokens: 1000,
//       messages: [
//         { 
//           role: "user", 
//           content: `Provide a brief summary of the following video transcript in 5-7 lines:
//                     ${transcript}
//                     Focus on:
//                     1. The main topic or theme
//                     2. 2-3 key points or arguments
//                     3. A brief conclusion or takeaway
//                     Be concise and to the point.`
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
//     console.error("Error fetching video summary:", error.response ? error.response.data : error.message);
//     throw error;
//   }
// };

// const getVideoSections = async (transcript) => {
//   try {
//     console.log('Generating video sections from transcript');
//     if (!transcript) throw new Error("Transcript text is empty");
//     console.log('Transcript length:', transcript.length);

//     const apiCall = async () => {
//       const response = await axios.post(ANTHROPIC_API_URL, {
//         model: MODEL_NAME,
//         max_tokens: 1000,
//         messages: [
//           { 
//             role: "user", 
//             content: `Analyze the following video transcript and divide it into 5-8 logical sections:
//                       ${transcript}
//                       For each section:
//                       1. Provide a concise title (5-7 words max)
//                       2. Write a brief description (1-2 sentences)
//                       3. Include the approximate timestamp in seconds where the section begins
//                       Format the response as a JSON array of objects with 'timestamp', 'title', and 'description' properties.
//                       Ensure the sections cover the entire content of the video in a logical sequence.
//                       Return only the JSON array, without any additional text before or after it.`
//           }
//         ]
//       }, {
//         headers: {
//           'x-api-key': ANTHROPIC_API_KEY,
//           'anthropic-version': '2023-06-01',
//           'Content-Type': 'application/json'
//         }
//       });
//       return response;
//     };

//     const response = await retryWithExponentialBackoff(apiCall);

//     if (response.data.error) {
//       console.error('API error:', response.data.error);
//       throw new Error(response.data.error.message);
//     }

//     console.log('Received response from Anthropic API');
//     const content = response.data.content[0].text;
//     console.log('API response content:', content);

//     let parsedContent;
//     try {
//       // Find the start and end of the JSON array
//       const startIndex = content.indexOf('[');
//       const endIndex = content.lastIndexOf(']') + 1;
//       const jsonContent = content.substring(startIndex, endIndex);
//       parsedContent = JSON.parse(jsonContent);
//       console.log('Parsed content:', parsedContent);
//     } catch (parseError) {
//       console.error('Error parsing JSON:', parseError);
//       throw new Error("Failed to parse video sections. Invalid JSON format.");
//     }

//     if (!Array.isArray(parsedContent)) {
//       console.error('Parsed content is not an array');
//       throw new Error("Invalid video sections format. Expected an array.");
//     }

//     return parsedContent;
//   } catch (error) {
//     console.error("Error fetching video sections:", error.message);
//     throw error;
//   }
// };


// const getVideoKeyInsights = async (transcript) => {
//   try {
//     if (!transcript) throw new Error("Transcript text is empty");
//     const response = await axios.post(ANTHROPIC_API_URL, {
//       model: MODEL_NAME,
//       max_tokens: 1000,
//       messages: [
//         { 
//           role: "user", 
//           content: `Analyze the following video transcript and provide 3-5 key insights:
//                     ${transcript}
//                     For each key insight:
//                     1. Identify a significant concept, idea, or takeaway from the video
//                     2. Explain its importance or relevance in 1-2 sentences
//                     3. If applicable, relate it to broader contexts or implications
//                     Format the response as a JSON array of strings, where each string is a complete insight.`
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

//     const content = response.data.content[0].text;
//     let parsedContent;
//     try {
//       parsedContent = JSON.parse(content);
//     } catch (parseError) {
//       console.error('Error parsing JSON:', parseError);
//       return content.split('\n').filter(item => item.trim() !== '');
//     }

//     if (!Array.isArray(parsedContent)) {
//       return [content];
//     }

//     return parsedContent;
//   } catch (error) {
//     console.error("Error fetching video key insights:", error.response ? error.response.data : error.message);
//     throw error;
//   }
// };

// const fetchSubtitles = async (videoID, lang = 'en') => {
//   try {
//     const subtitles = await getSubtitles({ videoID, lang });
//     if (!subtitles || subtitles.length === 0) {
//       throw new Error('No subtitles found');
//     }
//     const transcriptText = subtitles.map(sub => sub.text).join(' ');
//     console.log("Transcript text:", transcriptText);
    
//     const summary = await getVideoSummary(transcriptText);
//     return summary;
//   } catch (error) {
//     console.error('Error fetching subtitles and summary:', error);
//     throw error;
//   }
// };

// const getCaptionsOnly = async (videoID, lang = 'en') => {
//   try {
//     const subtitles = await getSubtitles({ videoID, lang });
//     if (!subtitles || subtitles.length === 0) {
//       throw new Error('No subtitles found');
//     }
//     const joinedCaptions = subtitles.map(sub => sub.text).join(' ');
//     console.log("Joined Captions:", joinedCaptions);
    
//     return joinedCaptions;
//   } catch (error) {
//     console.error('Error fetching captions:', error);
//     throw error;
//   }
// };

// const getDetailedCaptions = async (videoID, lang = 'en') => {
//   try {
//     const subtitles = await getSubtitles({ videoID, lang });
//     if (!subtitles || subtitles.length === 0) {
//       throw new Error('No subtitles found');
//     }
//     return subtitles;
//   } catch (error) {
//     console.error('Error fetching detailed captions:', error);
//     throw error;
//   }
// };

// const answerQuestion = async (question, captions, chatHistory) => {
//   try {
//     const context = captions.map(caption => 
//       `[${caption.start}s - ${parseFloat(caption.start) + parseFloat(caption.dur)}s]: ${caption.text}`
//     ).join('\n');

//     const chatHistoryContext = chatHistory.map(msg => `${msg.sender}: ${msg.message}`).join('\n');

//     const response = await axios.post(ANTHROPIC_API_URL, {
//       model: MODEL_NAME,
//       max_tokens: 500,
//       messages: [
//         { 
//           role: "user", 
//           content: `You are an assistant for a YouTube video. Here are the video captions with timestamps:

// ${context}

// Previous chat history:
// ${chatHistoryContext}

// Based on this context and the chat history, please answer the following question:
// ${question}

// Provide a brief, concise answer (2-3 sentences max). Focus only on the most relevant information from the video content.`
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
//     console.error("Error answering question:", error.response ? error.response.data : error.message);
//     throw error;
//   }
// };

// module.exports = { 
//   getVideoSummary, 
//   fetchSubtitles, 
//   getCaptionsOnly, 
//   getDetailedCaptions, 
//   answerQuestion,
//   getVideoSections,
//   getVideoKeyInsights
// };