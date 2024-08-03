import React, { useState } from 'react';
import axios from 'axios';
import './ChatBox.css';

const ChatBox = () => {
    const [videoUrl, setVideoUrl] = useState('');
    const [summary, setSummary] = useState('');
    const [captions, setCaptions] = useState([]);

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
            // Fetching the summary using the existing functionality
            const summaryResponse = await axios.get(`http://localhost:5001/summary?videoId=${videoId}`);
            setSummary(summaryResponse.data.summary);

            // Fetching the captions using the new functionality
            const captionsResponse = await axios.get(`http://localhost:5001/summary/captions?videoId=${videoId}`);
            setCaptions(captionsResponse.data.captions);
      
        } catch (error) {
            console.error('Failed to fetch video data:', error);
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
                {captions.map((caption, index) => (
                    <div key={index} className="caption">
                        <strong>{caption.start} - {caption.dur}</strong>
                        <p>{caption.text}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ChatBox;


// import React, { useState } from 'react';
// import axios from 'axios';
// import './ChatBox.css';

// const ChatBox = () => {
//     const [videoUrl, setVideoUrl] = useState('');
//     const [summary, setSummary] = useState('');

//     const extractVideoId = (url) => {
//         const match = url.match(/(?:https?:\/\/)?(?:www\.)?youtube\.com\/.*v=([^&]*)/);
//         return match ? match[1] : null;
//     };

//     const handleFetchSummary = async () => {
//         const videoId = extractVideoId(videoUrl);
//         if (!videoId) {
//             alert('Invalid YouTube URL');
//             return;
//         }

//         try {
//             const response = await axios.get(`http://localhost:5001/summary?videoId=${videoId}`);
//             setSummary(response.data.summary);
      
//         } catch (error) {
//             console.error('Failed to fetch video summary:', error);
//             alert('Failed to fetch video summary');
//         }
//     };

//     return (
//         <div className="chatbox">
//             <h2>YouTube Video Summary</h2>
//             <input
//                 type="text"
//                 value={videoUrl}
//                 onChange={(e) => setVideoUrl(e.target.value)}
//                 placeholder="Enter YouTube video URL..."
//             />
//             <button onClick={handleFetchSummary}>Get Summary</button>
//             <div className="summary">
//                 {summary}
//             </div>
//         </div>
//     );
// };

// export default ChatBox;
