import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Create a root container for the React application
const root = ReactDOM.createRoot(document.getElementById('root'));

// Render the App component inside the root container
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Measure performance in the app
reportWebVitals();

