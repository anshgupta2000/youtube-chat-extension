import React, { useState } from 'react';
import axios from 'axios';
import './ChatBox.css';

const ChatBox = () => {
    const [videoUrl, setVideoUrl] = useState('');
    const [summary, setSummary] = useState('');
    const [captions, setCaptions] = useState([]);
    const [error, setError] = useState('');

    const extractVideoId = (url) => {
        const match = url.match(/(?:https?:\/\/)?(?:www\.)?youtube\.com\/.*v=([^&]*)/);
        return match ? match[1] : null;
    };

    const handleFetchSummary = async () => {
        const videoId = extractVideoId(videoUrl);
        if (!videoId) {
            alert('Invalid YouTube URL');
            return;
        }

        try {
            const summaryResponse = await axios.get(`http://localhost:5001/summary/captions?videoId=${videoId}`);
            const captionsResponse = await axios.get(`http://localhost:5001/summary/only-captions?videoId=${videoId}`);
            
            if (summaryResponse.data && summaryResponse.data.captions && summaryResponse.data.captions.content[0].text.length > 0) {
                setSummary(summaryResponse.data.captions.content[0].text);
            } else {
                setSummary("No summary available");
            }

            if (captionsResponse.data && captionsResponse.data.captions) {
                setCaptions(captionsResponse.data.captions);
            } else {
                setCaptions("No captions available");
            }
            // const response = await axios.get(`http://localhost:5001/summary/captions?videoId=${videoId}`);

            
            // console.log("response.data.captions:", response.data.captions);
            // if (response.data && response.data.captions && response.data.captions.content[0].text.length > 0) {
            //     setSummary(response.data.captions.content[0].text);
 
            //     const captionsData = [];
            //     setCaptions(captionsData);
            // } else {
            //     setSummary("No summary available");
            //     setCaptions([]);
            // }
            
      
        } catch (error) {
            console.error('Failed to fetch video data:', error);
            setError('Failed to fetch video data');
            alert('Failed to fetch video data');
        }
    };

    return (
        <div className="chatbox">
            <h2>YouTube Video Summary</h2>
            <input
                type="text"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="Enter YouTube video URL..."
            />
            <button onClick={handleFetchSummary}>Get Summary</button>
            <div className="summary">
                {summary}
            </div>
            <div className="captions">
                <h2>Captions:</h2>
                {captions}
                
            </div>
        </div>
    );
};

export default ChatBox;