import React, { createContext, useContext, useState, useCallback } from 'react';
import { Message, InterviewType } from '../types';
import { interviewApi } from '../services/api';
import { toast } from 'react-hot-toast';

// First, let's define the interview state interface
export interface InterviewState {
  sessionId: number | null;
  currentQuestionId: number | null; // Update to include currentQuestionId
  currentQuestionOrder: number;
  isComplete: boolean;
  questionsRemaining: number; // Add this field
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
    isComplete: false,
    questionsRemaining: 10 // Initialize with 10 questions
  });

  const handleStartInterview = async () => {
    try {
      setIsAiTyping(true);
      const category = interviewType.toUpperCase().replace(' ', '_');
      const response = await interviewApi.generateQuestions(category);
      
      const firstQuestion = response.questions[0];
      setInterviewState({
        sessionId: response.session_id,
        currentQuestionId: firstQuestion.id,
        currentQuestionOrder: firstQuestion.order,
        isComplete: false,
        questionsRemaining: 9 // First question is being asked, so 9 remain
      });

      // Add the AI's question to the chat
      setMessages(prev => [...prev, {
        id: generateUniqueId(),
        content: firstQuestion.text,
        sender: 'ai',
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Failed to start interview:', error);
      setMessages(prev => [...prev, {
        id: generateUniqueId(),
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
          id: generateUniqueId(),
          content: `${responseResult.feedback}\n\n${responseResult.cross_question}`,
          sender: 'ai',
          timestamp: new Date()
        }]);

        // Wait for user's confirmation to explain
        setMessages(prev => [...prev, {
          id: generateUniqueId(),
          content: "Type 'yes' if you'd like me to explain this topic, or 'next' to move to the next question.",
          sender: 'ai',
          timestamp: new Date()
        }]);
      } else if (responseResult.cross_question) {
        // Regular follow-up question
        setMessages(prev => [...prev, {
          id: generateUniqueId(),
          content: `${responseResult.feedback}\n\nFollow-up question:\n${responseResult.cross_question}`,
          sender: 'ai',
          timestamp: new Date()
        }]);
      }
    } catch (error) {
      console.error('Error processing response:', error);
      setMessages(prev => [...prev, {
        id: generateUniqueId(),
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
          id: generateUniqueId(),
          content: `Interview complete!\n\nFeedback Summary:\n${feedback.overall_feedback}\n\nClick the download button below to get your detailed feedback PDF.`,
          sender: 'ai',
          timestamp: new Date()
        }]);
        toast.success('Interview completed! Please download your feedback PDF.', {
          duration: 5000,
          position: 'bottom-center'
        });
      } else {
        setInterviewState(prev => ({ 
          ...prev, 
          currentQuestionId: nextQuestion.id,
          currentQuestionOrder: nextQuestion.order,
          questionsRemaining: prev.questionsRemaining - 1
        }));
        setMessages(prev => [...prev, {
          id: generateUniqueId(),
          content: nextQuestion.text,
          sender: 'ai',
          timestamp: new Date()
        }]);

        // Check if this was the last question
        if (interviewState.questionsRemaining === 1) {
          const feedback = await interviewApi.getFeedbackSummary(interviewState.sessionId);
          setInterviewState(prev => ({ ...prev, isComplete: true }));
          setMessages(prev => [...prev, {
            id: generateUniqueId(),
            content: `Interview complete!\n\nFeedback Summary:\n${feedback.overall_feedback}\n\nClick the download button below to get your detailed feedback PDF.`,
            sender: 'ai',
            timestamp: new Date()
          }]);
          toast.success('Interview completed! Please download your feedback PDF.', {
            duration: 5000,
            position: 'bottom-center'
          });
        }
      }
    } catch (error) {
      console.error('Error getting next question:', error);
      setMessages(prev => [...prev, {
        id: generateUniqueId(),
        content: 'Sorry, there was an error getting the next question. Please try again.',
        sender: 'ai',
        timestamp: new Date()
      }]);
      toast.error('Error getting next question. Please try again.');
    } finally {
      setIsAiTyping(false);
    }
  };

  const generateUniqueId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const sendMessage = useCallback((content: string, sender: 'user' | 'ai' = 'user') => {
    if (!content.trim()) return;

    // Add the message to the chat
    setMessages(prev => [...prev, {
      id: generateUniqueId(),
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

  const downloadTranscript = useCallback(async () => {
    if (!interviewState.sessionId) return;

    try {
      toast.loading('Preparing your feedback PDF...', { id: 'download-pdf' });
      
      const pdfBlob = await interviewApi.downloadTranscriptPDF(interviewState.sessionId);
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `interview-transcript-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Feedback PDF downloaded successfully!', { id: 'download-pdf' });
    } catch (error) {
      console.error('Error downloading transcript:', error);
      toast.error('Failed to download feedback PDF. Please try again.', { id: 'download-pdf' });
    }
  }, [interviewState.sessionId]);

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