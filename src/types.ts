export interface Question {
  id: string;
  order: number;
  text: string;
  videoUrl: string; // Blob URL or base64 data URI
}

export interface InterviewFlow {
  id: string;
  title: string;
  webhookUrl: string;
  questions: Question[];
}

export interface AnalysisResult {
  transcription: string;
  sentiment: string;
  keyPoints: string[];
  score: number;
}

export interface Answer {
  questionId: string;
  videoBlob: Blob;
  analysis?: AnalysisResult;
}

export enum AppMode {
  HOME = 'HOME',
  ADMIN = 'ADMIN',
  INTERVIEW = 'INTERVIEW'
}