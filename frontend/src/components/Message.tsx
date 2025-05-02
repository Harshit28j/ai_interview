import React from 'react';
import { Message as MessageType } from '../types';

interface MessageProps {
  message: MessageType;
}

const Message: React.FC<MessageProps> = ({ message }) => {
  const isAi = message.sender === 'ai';
  const formattedTime = formatMessageTime(message.timestamp);

  return (
    <div
      className={`flex ${isAi ? 'justify-start' : 'justify-end'} mb-4 animate-fadeIn`}
      style={{ animationDelay: '0.1s' }}
    >
      <div
        className={`max-w-[75%] rounded-xl px-4 py-3 ${
          isAi
            ? 'bg-white border border-gray-200 text-gray-800 rounded-tl-none shadow-sm'
            : 'bg-blue-600 text-white rounded-tr-none shadow-md'
        }`}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium">
            {isAi ? 'AI' : 'You'}
          </span>
          <span className="text-xs opacity-70">{formattedTime}</span>
        </div>
        <p className="whitespace-pre-wrap text-sm">{message.content}</p>
      </div>
    </div>
  );
};

function formatMessageTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  }).format(date);
}

export default Message;