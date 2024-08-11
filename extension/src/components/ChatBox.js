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
            const response = await axios.get(`http://localhost:5001/summary/captions?videoId=${videoId}`);

            //console.log("response.data.captions:", response.summaryResponse.data.captions.content[0].text);
            console.log("response.data.captions:", response.data.captions);
            if (response.data && response.data.captions && response.data.captions.content[0].text.length > 0) {
                setSummary(response.data.captions.content[0].text);
            // if (response.summaryResponse.data && response.summaryResponse.data.captions && response.summaryResponse.data.captions.content[0].text.length > 0) {
            //     setSummary(response.summaryResponse.data.captions.content[0].text);
 
                const captionsData = [];
                setCaptions(captionsData);
            } else {
                setSummary("No summary available");
                setCaptions([]);
            }
            
      
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
                {/* { {captions.map((caption, index) => (
                    <div key={index} className="caption">
                        <strong>{caption.start} - {caption.dur}</strong>
                        <p>{caption.text}</p>
                    </div> } 
                ))}   */}
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
//     const [captions, setCaptions] = useState([]);
//     const [error, setError] = useState('');

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
//             // const { summary, transcriptText } = await fetchSubtitles(videoId, 'en');
//             // setSummary(summary.data.content[0].text);
//             // const captionsData = transcriptText;
//             // setCaptions(captionsData);

//             const response = await axios.get(`http://localhost:5001/summary/captions?videoId=${videoId}`);
            
//             setSummary(response.data.content[0].text);
                
//             const captionsData = response.data.content.slice(1).map(item => ({
//                     start: 'N/A', // Start time not provided in example data
//                     dur: 'N/A', // Duration not provided in example data
//                     text: item.text
//                 }));
//             setCaptions(captionsData);
//             //-------------------------------------------

//             // if (response.data && response.data.content && response.data.content.length > 0) {

//             //     // Extracting the summary from the first content element if it's assumed to be the summary.
//             //     setSummary(response.data.content[0].text);
                
//             //     // Assuming the captions are provided after the summary in the same call.
//             //     const captionsData = response.data.content.slice(1).map(item => ({
//             //         start: 'N/A', // Start time not provided in example data
//             //         dur: 'N/A', // Duration not provided in example data
//             //         text: item.text
//             //     }));
//             //     setCaptions(captionsData);
//             // } else {
//             //     setSummary("No summary available");
//             //     setCaptions([]);
//             // }

//             //---------------------
//             // const summaryResponse = await axios.get(`http://localhost:5001/summary?videoId=${videoId}`);
//             // if (summaryResponse.data.content && summaryResponse.data.content.length > 0) {
//             //     setSummary(summaryResponse.data.content[0].text);  // Assuming first element has the summary
//             // } else {
//             //     setSummary("No summary available");
//             // }

//             // const captionsResponse = await axios.get(`http://localhost:5001/summary/captions?videoId=${videoId}`);
//             // if (captionsResponse.data.content && captionsResponse.data.content.length > 0) {
//             //     setCaptions(captionsResponse.data.content.map(cap => ({ start: 'N/A', dur: 'N/A', text: cap.text })));
//             // } else {
//             //     setCaptions([]);
//             // }
      
//         } catch (error) {
//             console.error('Failed to fetch video data:', error);
//             setError('Failed to fetch video data');
//             alert('Failed to fetch video data');
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
//             <div className="captions">
//                 <h2>Captions:</h2>
//                 {captions.map((caption, index) => (
//                     <div key={index} className="caption">
//                         <strong>{caption.start} - {caption.dur}</strong>
//                         <p>{caption.text}</p>
//                     </div>
//                 ))}
//             </div>
//         </div>
//     );
// };

// export default ChatBox;