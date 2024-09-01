// App.js

document.addEventListener('DOMContentLoaded', function () {
    const fetchSummaryButton = document.getElementById('fetchSummary');
    const videoUrlInput = document.getElementById('videoUrl');
    const summaryContainer = document.getElementById('summaryContainer');

    fetchSummaryButton.addEventListener('click', function () {
        const videoUrl = videoUrlInput.value.trim();

        if (!videoUrl) {
            summaryContainer.textContent = 'Please enter a valid YouTube URL.';
            return;
        }

        // Send a message to the background script to fetch the summary
        chrome.runtime.sendMessage({ action: 'fetchSummary', videoUrl: videoUrl }, function (response) {
            if (response.status === 'success') {
                summaryContainer.textContent = `Summary: ${response.summary}`;
            } else {
                summaryContainer.textContent = `Error: ${response.message}`;
            }
        });
    });
});