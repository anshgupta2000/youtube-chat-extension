console.log("YouTube Chat Extension content script loaded");
let chatHistory = [];
let currentVideoId = '';

function createChatInterface() {
  const container = document.createElement('div');
  container.id = 'yt-chat-container';
  container.innerHTML = `
    <button id="yt-chat-toggle">Chat</button>
    <div id="yt-chat-panel">
      <div id="yt-chat-header">
        <h3>YouTube Video Chat</h3>
        <button id="yt-chat-close">×</button>
      </div>
      <div id="yt-chat-content">
        <div id="yt-chat-messages"></div>
        <input type="text" id="yt-chat-input" placeholder="Ask a question...">
        <button id="yt-chat-send">Send</button>
        <div id="yt-chat-actions">
          <button id="yt-chat-summarize">Summarize Video</button>
          <button id="yt-chat-sections">Video Sections</button>
          <button id="yt-chat-key-insights">Key Insights</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(container);

  document.getElementById('yt-chat-toggle').addEventListener('click', togglePanel);
  document.getElementById('yt-chat-close').addEventListener('click', togglePanel);
  document.getElementById('yt-chat-send').addEventListener('click', sendMessage);
  document.getElementById('yt-chat-summarize').addEventListener('click', getSummary);
  document.getElementById('yt-chat-sections').addEventListener('click', getVideoSections);
  document.getElementById('yt-chat-key-insights').addEventListener('click', getKeyInsights);
  document.getElementById('yt-chat-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') sendMessage();
  });

  const messagesDiv = document.getElementById('yt-chat-messages');
  const observer = new MutationObserver(() => {
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  });
  observer.observe(messagesDiv, { childList: true });
}

function togglePanel() {
  const panel = document.getElementById('yt-chat-panel');
  panel.classList.toggle('open');
  const toggleButton = document.getElementById('yt-chat-toggle');
  toggleButton.style.display = panel.classList.contains('open') ? 'none' : 'block';
}

function sendMessage() {
  const input = document.getElementById('yt-chat-input');
  const message = input.value.trim();
  if (message) {
    addMessageToChat('You', message);
    chatHistory.push({ sender: 'You', message: message });
    input.value = '';
    chrome.runtime.sendMessage({
      action: 'answerQuestion',
      url: window.location.href,
      question: message,
      chatHistory: chatHistory
    }, function(response) {
      if (response.success) {
        addMessageToChat('Assistant', formatResponse(response.answer));
        chatHistory.push({ sender: 'Assistant', message: response.answer });
        saveChatHistory();
      } else {
        const errorMessage = 'Sorry, I couldn\'t answer that question. Please try rephrasing or asking something else.';
        addMessageToChat('Assistant', errorMessage);
        chatHistory.push({ sender: 'Assistant', message: errorMessage });
        saveChatHistory();
      }
    });
  }
}

function formatResponse(response) {
  const paragraphs = response.split('\n').filter(p => p.trim() !== '');
  
  const formattedParagraphs = paragraphs.map(paragraph => {
    if (/^([\w\s]+):/.test(paragraph)) {
      return `<br><strong>${paragraph}</strong>`;
    }
    
    const sentences = paragraph.split(/(?<=[.!?])\s+/);
    
    const formattedSentences = sentences.map(sentence => {
      if (/^(\d+[\.):]|\w[\.):]|•|\-)\s/.test(sentence)) {
        return `<br>• ${sentence.replace(/^(\d+[\.):]|\w[\.):]|•|\-)\s/, '')}`;
      }
      if (/\d+(:?\d+)?(\s*-\s*\d+(:?\d+)?)?(\s*min:?|\s*:)/.test(sentence)) {
        return `<br>${sentence}`;
      }
      return sentence;
    });

    return formattedSentences.join(' ');
  });

  return formattedParagraphs.join('<br><br>');
}

function addMessageToChat(sender, message) {
  const messagesDiv = document.getElementById('yt-chat-messages');
  const messageElement = document.createElement('div');
  messageElement.className = 'chat-message';
  messageElement.innerHTML = `<strong>${sender}:</strong> <pre>${message}</pre>`;
  messagesDiv.appendChild(messageElement);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;

  // Add event listeners to timestamp links
  const timestampLinks = messageElement.querySelectorAll('.timestamp-link');
  timestampLinks.forEach(link => {
    link.addEventListener('click', handleTimestampClick);
  });
}

function handleTimestampClick(event) {
  event.preventDefault();
  const time = parseInt(event.target.getAttribute('data-time'));
  seekYouTubeVideo(time);
}

function seekYouTubeVideo(time) {
  const videoElement = document.querySelector('video');
  if (videoElement) {
    videoElement.currentTime = time;
    videoElement.play();
  } else {
    console.error('Unable to find video element');
  }
}

function getSummary() {
  const videoUrl = window.location.href;
  addMessageToChat('System', 'Fetching video summary...');
  chatHistory.push({ sender: 'System', message: 'Fetching video summary...' });
  chrome.runtime.sendMessage({action: 'getSummary', url: videoUrl}, function(response) {
    if (response && response.success) {
      const summaryMessage = `Summary: ${response.summary}`;
      addMessageToChat('Assistant', formatResponse(summaryMessage));
      chatHistory.push({ sender: 'Assistant', message: summaryMessage });
    } else {
      const errorMessage = response && response.error ? `Error: ${response.error}` : 'Error: Failed to fetch video summary';
      addMessageToChat('System', errorMessage);
      chatHistory.push({ sender: 'System', message: errorMessage });
    }
    saveChatHistory();
  });
}


function getVideoSections() {
  const videoUrl = window.location.href;
  addMessageToChat('System', 'Fetching video sections...');
  chatHistory.push({ sender: 'System', message: 'Fetching video sections...' });
  chrome.runtime.sendMessage({action: 'getVideoSections', url: videoUrl}, function(response) {
    if (response && response.success && Array.isArray(response.sections)) {
      const sectionsMessage = formatVideoSections(response.sections);
      addMessageToChat('Assistant', sectionsMessage);
      chatHistory.push({ sender: 'Assistant', message: sectionsMessage });
    } else {
      const errorMessage = response && response.error ? `Error: ${response.error}` : 'Error: Failed to fetch video sections';
      addMessageToChat('System', errorMessage);
      chatHistory.push({ sender: 'System', message: errorMessage });
    }
    saveChatHistory();
  });
}

function formatVideoSections(sections) {
  let formattedSections = "Video Sections:\n\n";
  sections.forEach((section, index) => {
    const timestamp = formatTimestamp(section.timestamp);
    formattedSections += `${index + 1}. <a href="#" class="timestamp-link" data-time="${section.timestamp}">[${timestamp}]</a> ${section.title}\n\n`;
    formattedSections += `   ${section.description}\n\n`;
  });
  return formattedSections;
}

function getKeyInsights() {
  const videoUrl = window.location.href;
  addMessageToChat('System', 'Fetching key insights...');
  chatHistory.push({ sender: 'System', message: 'Fetching key insights...' });
  chrome.runtime.sendMessage({action: 'getKeyInsights', url: videoUrl}, function(response) {
    if (response && response.success && Array.isArray(response.keyInsights)) {
      const keyInsightsMessage = formatKeyInsights(response.keyInsights);
      addMessageToChat('Assistant', keyInsightsMessage);
      chatHistory.push({ sender: 'Assistant', message: keyInsightsMessage });
    } else {
      const errorMessage = response && response.error ? `Error: ${response.error}` : 'Error: Failed to fetch key insights';
      addMessageToChat('System', errorMessage);
      chatHistory.push({ sender: 'System', message: errorMessage });
    }
    saveChatHistory();
  });
}

function formatKeyInsights(keyInsights) {
  let formattedInsights = "Key Insights:\n\n";
  keyInsights.forEach((insight, index) => {
    formattedInsights += `${index + 1}. ${insight}\n\n`;
  });
  return formattedInsights;
}

function formatActionItems(actionItems) {
  let formattedActionItems = "Action Items:\n\n";
  actionItems.forEach((item, index) => {
    formattedActionItems += `${index + 1}. ${item}\n\n`;
  });
  return formattedActionItems;
}

function formatTimestamp(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}


function extractVideoId(url) {
  const match = url.match(/(?:https?:\/\/)?(?:www\.)?youtube\.com\/.*(?:v=|\/embed\/|\/v\/|youtu\.be\/|\/watch\?v=|&v=)([^#&?]*).*/);
  return match ? match[1] : null;
}

function saveChatHistory() {
  chrome.storage.local.set({ [currentVideoId]: chatHistory }, function() {
    console.log('Chat history saved for video:', currentVideoId);
  });
}

function loadChatHistory(videoId) {
  chrome.storage.local.get([videoId], function(result) {
    if (result[videoId]) {
      chatHistory = result[videoId];
      const messagesDiv = document.getElementById('yt-chat-messages');
      messagesDiv.innerHTML = ''; // Clear existing messages
      chatHistory.forEach(msg => addMessageToChat(msg.sender, formatResponse(msg.message)));
    } else {
      chatHistory = []; // Reset chat history if no saved history for this video
      const messagesDiv = document.getElementById('yt-chat-messages');
      messagesDiv.innerHTML = ''; // Clear existing messages
    }
  });
}

function initializeChat() {
  const newVideoId = extractVideoId(window.location.href);
  if (newVideoId && newVideoId !== currentVideoId) {
    currentVideoId = newVideoId;
    loadChatHistory(currentVideoId);
  }
}

// Initialize chat interface and history
createChatInterface();
initializeChat();

// Listen for URL changes (e.g., when navigating between videos)
let lastUrl = location.href; 
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    initializeChat();
  }
}).observe(document, {subtree: true, childList: true});

// Reinitialize chat when the page is refreshed
window.addEventListener('load', initializeChat);

//---------------------------------------------------------------------------------------------
// console.log("YouTube Chat Extension content script loaded");
// let chatHistory = [];
// let currentVideoId = '';

// function createChatInterface() {
//   const container = document.createElement('div');
//   container.id = 'yt-chat-container';
//   container.innerHTML = `
//     <button id="yt-chat-toggle">Chat</button>
//     <div id="yt-chat-panel">
//       <div id="yt-chat-header">
//         <h3>YouTube Video Chat</h3>
//         <button id="yt-chat-close">×</button>
//       </div>
//       <div id="yt-chat-content">
//         <div id="yt-chat-messages"></div>
//         <input type="text" id="yt-chat-input" placeholder="Ask a question...">
//         <button id="yt-chat-send">Send</button>
//         <div id="yt-chat-actions">
//           <button id="yt-chat-summarize">Summarize Video</button>
//           <button id="yt-chat-sections">Video Sections</button>
//           <button id="yt-chat-key-insights">Key Insights</button>
//         </div>
//       </div>
//     </div>
//   `;
//   document.body.appendChild(container);

