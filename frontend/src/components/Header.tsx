import React from 'react';
import { Download } from 'lucide-react';
import { InterviewType } from '../types';
import { useChat } from '../context/ChatContext';

const interviewTypes: InterviewType[] = [
  'Technical',
  'Behavioral',
  'System Design',
  'Leadership',
  'HR',
  'Case Study'
];

const Header: React.FC = () => {
  const { interviewType, setInterviewType, downloadTranscript, interviewState } = useChat();

  return (
    <header className="bg-white shadow-sm sticky top-0 z-10 backdrop-blur-sm bg-opacity-80">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-medium text-gray-800">AI Interview Assistant</h1>
          <div className="relative ml-4">
            <select
              value={interviewType}
              onChange={(e) => setInterviewType(e.target.value as InterviewType)}
              disabled={interviewState.sessionId !== null}
              className="appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-2 px-3 pr-8 rounded-md 
                        text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            >
              {interviewTypes.map((type) => (
                <option key={type} value={type}>
                  {type} Interview
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
          </div>
          {interviewState.sessionId && !interviewState.isComplete && (
            <div className="ml-4 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              Questions remaining: {interviewState.questionsRemaining}
            </div>
          )}
          {interviewState.isComplete && (
            <div className="ml-4 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              Interview Complete
            </div>
          )}
        </div>
        <button
          onClick={downloadTranscript}
          disabled={!interviewState.sessionId}
          className={`flex items-center gap-1 py-2 px-4 rounded-md transition-colors duration-200 ${
            interviewState.isComplete 
              ? 'bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium'
              : 'text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50'
          }`}
        >
          <Download size={16} />
          <span>{interviewState.isComplete ? 'Download Feedback PDF' : 'Transcript'}</span>
        </button>
      </div>
    </header>
  );
};

export default Header;