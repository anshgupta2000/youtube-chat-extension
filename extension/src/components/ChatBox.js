// import React from 'react';

// const ChatBox = () => {
//   return (
//     <div className="chatbox">
//       <h2>Chat about this video</h2>
//     </div>
//   );
// };

// export default ChatBox;

import React, { useState } from 'react';
import './ChatBox.css';

const ChatBox = () => {
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState([]);

  const handleSendMessage = () => {
    if (message.trim()) {
      setChat([...chat, message]);
      setMessage('');
    }
  };

  return (
    <div className="chatbox">
      <h2>Chat about this video</h2>
      <div className="chat-messages">
        {chat.map((msg, index) => (
          <div key={index} className="chat-message">
            {msg}
          </div>
        ))}
      </div>
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message..."
      />
      <button onClick={handleSendMessage}>Send</button>
    </div>
  );
};

export default ChatBox;

