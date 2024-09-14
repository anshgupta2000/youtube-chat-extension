chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getSummary') {
      const videoUrl = request.url;
      const videoId = extractVideoId(videoUrl);
      
      if (!videoId) {
        sendResponse({ success: false, error: 'Invalid YouTube URL' });
        return false;
      }
  
      fetchSummary(videoId)
        .then(summary => {
          sendResponse({ success: true, summary: summary });
        })
        .catch(error => {
          console.error('Error fetching summary:', error);
          sendResponse({ success: false, error: error.message || 'Failed to fetch video data' });
        });
  
      return true; // Indicates that the response will be sent asynchronously
    } else if (request.action === 'getVideoSections') {
        const videoUrl = request.url;
        const videoId = extractVideoId(videoUrl);
        
        if (!videoId) {
          sendResponse({ success: false, error: 'Invalid YouTube URL' });
          return false;
        }
    
        fetchVideoSections(videoId)
          .then(sections => {
            console.log('Fetched video sections:', sections);
            sendResponse({ success: true, sections: sections });
          })
          .catch(error => {
            console.error('Error fetching video sections:', error);
            sendResponse({ success: false, error: error.message || 'Failed to fetch video sections. Please try again later.' });
          });
    
        return true;
      } else if (request.action === 'getKeyInsights') {
        const videoUrl = request.url;
        const videoId = extractVideoId(videoUrl);
        
        if (!videoId) {
          sendResponse({ success: false, error: 'Invalid YouTube URL' });
          return false;
        }
    
        fetchKeyInsights(videoId)
          .then(keyInsights => {
            sendResponse({ success: true, keyInsights: keyInsights });
          })
          .catch(error => {
            console.error('Error fetching key insights:', error);
            sendResponse({ success: false, error: error.message || 'Failed to fetch key insights' });
          });
    
        return true;
      } else if (request.action === 'answerQuestion') {
      const videoUrl = request.url;
      const question = request.question;
      const chatHistory = request.chatHistory;
      const videoId = extractVideoId(videoUrl);
      
      if (!videoId) {
        sendResponse({ success: false, error: 'Invalid YouTube URL' });
        return false;
      }
  
      fetch(`http://localhost:5001/summary/answer-question`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ videoID: videoId, question: question, chatHistory: chatHistory }),
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          sendResponse({ success: true, answer: data.answer });
        })
        .catch(error => {
          console.error('Error answering question:', error);
          sendResponse({ success: false, error: error.message || 'Failed to answer question' });
        });
  
      return true; // Indicates that the response will be sent asynchronously
    }
  });
  
  function extractVideoId(url) {
    const match = url.match(/(?:https?:\/\/)?(?:www\.)?youtube\.com\/.*(?:v=|\/embed\/|\/v\/|youtu\.be\/|\/watch\?v=|&v=)([^#&?]*).*/);
    return match ? match[1] : null;
  }
  
  async function fetchSummary(videoId) {
    try {
      const summaryResponse = await fetch(`http://localhost:5001/summary/captions?videoId=${videoId}`);
      
      if (!summaryResponse.ok) {
        throw new Error(`HTTP error! status: ${summaryResponse.status}`);
      }
  
      const summaryData = await summaryResponse.json();
  
      if (summaryData.captions && summaryData.captions.content && summaryData.captions.content.length > 0) {
        return summaryData.captions.content[0].text;
      } else {
        return "No summary available";
      }
    } catch (error) {
      console.error('Error in fetchSummary:', error);
      throw error;
    }
  }
  
  async function fetchVideoSections(videoId) {
    try {
      console.log('Fetching video sections for videoId:', videoId);
      const sectionsResponse = await fetch(`http://localhost:5001/summary/video-sections?videoId=${videoId}`);
      
      if (!sectionsResponse.ok) {
        const errorText = await sectionsResponse.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed to fetch video sections. Please try again later.`);
      }
  
      const sectionsData = await sectionsResponse.json();
      console.log('Received sections data:', sectionsData);
      return sectionsData.sections;
    } catch (error) {
      console.error('Error in fetchVideoSections:', error);
      throw error;
    }
  }
  
  async function fetchKeyInsights(videoId) {
    try {
      const keyInsightsResponse = await fetch(`http://localhost:5001/summary/key-insights?videoId=${videoId}`);
      
      if (!keyInsightsResponse.ok) {
        throw new Error(`HTTP error! status: ${keyInsightsResponse.status}`);
      }
  
      const keyInsightsData = await keyInsightsResponse.json();
      return keyInsightsData.keyInsights;
    } catch (error) {
      console.error('Error in fetchKeyInsights:', error);
      throw error;
    }
  }


//---------------------------------------------------------------------------------------------
// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//     if (request.action === 'getSummary') {
//       const videoUrl = request.url;
//       const videoId = extractVideoId(videoUrl);
      
//       if (!videoId) {
//         sendResponse({ success: false, error: 'Invalid YouTube URL' });
//         return false;
//       }
  
//       fetchSummary(videoId)
//         .then(summary => {
//           sendResponse({ success: true, summary: summary });
//         })
//         .catch(error => {
//           console.error('Error fetching summary:', error);
//           sendResponse({ success: false, error: error.message || 'Failed to fetch video data' });
//         });
  
//       return true; // Indicates that the response will be sent asynchronously
//     } else if (request.action === 'getHighlights') {
//         const videoUrl = request.url;
//         const videoId = extractVideoId(videoUrl);
        
//         if (!videoId) {
//           sendResponse({ success: false, error: 'Invalid YouTube URL' });
//           return false;
//         }
    
//         fetchHighlights(videoId)
//           .then(highlights => {
//             sendResponse({ success: true, highlights: highlights });
//           })
//           .catch(error => {
//             console.error('Error fetching highlights:', error);
//             sendResponse({ success: false, error: error.message || 'Failed to fetch video highlights' });
//           });
    
//         return true; // Indicates that the response will be sent asynchronously
//       } else if (request.action === 'getActionItems') {
//         const videoUrl = request.url;
//         const videoId = extractVideoId(videoUrl);
        
//         if (!videoId) {
//           sendResponse({ success: false, error: 'Invalid YouTube URL' });
//           return false;
//         }
    
//         fetchActionItems(videoId)
//           .then(actionItems => {
//             sendResponse({ success: true, actionItems: actionItems });
//           })
//           .catch(error => {
//             console.error('Error fetching action items:', error);
//             sendResponse({ success: false, error: error.message || 'Failed to fetch action items' });
//           });
    
//         return true; // Indicates that the response will be sent asynchronously
//       } else if (request.action === 'answerQuestion') {
//       const videoUrl = request.url;
//       const question = request.question;
//       const chatHistory = request.chatHistory;
//       const videoId = extractVideoId(videoUrl);
      
//       if (!videoId) {
//         sendResponse({ success: false, error: 'Invalid YouTube URL' });
//         return false;
//       }
  
//       fetch(`http://localhost:5001/summary/answer-question`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ videoID: videoId, question: question, chatHistory: chatHistory }),
//       })
//         .then(response => {
//           if (!response.ok) {
//             throw new Error(`HTTP error! status: ${response.status}`);
//           }
//           return response.json();
//         })
//         .then(data => {
//           sendResponse({ success: true, answer: data.answer });
//         })
//         .catch(error => {
//           console.error('Error answering question:', error);
//           sendResponse({ success: false, error: error.message || 'Failed to answer question' });
//         });
  
//       return true; // Indicates that the response will be sent asynchronously
//     }
//   });
  
//   function extractVideoId(url) {
//     const match = url.match(/(?:https?:\/\/)?(?:www\.)?youtube\.com\/.*(?:v=|\/embed\/|\/v\/|youtu\.be\/|\/watch\?v=|&v=)([^#&?]*).*/);
//     return match ? match[1] : null;
//   }
  
//   async function fetchSummary(videoId) {
//     try {
//       const summaryResponse = await fetch(`http://localhost:5001/summary/captions?videoId=${videoId}`);
      
//       if (!summaryResponse.ok) {
//         throw new Error(`HTTP error! status: ${summaryResponse.status}`);
//       }
  
//       const summaryData = await summaryResponse.json();
  
//       if (summaryData.captions && summaryData.captions.content && summaryData.captions.content.length > 0) {
//         return summaryData.captions.content[0].text;
//       } else {
//         return "No summary available";
//       }
//     } catch (error) {
//       console.error('Error in fetchSummary:', error);
//       throw error;
//     }
//   }
  
//   async function fetchHighlights(videoId) {
//     try {
//       const highlightsResponse = await fetch(`http://localhost:5001/summary/highlights?videoId=${videoId}`);
      
//       if (!highlightsResponse.ok) {
//         throw new Error(`HTTP error! status: ${highlightsResponse.status}`);
//       }
  
//       const highlightsData = await highlightsResponse.json();
//       return highlightsData.highlights;
//     } catch (error) {
//       console.error('Error in fetchHighlights:', error);
//       throw error;
//     }
//   }
  
//   async function fetchActionItems(videoId) {
//     try {
//       const actionItemsResponse = await fetch(`http://localhost:5001/summary/action-items?videoId=${videoId}`);
      
//       if (!actionItemsResponse.ok) {
//         throw new Error(`HTTP error! status: ${actionItemsResponse.status}`);
//       }
  
//       const actionItemsData = await actionItemsResponse.json();
//       return actionItemsData.actionItems;
//     } catch (error) {
//       console.error('Error in fetchActionItems:', error);
//       throw error;
//     }
//   }