import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { Toaster } from 'react-hot-toast';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
    <Toaster 
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: {
          background: '#363636',
          color: '#fff',
        },
        success: {
          duration: 3000,
          icon: '✅',
          style: {
            background: '#43a047',
          },
        },
        error: {
          duration: 4000,
          icon: '❌',
          style: {
            background: '#d32f2f',
          },
        },
      }}
    />
  </React.StrictMode>
);

// Performance ölçümü için (isteğe bağlı)
reportWebVitals(); 