
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import Admin from './Admin';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// 判断是否为管理后台路由
const isAdminRoute = window.location.pathname === '/admin' || window.location.pathname === '/admin/';

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    {isAdminRoute ? <Admin /> : <App />}
  </React.StrictMode>
);