//   document.getElementById('yt-chat-toggle').addEventListener('click', togglePanel);
//   document.getElementById('yt-chat-close').addEventListener('click', togglePanel);
//   document.getElementById('yt-chat-send').addEventListener('click', sendMessage);
//   document.getElementById('yt-chat-summarize').addEventListener('click', getSummary);
//   document.getElementById('yt-chat-sections').addEventListener('click', getVideoSections);
//   document.getElementById('yt-chat-key-insights').addEventListener('click', getKeyInsights);
//   document.getElementById('yt-chat-input').addEventListener('keypress', function(e) {
//     if (e.key === 'Enter') sendMessage();
//   });

//   const messagesDiv = document.getElementById('yt-chat-messages');
//   const observer = new MutationObserver(() => {
//     messagesDiv.scrollTop = messagesDiv.scrollHeight;
//   });
//   observer.observe(messagesDiv, { childList: true });
// }

// function togglePanel() {
//   const panel = document.getElementById('yt-chat-panel');
//   panel.classList.toggle('open');
//   const toggleButton = document.getElementById('yt-chat-toggle');
//   toggleButton.style.display = panel.classList.contains('open') ? 'none' : 'block';
// }

// function sendMessage() {
//   const input = document.getElementById('yt-chat-input');
//   const message = input.value.trim();
//   if (message) {
//     addMessageToChat('You', message);
//     chatHistory.push({ sender: 'You', message: message });
//     input.value = '';
//     chrome.runtime.sendMessage({
//       action: 'answerQuestion',
//       url: window.location.href,
//       question: message,
//       chatHistory: chatHistory
//     }, function(response) {
//       if (response.success) {
//         addMessageToChat('Assistant', formatResponse(response.answer));
//         chatHistory.push({ sender: 'Assistant', message: response.answer });
//         saveChatHistory();
//       } else {
//         const errorMessage = 'Sorry, I couldn\'t answer that question. Please try rephrasing or asking something else.';
//         addMessageToChat('Assistant', errorMessage);
//         chatHistory.push({ sender: 'Assistant', message: errorMessage });
//         saveChatHistory();
//       }
//     });
//   }
// }

