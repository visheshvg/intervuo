export interface User {
  id: string;
  email: string;
  name: string;
}

export interface InterviewSession {
  id: string;
  field: string;
  experience_level: string;
  questions: string[];
  total_score: number | null;
  created_at: string;
  completed_at: string | null;
}

export interface InterviewAnswer {
  question_index: number;
  question_text: string;
  answer_text: string | null;
  content_score: number | null;
  sentiment_score: number | null;
  final_score: number | null;
  strengths: string | null;
  improvements: string | null;
  model_answer: string | null;
  word_count: number | null;
  filler_count: number | null;
  speaking_wpm: number | null;
  vader_compound: number | null;
  eye_contact_pct: number | null;
}

export interface SessionDetail extends InterviewSession {
  answers: InterviewAnswer[];
}

export interface FeedbackPayload {
  question_index: number;
  content_score: number;
  sentiment_score: number;
  final_score: number;
  strengths: string;
  improvements: string;
  model_answer: string;
  word_count: number;
  filler_count: number;
  speaking_wpm: number | null;
  vader_compound: number;
  eye_contact_pct: number | null;
}

export interface ResumeTip {
  present: boolean;
  text: string;
}

export interface CourseRec {
  name: string;
  url: string;
}

export interface UploadResumeResponse {
  session_id: string;
  questions: string[];
  skills: string[];
  parsed_name: string;
  phone: string;
  page_count: number;
  resume_score: number;
  resume_tips: ResumeTip[];
  predicted_field: string;
  recommended_skills: string[];
  courses: CourseRec[];
}

export interface SubmitAnswerResponse {
  success: boolean;
  content_score: number;
  sentiment_score: number;
  final_score: number;
  strengths: string;
  improvements: string;
  model_answer: string;
  word_count: number;
  filler_count: number;
  speaking_wpm: number | null;
  vader_compound: number;
  eye_contact_pct: number | null;
}

export interface AnalyticsHistory {
  session_id: string;
  field: string;
  level: string;
  avg_score: number;
  total_questions: number;
  answered_questions: number;
  date: string;
}

export interface Analytics {
  total_sessions: number;
  average_score: number;
  best_score: number;
  history: AnalyticsHistory[];
}

export type ExperienceLevel = "fresher" | "intermediate" | "experienced";

export type InterviewField =
  | "Backend"
  | "Frontend"
  | "Full Stack"
  | "ML / AI"
  | "DevOps"
  | "Mobile"
  | "General";
