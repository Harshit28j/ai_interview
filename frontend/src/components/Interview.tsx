import React, { useState } from 'react';
import { interviewApi } from '../services/api';
import ChatWindow from './ChatWindow';
import InputBar from './InputBar';
import { useChat } from '../context/ChatContext';
import { InterviewType } from '../types';

interface InterviewState {
    sessionId: number | null;
    currentQuestionId: number | null;
    isComplete: boolean;
}

const INTERVIEW_CATEGORIES = [
    { value: 'TECHNICAL', label: 'Technical' },
    { value: 'BEHAVIORAL', label: 'Behavioral' },
    { value: 'SYSTEM_DESIGN', label: 'System Design' },
    { value: 'PROBLEM_SOLVING', label: 'Problem Solving' }
] as const;

const Interview: React.FC = () => {
    const [state, setState] = useState<InterviewState>({
        sessionId: null,
        currentQuestionId: null,
        isComplete: false,
    });
    
    const [selectedCategory, setSelectedCategory] = useState<string>('TECHNICAL');
    const { sendMessage, setInterviewType } = useChat();

    const startInterview = async () => {
        try {
            setInterviewType(selectedCategory as InterviewType);
            const response = await interviewApi.startInterview(selectedCategory);
            const firstQuestion = response.questions[0];
            
            setState(prev => ({
                ...prev,
                sessionId: response.session_id,
                currentQuestionId: firstQuestion.id,
            }));

            sendMessage(firstQuestion.text);
        } catch (error) {
            console.error('Failed to start interview:', error);
        }
    };

    return (
        <div className="flex flex-col h-screen">
            {!state.sessionId && (
                <div className="flex flex-col items-center justify-center h-full space-y-4 p-4">
                    <div className="w-full max-w-md">
                        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                            Select Interview Category
                        </label>
                        <select
                            id="category"
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-full p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {INTERVIEW_CATEGORIES.map((category) => (
                                <option key={category.value} value={category.value}>
                                    {category.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <button
                        onClick={startInterview}
                        className="w-full max-w-md p-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                        Start Interview
                    </button>
                </div>
            )}

            {state.sessionId && (
                <>
                    <ChatWindow />
                    <InputBar />
                </>
            )}
        </div>
    );
};

export default Interview; 