import React, { useRef, useEffect } from 'react';
import Message from './Message';
import TypingIndicator from './TypingIndicator';
import { useChat } from '../context/ChatContext';

const ChatWindow: React.FC = () => {
  const { messages, isAiTyping } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isAiTyping]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <div className="space-y-1">
          {messages.map((message) => (
            <Message key={message.id} message={message} />
          ))}
          {isAiTyping && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;