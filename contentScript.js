// Injects functionality directly into YouTube pages
console.log("YouTube Summarizer content script loaded");

function createSummarizerInterface() {
  const container = document.createElement('div');
  container.id = 'yt-summarizer-container';
  container.innerHTML = `
    <button id="yt-summarizer-toggle">YT Summarizer</button>
    <div id="yt-summarizer-panel" class="hidden">
      <div id="yt-summarizer-header">
        <h3>YouTube Video Summarizer</h3>
        <button id="yt-summarizer-close">×</button>
      </div>
      <div id="yt-summarizer-content">
        <input type="text" id="yt-summarizer-url" placeholder="Enter YouTube URL">
        <button id="yt-summarizer-submit">Get Summary</button>
        <div id="yt-summarizer-result"></div>
      </div>
    </div>
  `;
  document.body.appendChild(container);

  // Add event listeners
  document.getElementById('yt-summarizer-toggle').addEventListener('click', togglePanel);
  document.getElementById('yt-summarizer-close').addEventListener('click', togglePanel);
  document.getElementById('yt-summarizer-submit').addEventListener('click', getSummary);

  // Set initial URL
  document.getElementById('yt-summarizer-url').value = window.location.href;
}

function togglePanel() {
  const panel = document.getElementById('yt-summarizer-panel');
  panel.classList.toggle('hidden');
}

function getSummary() {
  const url = document.getElementById('yt-summarizer-url').value;
  const resultDiv = document.getElementById('yt-summarizer-result');
  resultDiv.textContent = 'Fetching summary...';

  // Send message to background script
  chrome.runtime.sendMessage({action: 'getSummary', url: url}, function(response) {
    if (response.success) {
      resultDiv.innerHTML = `
        <h4>Summary:</h4>
        <p>${response.summary}</p>
      `;
    } else {
      resultDiv.textContent = 'Error: ' + response.error;
    }
  });
}

createSummarizerInterface();


// ---------------------------------------------------------------------------------------
// contentScript.js

// console.log("YouTube Summarizer content script loaded");

// function createSummarizerInterface() {
//   const container = document.createElement('div');
//   container.id = 'yt-summarizer-container';
//   container.innerHTML = `
//     <button id="yt-summarizer-toggle">YT Summarizer</button>
//     <div id="yt-summarizer-panel" class="hidden">
//       <div id="yt-summarizer-header">
//         <h3>YouTube Video Summarizer</h3>
//         <button id="yt-summarizer-close">×</button>
//       </div>
//       <div id="yt-summarizer-content">
//         <input type="text" id="yt-summarizer-url" placeholder="Enter YouTube URL">
//         <button id="yt-summarizer-submit">Get Summary</button>
//         <div id="yt-summarizer-result"></div>
//       </div>
//     </div>
//   `;
//   document.body.appendChild(container);

//   // Add event listeners
//   document.getElementById('yt-summarizer-toggle').addEventListener('click', togglePanel);
//   document.getElementById('yt-summarizer-close').addEventListener('click', togglePanel);
//   document.getElementById('yt-summarizer-submit').addEventListener('click', getSummary);

//   // Set initial URL
//   document.getElementById('yt-summarizer-url').value = window.location.href;
// }

// function togglePanel() {
//   const panel = document.getElementById('yt-summarizer-panel');
//   panel.classList.toggle('hidden');
// }

// function getSummary() {
//   const url = document.getElementById('yt-summarizer-url').value;
//   const resultDiv = document.getElementById('yt-summarizer-result');
//   resultDiv.textContent = 'Fetching summary...';

//   // Send message to background script
//   chrome.runtime.sendMessage({action: 'getSummary', url: url}, function(response) {
//     if (response.success) {
//       resultDiv.innerHTML = `
//         <h4>Summary:</h4>
//         <p>${response.summary}</p>
//         <h4>Captions:</h4>
//         <p>${response.captions}</p>
//       `;
//     } else {
//       resultDiv.textContent = 'Error: ' + response.error;
//     }
//   });
// }

// createSummarizerInterface();