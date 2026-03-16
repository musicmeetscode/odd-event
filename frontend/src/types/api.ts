// API Response Types

export interface Session {
  id: number;
  title: string;
  start_time: string;
  room_location: string;
  speakers: number[];
  speaker_names: string[];
}

export interface Question {
  id: number;
  session: number;
  member: number;
  member_name: string;
  content: string;
  created_at: string;
  is_answered: boolean;
  answer_text: string | null;
}

export interface AuthResponse {
  token: string;
  nickname?: string;
  username?: string;
  is_speaker?: boolean;
}

export interface WebSocketMessage {
  type: 'new_question' | 'question_answered';
  data: Question;
}