// function formatResponse(response) {
//   const paragraphs = response.split('\n').filter(p => p.trim() !== '');
  
//   const formattedParagraphs = paragraphs.map(paragraph => {
//     if (/^([\w\s]+):/.test(paragraph)) {
//       return `<br><strong>${paragraph}</strong>`;
//     }
    
//     const sentences = paragraph.split(/(?<=[.!?])\s+/);
    
//     const formattedSentences = sentences.map(sentence => {
//       if (/^(\d+[\.):]|\w[\.):]|•|\-)\s/.test(sentence)) {
//         return `<br>• ${sentence.replace(/^(\d+[\.):]|\w[\.):]|•|\-)\s/, '')}`;
//       }
//       if (/\d+(:?\d+)?(\s*-\s*\d+(:?\d+)?)?(\s*min:?|\s*:)/.test(sentence)) {
//         return `<br>${sentence}`;
//       }
//       return sentence;
//     });

//     return formattedSentences.join(' ');
//   });

//   return formattedParagraphs.join('<br><br>');
// }

// function addMessageToChat(sender, message) {
//   const messagesDiv = document.getElementById('yt-chat-messages');
//   const messageElement = document.createElement('div');
//   messageElement.className = 'chat-message';
//   messageElement.innerHTML = `<strong>${sender}:</strong> <pre>${message}</pre>`;
//   messagesDiv.appendChild(messageElement);
//   messagesDiv.scrollTop = messagesDiv.scrollHeight;

