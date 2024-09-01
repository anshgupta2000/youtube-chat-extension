chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getSummary') {
      const videoUrl = request.url;
      const videoId = extractVideoId(videoUrl);
      
      if (!videoId) {
        sendResponse({ success: false, error: 'Invalid YouTube URL' });
        return;
      }
  
      fetchSummary(videoId)
        .then(summary => {
          sendResponse({ success: true, summary: summary });
        })
        .catch(error => {
          console.error('Error fetching summary:', error);
          sendResponse({ success: false, error: 'Failed to fetch video data' });
        });
  
      return true; // Indicates that the response will be sent asynchronously
    }
  });
  
  function extractVideoId(url) {
    const match = url.match(/(?:https?:\/\/)?(?:www\.)?youtube\.com\/.*v=([^&]*)/);
    return match ? match[1] : null;
  }
  
  async function fetchSummary(videoId) {
    try {
      const summaryResponse = await fetch(`http://localhost:5001/summary/captions?videoId=${videoId}`);
      
      if (!summaryResponse.ok) {
        throw new Error('Failed to fetch data from server');
      }
  
      const summaryData = await summaryResponse.json();
  
      const summary = summaryData.captions && summaryData.captions.content[0].text.length > 0 
        ? summaryData.captions.content[0].text 
        : "No summary available";
  
      return summary;
    } catch (error) {
      console.error('Error in fetchSummary:', error);
      throw error;
    }
  }

//-----------------------------------------------------------------------------------------------

// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//     if (request.action === 'getSummary') {
//       const videoUrl = request.url;
//       const videoId = extractVideoId(videoUrl);
      
//       if (!videoId) {
//         sendResponse({ success: false, error: 'Invalid YouTube URL' });
//         return;
//       }
  
//       fetchSummaryAndCaptions(videoId)
//         .then(data => {
//           sendResponse({ success: true, summary: data.summary, captions: data.captions });
//         })
//         .catch(error => {
//           console.error('Error fetching summary:', error);
//           sendResponse({ success: false, error: 'Failed to fetch video data' });
//         });
  
//       return true; // Indicates that the response will be sent asynchronously
//     }
//   });
  
//   function extractVideoId(url) {
//     const match = url.match(/(?:https?:\/\/)?(?:www\.)?youtube\.com\/.*v=([^&]*)/);
//     return match ? match[1] : null;
//   }
  
//   async function fetchSummaryAndCaptions(videoId) {
//     try {
//       const summaryResponse = await fetch(`http://localhost:5001/summary/captions?videoId=${videoId}`);
//       const captionsResponse = await fetch(`http://localhost:5001/summary/only-captions?videoId=${videoId}`);
      
//       if (!summaryResponse.ok || !captionsResponse.ok) {
//         throw new Error('Failed to fetch data from server');
//       }
  
//       const summaryData = await summaryResponse.json();
//       const captionsData = await captionsResponse.json();
  
//       const summary = summaryData.captions && summaryData.captions.content[0].text.length > 0 
//         ? summaryData.captions.content[0].text 
//         : "No summary available";
//       const captions = captionsData.captions || "No captions available";
  
//       return { summary, captions };
//     } catch (error) {
//       console.error('Error in fetchSummaryAndCaptions:', error);
//       throw error;
//     }
//   }