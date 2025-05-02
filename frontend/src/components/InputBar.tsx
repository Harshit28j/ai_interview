import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { useChat } from '../context/ChatContext';
import { interviewApi } from '../services/api';

const InputBar: React.FC = () => {
  const [message, setMessage] = useState('');
  const { sendMessage, isAiTyping, interviewState } = useChat();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [message]);

  const handleSend = () => {
    if (message.trim() && !isAiTyping) {
      const userMessage = message.trim();
      sendMessage(userMessage, 'user');
      setMessage('');
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-gray-200 bg-white py-3 px-4 sticky bottom-0 w-full">
      <div className="max-w-5xl mx-auto">
        <div className="relative flex items-end bg-gray-50 rounded-lg border border-gray-200 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all duration-200">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              !interviewState?.sessionId 
                ? "Type 'start' to begin the interview..." 
                : interviewState.isComplete
                ? "Interview complete! Check the feedback above."
                : "Type your response..."
            }
            className="w-full py-3 pl-4 pr-12 bg-transparent resize-none max-h-[150px] text-gray-800 focus:outline-none"
            rows={1}
            disabled={isAiTyping || interviewState?.isComplete}
          />
          <button
            onClick={handleSend}
            disabled={!message.trim() || isAiTyping || interviewState?.isComplete}
            className={`absolute right-2 bottom-2 p-2 rounded-full 
                      ${
                        message.trim() && !isAiTyping && !interviewState?.isComplete
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      } 
                      transition-colors duration-200`}
          >
            <Send size={18} />
          </button>
        </div>
        {isAiTyping && (
          <p className="text-xs text-gray-500 mt-1 ml-2">AI is typing...</p>
        )}
      </div>
    </div>
  );
};

export default InputBar;