//   // Add event listeners to timestamp links
//   const timestampLinks = messageElement.querySelectorAll('.timestamp-link');
//   timestampLinks.forEach(link => {
//     link.addEventListener('click', handleTimestampClick);
//   });
// }

// function handleTimestampClick(event) {
//   event.preventDefault();
//   const time = parseInt(event.target.getAttribute('data-time'));
//   seekYouTubeVideo(time);
// }

// function seekYouTubeVideo(time) {
//   const videoElement = document.querySelector('video');
//   if (videoElement) {
//     videoElement.currentTime = time;
//     videoElement.play();
//   } else {
//     console.error('Unable to find video element');
//   }
// }

// function getSummary() {
//   const videoUrl = window.location.href;
//   addMessageToChat('System', 'Fetching video summary...');
//   chatHistory.push({ sender: 'System', message: 'Fetching video summary...' });
//   chrome.runtime.sendMessage({action: 'getSummary', url: videoUrl}, function(response) {
//     if (response && response.success) {
//       const summaryMessage = `Summary: ${response.summary}`;
//       addMessageToChat('Assistant', formatResponse(summaryMessage));
//       chatHistory.push({ sender: 'Assistant', message: summaryMessage });
//     } else {
//       const errorMessage = response && response.error ? `Error: ${response.error}` : 'Error: Failed to fetch video summary';
//       addMessageToChat('System', errorMessage);
//       chatHistory.push({ sender: 'System', message: errorMessage });
//     }
//     saveChatHistory();
//   });
// }


// function getVideoSections() {
//   const videoUrl = window.location.href;
//   addMessageToChat('System', 'Fetching video sections...');
//   chatHistory.push({ sender: 'System', message: 'Fetching video sections...' });
//   chrome.runtime.sendMessage({action: 'getVideoSections', url: videoUrl}, function(response) {
//     if (response && response.success && Array.isArray(response.sections)) {
//       const sectionsMessage = formatVideoSections(response.sections);
//       addMessageToChat('Assistant', sectionsMessage);
//       chatHistory.push({ sender: 'Assistant', message: sectionsMessage });
//     } else {
//       const errorMessage = response && response.error ? `Error: ${response.error}` : 'Error: Failed to fetch video sections';
//       addMessageToChat('System', errorMessage);
//       chatHistory.push({ sender: 'System', message: errorMessage });
//     }
//     saveChatHistory();
//   });
// }

