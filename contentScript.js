console.log("YouTube Chat Extension content script loaded");
let chatHistory = [];
let currentVideoId = '';

function createChatInterface() {
  const container = document.createElement('div');
  container.id = 'yt-chat-container';
  container.innerHTML = `
  <button id="yt-chat-toggle">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
        <path d="M7 9h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z"/>
      </svg>
      TubeChat AI
    </button>
    <div id="yt-chat-panel">
      <div id="yt-chat-header">
        <h3>TubeChat AI</h3>
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
  setupTimestampClickHandlers();
}

function togglePanel() {
  const panel = document.getElementById('yt-chat-panel');
  const toggleButton = document.getElementById('yt-chat-toggle');
  panel.classList.toggle('open');
  toggleButton.classList.toggle('hidden');
}

function resetButtonStyles() {
  const button = document.getElementById('yt-chat-toggle');
  button.style.cssText = `
    position: fixed !important;
    top: calc(50% + 100px) !important;
    right: 0 !important;
    background-color: #ff0000 !important;
    color: white !important;
    border: none !important;
    border-top-left-radius: 20px !important;
    border-bottom-left-radius: 20px !important;
    border-top-right-radius: 0 !important;
    border-bottom-right-radius: 0 !important;
    padding: 8px 12px 8px 16px !important;
    cursor: pointer !important;
    z-index: 9000 !important;
    font-size: 14px !important;
    font-weight: 500 !important;
    display: flex !important;
    align-items: center !important;
    transition: transform 0.3s ease-in-out, background-color 0.2s !important;
    box-shadow: -2px 2px 5px rgba(0, 0, 0, 0.2) !important;
    width: auto !important;
    height: auto !important;
    margin: 0 !important;
    outline: none !important;
    text-align: left !important;
  `;
}

document.addEventListener('DOMContentLoaded', resetButtonStyles);

function getCurrentVideoTimestamp() {
  const video = document.querySelector('video');
  if (video) {
    const currentTime = video.currentTime;
    return formatTimestamp(currentTime);
  }
  return null;
}

function isTimestampQuestion(message) {
  const lowercaseMessage = message.toLowerCase();
  const timestampPatterns = [
    /what(?:'s| is)? (?:the )?(?:current |present )?(?:time|timestamp)/,
    /(?:how|where) far (?:into|in|through) the video/,
    /(?:what|which) part of the video/,
    /(?:tell|show) me (?:the )?(?:current |present )?(?:time|timestamp)/,
    /(?:what|where) (?:point|time) (?:are we|am i) (?:at|in)/,
    /where am i in the video/,
    /what's the video time/,
    /how much of the video has played/,
    /what's the playback position/,
    /at what time is the video/,
    /which timestamp am i (?:currently )?(?:at|on)/,
    /what's the current video time/,
    /what time are we at in the video/,
    /how far have we gotten in the video/,
    /what's our current position in the video/,
    /can you tell me the current video time/,
    /what minute and second are we at/,
    /where am i at in the video/,
    /where am i currently at in the video/,
    /what's the timestamp right now/
  ];
  return timestampPatterns.some(pattern => pattern.test(lowercaseMessage));
}

function sendMessage() {
  const input = document.getElementById('yt-chat-input');
  const message = input.value.trim();
  if (message) {
    addMessageToChat('You', message);
    chatHistory.push({ sender: 'You', message: message });
    input.value = '';

    if (isTimestampQuestion(message)) {
      const currentTimestamp = getCurrentVideoTimestamp();
      if (currentTimestamp) {
        const response = `The current timestamp in the video is ${currentTimestamp}.`;
        addMessageToChat('Assistant', response);
        chatHistory.push({ sender: 'Assistant', message: response });
        saveChatHistory();
      } else {
        const errorResponse = "I'm sorry, I couldn't determine the current timestamp. Make sure a video is playing.";
        addMessageToChat('Assistant', errorResponse);
        chatHistory.push({ sender: 'Assistant', message: errorResponse });
        saveChatHistory();
      }
    } else if (isNavigationRequest(message)) {
      addMessageToChat('Assistant', "I'm analyzing the video to find the right moment. Please wait...");
      
      chrome.runtime.sendMessage({
        action: 'findVideoMoment',
        url: window.location.href,
        query: message
      }, function(response) {
        console.log('Received response:', response);
        if (response && response.success && response.timestamp !== undefined) {
          const formattedTime = formatTimestamp(response.timestamp);
          const clickableTimestamp = `<a href="#" class="timestamp-link" data-time="${response.timestamp}">[${formattedTime}]</a>`;
          const successMessage = `I've found the part you're looking for. It occurs at approximately ${clickableTimestamp}. Click the timestamp to navigate to that point in the video.`;
          addMessageToChat('Assistant', successMessage);
          chatHistory.push({ sender: 'Assistant', message: successMessage });
        } else {
          const errorMessage = response && response.error
            ? `I'm sorry, I couldn't find the specific part you mentioned. Error: ${response.error}`
            : "I'm sorry, I couldn't find the specific part you mentioned. Could you please be more specific or try a different description?";
          addMessageToChat('Assistant', errorMessage);
          chatHistory.push({ sender: 'Assistant', message: errorMessage });
        }
        saveChatHistory();
      });
    } else {
      chrome.runtime.sendMessage({
        action: 'answerQuestion',
        url: window.location.href,
        question: message,
        chatHistory: chatHistory
      }, function(response) {
        if (response && response.success) {
          const formattedResponse = makeTimestampsClickable(response.answer);
          addMessageToChat('Assistant', formattedResponse);
          chatHistory.push({ sender: 'Assistant', message: formattedResponse });
          saveChatHistory();
        } else {
          const errorMessage = response && response.error 
            ? `Error: ${response.error}` 
            : 'Sorry, I couldn\'t process that question. Please try again.';
          addMessageToChat('Assistant', errorMessage);
          chatHistory.push({ sender: 'Assistant', message: errorMessage });
          saveChatHistory();
        }
      });
    }
  }
}

function makeTimestampsClickable(text) {
  // Regular expression to match time formats like 1:23, 01:23, 1:23:45, 01:23:45
  const timeRegex = /\b(\d{1,2}):(\d{2})(?::(\d{2}))?\b/g;
  
  return text.replace(timeRegex, (match, hours, minutes, seconds) => {
    const totalSeconds = (parseInt(hours) * 3600) + (parseInt(minutes) * 60) + (parseInt(seconds) || 0);
    return `<a href="#" class="timestamp-link" data-time="${totalSeconds}">${match}</a>`;
  });
}

function formatResponse(response) {
  if (typeof response === 'object' && response.mainIdea && response.keyPoints) {
    let formattedSummary = `<strong>${response.mainIdea}</strong>\n\n`;
    response.keyPoints.forEach(point => {
      formattedSummary += `${point.emoji} <strong>${point.title}:</strong> ${point.description}\n\n`;
    });
    return formattedSummary;
  } else {
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

function setupTimestampClickHandlers() {
  const messagesDiv = document.getElementById('yt-chat-messages');
  messagesDiv.addEventListener('click', function(event) {
    if (event.target.classList.contains('timestamp-link')) {
      handleTimestampClick(event);
    }
  });
}

function handleTimestampClick(event) {
  event.preventDefault();
  const time = parseFloat(event.target.getAttribute('data-time'));
  seekVideo(time);
}

function isNavigationRequest(message) {
  const lowercaseMessage = message.toLowerCase();
  const navigationPatterns = [
    /take me to (?:the )?(?:part|section|moment) where/,
    /jump to (?:the )?(?:part|section|moment) where/,
    /skip to (?:the )?(?:part|section|moment) where/,
    /go to (?:the )?(?:part|section|moment) where/,
    /navigate to (?:the )?(?:part|section|moment) where/
  ];
  
  return navigationPatterns.some(pattern => pattern.test(lowercaseMessage));
}

function seekVideo(timeInSeconds) {
  const video = document.querySelector('video');
  if (video) {
    // Ensure the time is within the video's duration
    const safeTime = Math.min(timeInSeconds, video.duration);
    video.currentTime = safeTime;
    video.play().catch(error => {
      console.error('Error playing video:', error);
      // If autoplay is blocked, we at least seek to the correct time
      video.currentTime = safeTime;
    });
    console.log(`Seeking video to ${safeTime} seconds`);
  } else {
    console.error('No video element found');
    // If we can't find the video element, try to use YouTube's API
    if (window.yt && window.yt.player && window.yt.player.getPlayerByElement) {
      const playerElement = document.getElementById('movie_player') || document.querySelector('.html5-video-player');
      const player = window.yt.player.getPlayerByElement(playerElement);
      if (player && typeof player.seekTo === 'function') {
        player.seekTo(timeInSeconds, true);
        console.log(`Sought to ${timeInSeconds} seconds using YouTube API`);
      }
    }
  }
}

function getSummary() {
  const videoUrl = window.location.href;
  addMessageToChat('System', 'Fetching video summary...');
  chatHistory.push({ sender: 'System', message: 'Fetching video summary...' });
  chrome.runtime.sendMessage({action: 'getSummary', url: videoUrl}, function(response) {
    if (response && response.success) {
      const summaryMessage = formatResponse(response.summary);
      addMessageToChat('Assistant', summaryMessage);
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

  const extractVideoId = (url) => {
    const match = url.match(/(?:https?:\/\/)?(?:www\.)?youtube\.com\/.*(?:v=|\/embed\/|\/v\/|youtu\.be\/|\/watch\?v=|&v=)([^#&?]*).*/);
    return match ? match[1] : null;
  };

  const videoId = extractVideoId(videoUrl);
  if (!videoId) {
    const errorMessage = 'Error: Invalid YouTube URL';
    addMessageToChat('System', errorMessage);
    chatHistory.push({ sender: 'System', message: errorMessage });
    saveChatHistory();
    return;
  }

  const checkForDynamicChapters = () => {
    const chapterElements = document.querySelectorAll('ytd-chapter-renderer');
    if (chapterElements.length > 0) {
      const chapters = Array.from(chapterElements).map(elem => {
        const timeElem = elem.querySelector('#time');
        const titleElem = elem.querySelector('#chapter-title');
        return {
          emoji: '📌',
          timestamp: timeElem ? timeStringToSeconds(timeElem.textContent.trim()) : 0,
          title: titleElem ? titleElem.textContent.trim() : 'Unknown Chapter',
          description: ''
        };
      });
      return chapters;
    }
    return null;
  };

  const timeStringToSeconds = (timeString) => {
    const parts = timeString.split(':').map(Number);
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    }
    return 0;
  };

  chrome.runtime.sendMessage({action: 'getVideoSections', url: videoUrl}, function(response) {
    if (response && response.success && Array.isArray(response.sections)) {
      const sectionsMessage = formatVideoSections(response.sections, response.source);
      addMessageToChat('Assistant', sectionsMessage);
      chatHistory.push({ sender: 'Assistant', message: sectionsMessage });
    } else {
      const dynamicChapters = checkForDynamicChapters();
      if (dynamicChapters) {
        const sectionsMessage = formatVideoSections(dynamicChapters, 'youtube-dynamic');
        addMessageToChat('Assistant', sectionsMessage);
        chatHistory.push({ sender: 'Assistant', message: sectionsMessage });
      } else {
        chrome.runtime.sendMessage({action: 'generateAISections', url: videoUrl}, function(aiResponse) {
          if (aiResponse && aiResponse.success && Array.isArray(aiResponse.sections)) {
            const sectionsMessage = formatVideoSections(aiResponse.sections, 'ai');
            addMessageToChat('Assistant', sectionsMessage);
            chatHistory.push({ sender: 'Assistant', message: sectionsMessage });
          } else {
            const errorMessage = 'Error: Failed to fetch or generate video sections';
            addMessageToChat('System', errorMessage);
            chatHistory.push({ sender: 'System', message: errorMessage });
          }
        });
      }
    }
    saveChatHistory();
  });
}

function formatVideoSections(sections, source) {
  let formattedSections = `Video Sections (${source === 'youtube' ? 'YouTube Chapters' : 'AI-Generated'}):\n\n`;
  sections.forEach((section, index) => {
    const timestamp = formatTimestamp(section.timestamp);
    formattedSections += `${section.emoji} <strong>${section.title}</strong>\n`;
    formattedSections += `<a href="#" class="timestamp-link" data-time="${section.timestamp}">[${timestamp}]</a> ${section.description || ''}\n\n`;
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
    formattedInsights += `${insight.emoji} <strong>${insight.title}:</strong> ${insight.description}\n\n`;
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
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
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
