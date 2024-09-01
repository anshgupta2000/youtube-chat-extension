# YouTube Video Summarizer Chrome Extension

## Overview
This Chrome extension provides quick and concise summaries of YouTube videos directly on the YouTube page. It allows users to get the main points of a video without watching the entire content, saving time and improving video content accessibility.

## Features
- Adds a "YT Summarizer" button to YouTube pages
- Generates summaries for YouTube videos using AI
- Displays summaries in a sleek, slide-out panel
- Works with the current video or any YouTube URL input by the user
- Integrates seamlessly with the YouTube interface

## How It Works
1. The extension injects a button onto YouTube pages
2. When clicked, a panel slides out from the right side of the screen
3. Users can enter a YouTube URL or use the current video's URL
4. Clicking "Get Summary" sends the video ID to a backend server
5. The server processes the video and returns a concise summary
6. The summary is displayed in the panel for easy reading

## Technical Details
- Built as a Chrome extension using JavaScript, HTML, and CSS
- Uses a background script to handle API calls to the backend server
- Implements a content script to modify the YouTube page and handle user interactions
- Styled to match YouTube's design for a native look and feel

<img width="1488" alt="Screenshot 2024-09-01 at 5 09 34 PM" src="https://github.com/user-attachments/assets/870baaa5-2b16-450c-915e-36ee864b3c86">
