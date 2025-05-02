import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { InterviewResponse } from '../types/interview';

const API_URL = 'http://localhost:8000/api';

// Create axios instance with default config
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add request interceptor for JWT
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('token');
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

interface AuthResponse {
    access: string;
    refresh: string;
    user?: {
        email: string;
        username: string;
    };
}

// Interview API functions
export const interviewApi = {
    // Generate initial questions
    generateQuestions: async (category: string): Promise<InterviewResponse> => {
        const response = await api.post<InterviewResponse>('/interviews/generate-questions/', {
            category: category
        });
        return response.data;
    },

    // Get next question
    getNextQuestion: async (sessionId: number, currentOrder: number) => {
        const response = await api.get(`/interviews/sessions/${sessionId}/next-question/${currentOrder}/`);
        return response.data;
    },

    // Submit response for a question
    submitResponse: async (sessionId: number, questionId: number, responseText: string) => {
        const res = await api.post(`/interviews/submit-response/${sessionId}/${questionId}/`, {
            response: responseText
        });
        return res.data;
    },

    // Get feedback summary
    getFeedbackSummary: async (sessionId: number) => {
        const response = await api.post(`/interviews/sessions/${sessionId}/feedback/`);
        return response.data;
    },

    downloadTranscriptPDF: async (sessionId: number) => {
        try {
            console.log(`Requesting PDF for session ${sessionId}`);
            
            // Use the dedicated PDF endpoint
            const response = await api.get(
                `/interviews/sessions/${sessionId}/feedback/pdf/`, 
                { responseType: 'blob' }
            );
            return response.data;
            
        } catch (error) {
            console.error('Error downloading transcript:', error);
            throw error;
        }
    }
};

// Auth API functions
export const authApi = {
    register: async (email: string, username: string, password: string, password2: string): Promise<AuthResponse> => {
        try {
            const response = await api.post<AuthResponse>('/auth/register/', {
                email,
                username,
                password,
                password2,
            });
            const { access } = response.data;
            localStorage.setItem('token', access);
            return response.data;
        } catch (error) {
            if (error instanceof AxiosError && error.response) {
                throw new Error(error.response.data.detail || 'Registration failed');
            }
            throw new Error('Registration failed');
        }
    },

    login: async (email: string, password: string): Promise<AuthResponse> => {
        try {
            const response = await api.post<AuthResponse>('/auth/login/', {
                email,
                password,
            });
            const { access } = response.data;
            localStorage.setItem('token', access);
            return response.data;
        } catch (error) {
            if (error instanceof AxiosError && error.response) {
                throw new Error(error.response.data.detail || 'Login failed');
            }
            throw new Error('Login failed');
        }
    },

    logout: () => {
        localStorage.removeItem('token');
    },
};

export default api;