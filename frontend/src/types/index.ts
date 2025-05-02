export type InterviewType = 'HR' | 'Technical' | 'Behavioral' | 'Leadership' | 'Case Study' | 'System Design';

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

export interface InterviewState {
  sessionId: number | null;
  currentQuestionOrder: number;
  isComplete: boolean;
}

export interface ChatContextType {
  messages: Message[];
  isAiTyping: boolean;
  interviewType: InterviewType;
  interviewState: InterviewState;
  setInterviewType: (type: InterviewType) => void;
  sendMessage: (content: string, sender?: 'user' | 'ai') => void;
  downloadTranscript: () => void;
}