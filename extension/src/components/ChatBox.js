import React, { useState } from 'react';
import axios from 'axios';
import './ChatBox.css';

const ChatBox = () => {
    const [videoUrl, setVideoUrl] = useState('');
    const [summary, setSummary] = useState('');

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
            const response = await axios.get(`http://localhost:5001/summary?videoId=${videoId}`);
            setSummary(response.data.summary);
      
        } catch (error) {
            console.error('Failed to fetch video summary:', error);
            alert('Failed to fetch video summary');
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
        </div>
    );
};

export default ChatBox;


// import React, { useState } from 'react';
// import axios from 'axios';
// import './ChatBox.css';

// const ChatBox = () => {
//     const [videoUrl, setVideoUrl] = useState('');
//     const [transcript, setTranscript] = useState([]);

//     const extractVideoId = (url) => {
//         const match = url.match(/(?:https?:\/\/)?(?:www\.)?youtube\.com\/.*v=([^&]*)/);
//         return match ? match[1] : null;
//     };

//     const handleFetchTranscript = async () => {
//         const videoId = extractVideoId(videoUrl);
//         if (!videoId) {
//             alert('Invalid YouTube URL');
//             return;
//         }

//         try {
//             const response = await axios.get(`http://localhost:5001/captions?videoId=${videoId}`);
//             setTranscript(response.data);
//         } catch (error) {
//             console.error('Failed to fetch captions:', error);
//             alert('Failed to fetch captions');
//         }
//     };

//     return (
//         <div className="chatbox">
//             <h2>YouTube Video Transcript</h2>
//             <input
//                 type="text"
//                 value={videoUrl}
//                 onChange={(e) => setVideoUrl(e.target.value)}
//                 placeholder="Enter YouTube video URL..."
//             />
//             <button onClick={handleFetchTranscript}>Get Transcript</button>
//             <div className="transcript">
//                 {transcript.map((item, index) => (
//                     <p key={index}>{item.text}</p>
//                 ))}
//             </div>
//         </div>
//     );
// };

// export default ChatBox;

//------------------------------------------------------------------------------------


// import React, { useState } from 'react';
// import axios from 'axios';
// import './ChatBox.css';

// const ChatBox = () => {
//   const [videoUrl, setVideoUrl] = useState('');
//   const [captions, setCaptions] = useState(null);

//   const CLIENT_ID = '536860495303-nvp1smk9go8gvfr7lqkvinav6as7mcac.apps.googleusercontent.com';
//   const REDIRECT_URI = 'http://localhost:3000';

//   const extractVideoId = (url) => {
//     try {
//       const urlObj = new URL(url);
//       return urlObj.searchParams.get('v') || urlObj.pathname.split('/')[1];
//     } catch (error) {
//       console.error('Invalid URL:', error);
//       return null;
//     }
//   };

//   const handleAuthClick = () => {
//     const authUrl = `https://accounts.google.com/o/oauth2/auth?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=https://www.googleapis.com/auth/youtube.force-ssl&response_type=code`;
//     window.location.href = authUrl;
//   };

//   const handleVideoSubmit = async () => {
//     const videoId = extractVideoId(videoUrl);
//     if (!videoId) {
//       alert('Invalid YouTube URL');
//       return;
//     }

//     const urlParams = new URLSearchParams(window.location.search);
//     const code = urlParams.get('code');

//     if (!code) {
//       alert('Authorization code is required. Please authorize the application.');
//       handleAuthClick();
//       return;
//     }

//     try {
//       const response = await axios.get(`http://localhost:5001/api/captions?videoId=${videoId}&code=${code}`);
//       setCaptions(response.data);
//     } catch (error) {
//       console.error('Failed to fetch captions:', error);
//       setCaptions(null);
//     }
//   };

//   return (
//     <div className="chatbox">
//       <h2>Fetch YouTube Video Captions</h2>
//       <input
//         type="text"
//         value={videoUrl}
//         onChange={(e) => setVideoUrl(e.target.value)}
//         placeholder="Enter YouTube video URL..."
//       />
//       <button onClick={handleVideoSubmit}>Submit</button>
//       {captions && (
//         <div className="captions">
//           <h3>Captions:</h3>
//           {captions.map((caption, index) => (
//             <div key={index} className="caption">
//               <strong>{caption.snippet.language}</strong>: {caption.snippet.name || 'Unnamed'} ({caption.snippet.trackKind})
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// };

// export default ChatBox;
