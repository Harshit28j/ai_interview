import React, { createContext, useContext, useState, useCallback } from 'react';
import { Message, InterviewType } from '../types';
import { interviewApi } from '../services/api';

// First, let's define the interview state interface
export interface InterviewState {
  sessionId: number | null;
  currentQuestionId: number | null; // Update to include currentQuestionId
  currentQuestionOrder: number;
  isComplete: boolean;
}

// Update the ChatContextType to include interviewState
export interface ChatContextType {
  messages: Message[];
  isAiTyping: boolean;
  interviewType: InterviewType;
  interviewState: InterviewState; // Add this
  setInterviewType: (type: InterviewType) => void;
  sendMessage: (content: string, sender?: 'user' | 'ai') => void;
  downloadTranscript: () => void;
}

// Create the context with a default value
const ChatContext = createContext<ChatContextType | null>(null);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hi there! I\'m your AI interview assistant. What type of interview would you like to practice today?\n Write "start" to begin and "next" or "skip" to jump to next question if you don\'t know the answer',
      sender: 'ai',
      timestamp: new Date(),
    },
  ]);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [interviewType, setInterviewType] = useState<InterviewType>('Technical');
  const [interviewState, setInterviewState] = useState<InterviewState>({
    sessionId: null,
    currentQuestionId: null, // Initialize currentQuestionId as null
    currentQuestionOrder: 0,
    isComplete: false
  });

  const handleStartInterview = async () => {
    try {
      setIsAiTyping(true);
      const category = interviewType.toUpperCase().replace(' ', '_');
      const response = await interviewApi.generateQuestions(category);
      
      const firstQuestion = response.questions[0];
      setInterviewState({
        sessionId: response.session_id,
        currentQuestionId: firstQuestion.id, // Store the question ID
        currentQuestionOrder: firstQuestion.order,
        isComplete: false
      });

      // Add the AI's question to the chat
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        content: firstQuestion.text,
        sender: 'ai',
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Failed to start interview:', error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        content: 'Failed to start the interview. Please try again.',
        sender: 'ai',
        timestamp: new Date()
      }]);
    } finally {
      setIsAiTyping(false);
    }
  };

  const handleUserResponse = async (content: string) => {
    if (!interviewState.sessionId || !interviewState.currentQuestionId) return;

    try {
      setIsAiTyping(true);
      
      // Submit user's response
      const responseResult = await interviewApi.submitResponse(
        interviewState.sessionId,
        interviewState.currentQuestionId,
        content
      );

      // Handle the response
      if (responseResult.is_learning_opportunity) {
        // For "don't know" or brief responses, show a more supportive message
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          content: `${responseResult.feedback}\n\n${responseResult.cross_question}`,
          sender: 'ai',
          timestamp: new Date()
        }]);

        // Wait for user's confirmation to explain
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          content: "Type 'yes' if you'd like me to explain this topic, or 'next' to move to the next question.",
          sender: 'ai',
          timestamp: new Date()
        }]);
      } else if (responseResult.cross_question) {
        // Regular follow-up question
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          content: `${responseResult.feedback}\n\nFollow-up question:\n${responseResult.cross_question}`,
          sender: 'ai',
          timestamp: new Date()
        }]);
      } else {
        // ... rest of the existing logic for handling next questions ...
      }
    } catch (error) {
      console.error('Error processing response:', error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        content: 'Sorry, there was an error processing your response. Please try again.',
        sender: 'ai',
        timestamp: new Date()
      }]);
    } finally {
      setIsAiTyping(false);
    }
  };

  const handleNextQuestion = async () => {
    if (!interviewState.sessionId) return;

    try {
      setIsAiTyping(true);
      const nextQuestion = await interviewApi.getNextQuestion(
        interviewState.sessionId,
        interviewState.currentQuestionOrder
      );

      if ('message' in nextQuestion && nextQuestion.message === 'No more questions available') {
        const feedback = await interviewApi.getFeedbackSummary(interviewState.sessionId);
        setInterviewState(prev => ({ ...prev, isComplete: true }));
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          content: `Interview complete!\n\nFeedback Summary:\n${feedback.overall_feedback}`,
          sender: 'ai',
          timestamp: new Date()
        }]);
      } else {
        setInterviewState(prev => ({ 
          ...prev, 
          currentQuestionId: nextQuestion.id,
          currentQuestionOrder: nextQuestion.order
        }));
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          content: nextQuestion.text,
          sender: 'ai',
          timestamp: new Date()
        }]);
      }
    } catch (error) {
      console.error('Error getting next question:', error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        content: 'Sorry, there was an error getting the next question. Please try again.',
        sender: 'ai',
        timestamp: new Date()
      }]);
    } finally {
      setIsAiTyping(false);
    }
  };

  const sendMessage = useCallback((content: string, sender: 'user' | 'ai' = 'user') => {
    if (!content.trim()) return;

    // Add the message to the chat
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      content,
      sender,
      timestamp: new Date()
    }]);

    // Handle different message types
    if (sender === 'user') {
      const lowerContent = content.toLowerCase().trim();
      
      // Check for skip/negative responses
      const skipWords = ['next', 'no', 'nope', 'idk', "i don't know", 'dont know', "don't know"];
      const shouldSkip = skipWords.some(word => lowerContent.includes(word));

      if (lowerContent === 'start') {
        handleStartInterview();
      } else if (shouldSkip && interviewState.sessionId && !interviewState.isComplete) {
        handleNextQuestion();
      } else if (interviewState.sessionId && !interviewState.isComplete) {
        handleUserResponse(content);
      }
    }
  }, [interviewState, interviewType]);

  const downloadTranscript = useCallback(() => {
    const transcript = messages
      .map(msg => `[${msg.timestamp.toLocaleString()}] ${msg.sender === 'user' ? 'You' : 'AI'}: ${msg.content}`)
      .join('\n\n');

    const blob = new Blob([transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interview-transcript-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [messages]);

  const value: ChatContextType = {
    messages,
    isAiTyping,
    interviewType,
    interviewState, // Add this
    setInterviewType,
    sendMessage,
    downloadTranscript,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export default ChatProvider;