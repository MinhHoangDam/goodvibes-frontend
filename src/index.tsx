import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './hopper.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { HopperProvider } from '@hopper-ui/components';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <HopperProvider colorScheme="system" defaultColorScheme="light" withBodyStyle>
      <App />
    </HopperProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