// function formatVideoSections(sections) {
//   let formattedSections = "Video Sections:\n\n";
//   sections.forEach((section, index) => {
//     const timestamp = formatTimestamp(section.timestamp);
//     formattedSections += `${index + 1}. <a href="#" class="timestamp-link" data-time="${section.timestamp}">[${timestamp}]</a> ${section.title}\n\n`;
//     formattedSections += `   ${section.description}\n\n`;
//   });
//   return formattedSections;
// }

// function getKeyInsights() {
//   const videoUrl = window.location.href;
//   addMessageToChat('System', 'Fetching key insights...');
//   chatHistory.push({ sender: 'System', message: 'Fetching key insights...' });
//   chrome.runtime.sendMessage({action: 'getKeyInsights', url: videoUrl}, function(response) {
//     if (response && response.success) {
//       const keyInsightsMessage = formatKeyInsights(response.keyInsights);
//       addMessageToChat('Assistant', keyInsightsMessage);
//       chatHistory.push({ sender: 'Assistant', message: keyInsightsMessage });
//     } else {
//       const errorMessage = response && response.error ? `Error: ${response.error}` : 'Error: Failed to fetch key insights';
//       addMessageToChat('System', errorMessage);
//       chatHistory.push({ sender: 'System', message: errorMessage });
//     }
//     saveChatHistory();
//   });
// }

// function formatKeyInsights(keyInsights) {
//   let formattedInsights = "Key Insights:\n\n";
//   keyInsights.forEach((insight, index) => {
//     formattedInsights += `${index + 1}. ${insight}\n\n`;
//   });
//   return formattedInsights;
// }

// function formatActionItems(actionItems) {
//   let formattedActionItems = "Action Items:\n\n";
//   actionItems.forEach((item, index) => {
//     formattedActionItems += `${index + 1}. ${item}\n\n`;
//   });
//   return formattedActionItems;
// }

// function formatTimestamp(seconds) {
//   const minutes = Math.floor(seconds / 60);
//   const remainingSeconds = Math.floor(seconds % 60);
//   return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
// }


// function extractVideoId(url) {
//   const match = url.match(/(?:https?:\/\/)?(?:www\.)?youtube\.com\/.*(?:v=|\/embed\/|\/v\/|youtu\.be\/|\/watch\?v=|&v=)([^#&?]*).*/);
//   return match ? match[1] : null;
// }

// function saveChatHistory() {
//   chrome.storage.local.set({ [currentVideoId]: chatHistory }, function() {
//     console.log('Chat history saved for video:', currentVideoId);
//   });
// }

// function loadChatHistory(videoId) {
//   chrome.storage.local.get([videoId], function(result) {
//     if (result[videoId]) {
//       chatHistory = result[videoId];
//       const messagesDiv = document.getElementById('yt-chat-messages');
//       messagesDiv.innerHTML = ''; // Clear existing messages
//       chatHistory.forEach(msg => addMessageToChat(msg.sender, formatResponse(msg.message)));
//     } else {
//       chatHistory = []; // Reset chat history if no saved history for this video
//       const messagesDiv = document.getElementById('yt-chat-messages');
//       messagesDiv.innerHTML = ''; // Clear existing messages
//     }
//   });
// }

// function initializeChat() {
//   const newVideoId = extractVideoId(window.location.href);
//   if (newVideoId && newVideoId !== currentVideoId) {
//     currentVideoId = newVideoId;
//     loadChatHistory(currentVideoId);
//   }
// }

// // Initialize chat interface and history
// createChatInterface();
// initializeChat();

// // Listen for URL changes (e.g., when navigating between videos)
// let lastUrl = location.href; 
// new MutationObserver(() => {
//   const url = location.href;
//   if (url !== lastUrl) {
//     lastUrl = url;
//     initializeChat();
//   }
// }).observe(document, {subtree: true, childList: true});

// // Reinitialize chat when the page is refreshed
// window.addEventListener('load', initializeChat);