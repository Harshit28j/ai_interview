export interface Question {
    id: number;
    text: string;
    order: number;
    session?: number;
}

export interface InterviewResponse {
    session_id: number;
    questions: Question[];
}

export interface SubmitResponseResult {
    cross_question?: string;
    feedback: string;
    next_question?: Question;
    message?: string;
}

export interface FeedbackSummary {
    verdict: string;
    strengths: string[];
    improvements: string[];
    overall_feedback: string;
} 