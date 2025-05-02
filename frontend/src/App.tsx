import React, { useState, useEffect } from 'react';
import Interview from './components/Interview';
import Auth from './components/auth/Auth';
import Header from './components/Header';
import ChatWindow from './components/ChatWindow';
import InputBar from './components/InputBar';
import { ChatProvider } from './context/ChatContext';
import { authApi } from './services/api';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogout = () => {
    authApi.logout();
    setIsAuthenticated(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {isAuthenticated ? (
        <>
          <ChatProvider>
            <div className="flex flex-col h-screen overflow-hidden">
              <button onClick={handleLogout}>Logout</button>
              <Header />
              <ChatWindow />
              <InputBar />
            </div>
          </ChatProvider>
        </>
      ) : (
        <Auth onAuthSuccess={() => setIsAuthenticated(true)} />
      )}
    </div>
  );
}

export default App;