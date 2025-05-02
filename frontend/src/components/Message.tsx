import React from 'react';
import { Download } from 'lucide-react';
import { Message as MessageType } from '../types';
import { useChat } from '../context/ChatContext';

interface MessageProps {
  message: MessageType;
}

const Message: React.FC<MessageProps> = ({ message }) => {
  const { downloadTranscript } = useChat();
  const isAi = message.sender === 'ai';
  const formattedTime = formatMessageTime(message.timestamp);
  const isCompletionMessage = isAi && message.content.includes('Interview complete!');

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
        
        {isCompletionMessage && (
          <button
            onClick={downloadTranscript}
            className="mt-4 flex items-center gap-2 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full justify-center font-medium"
          >
            <Download size={16} />
            <span>Download Feedback PDF</span>
          </button>
        )}
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