// API Response Types

export type UserRole = 'attendee' | 'judge' | 'admin' | 'speaker';

export type EventType = 'hackathon' | 'meeting' | 'competition' | 'conference' | 'workshop' | 'other';

export type SessionType = 'talk' | 'workshop' | 'panel' | 'break' | 'keynote' | 'other';

export interface AuthResponse {
  token: string;
  username: string;
  display_name?: string;
  role: UserRole;
  avatar_url?: string;
  must_reset_password?: boolean;
  check_in_result?: any;
}

export interface User {
  id: number;
  username: string;
  display_name: string;
  name: string;
  role: UserRole;
  email: string;
  bio?: string;
  profession?: string;
  avatar_url?: string;
  is_flagged?: boolean;
  is_google_connected?: boolean;
}

export interface Partner {
  id: number;
  name: string;
  logo: string;
  website_url: string;
}

export interface Signatory {
  id: number;
  name: string;
  title: string;
  organization: string;
  signature: string;
}

export interface Event {
  id: number;
  title: string;
  description: string;
  event_type: EventType;
  start_date: string;
  end_date: string;
  location: string;
  is_active: boolean;
  max_attendees: number | null;
  allow_teams: boolean;
  max_team_size: number;
  attendee_count: number;
  created_by_name: string;
  certificates_released: boolean;
  is_registered: boolean;
  is_competition?: boolean;
  judging_criteria?: JudgingCriteria[];
  partners: Partner[];
  signatory_1: Signatory | null;
  signatory_2: Signatory | null;
  signatory_3: Signatory | null;
  is_recurring?: boolean;
  recurrence_type?: 'daily' | 'weekly' | 'monthly' | null;
  recurrence_end_date?: string | null;
  recurrence_group_id?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface EventRegistration {
  id: number;
  event: number;
  user: number;
  name: string;
  username: string;
  email: string;
  profession: string;
  is_flagged?: boolean;
  registered_at: string;
  status: 'registered' | 'checked_in' | 'cancelled';
}

export interface Session {
  id: number;
  event: number;
  title: string;
  description: string;
  session_type: SessionType;
  start_time: string;
  end_time: string | null;
  room_location: string;
  speakers: number[];
  speaker_names: string[];
  question_count: number;
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

export interface Submission {
  id: number;
  event: number;
  submitted_by: number;
  submitted_by_name: string;
  team?: number | null;
  team_name?: string | null;
  title: string;
  description: string;
  repo_url: string;
  demo_url: string;
  submitted_at: string;
  scores?: Score[];
  total_weighted_score?: number;
}

export interface JudgingCriteria {
  id: number;
  name: string;
  description: string;
  max_score: number;
  weight: number;
}

export interface Score {
  id: number;
  submission: number;
  criteria: number;
  criteria_name: string;
  max_score: number;
  judge: number;
  judge_name: string;
  score: number;
  comment: string;
  scored_at: string;
}

export interface LeaderboardEntry {
  rank: number;
  submission_id: number;
  title: string;
  submitted_by: string;
  total_score: number;
}

export interface JudgeDashboardEvent {
  event_id: number;
  event_title: string;
  event_type: EventType;
  total_submissions: number;
  scored_submissions: number;
  criteria: JudgingCriteria[];
}

export interface WebSocketMessage {
  type: 'new_question' | 'question_answered' | 'leaderboard_update';
  data: Question | LeaderboardEntry[];
}

// ─── Teams ──────────────────────────────────────────────────────

export interface TeamMember {
  id: number;
  team: number;
  user: number;
  user_name: string;
  username: string;
  role: 'leader' | 'member';
  joined_at: string;
}

export interface Team {
  id: number;
  event: number;
  name: string;
  created_by: number;
  created_by_name: string;
  members: TeamMember[];
  member_count: number;
  created_at: string;
}

// ─── Analytics ──────────────────────────────────────────────────

export interface EventAnalytics {
  total_registered: number;
  checked_in: number;
  check_in_rate: number;
  sessions_count: number;
  submissions_count: number;
  teams_count: number;
  judges_count: number;
  average_score: number;
  registration_timeline: { date: string; count: number }[];
}

// ─── Speakers ───────────────────────────────────────────────────

export interface Speaker {
  id: number;
  display_name: string;
  profession: string;
  bio: string;
  avatar_url: string;
  sessions: { id: number; title: string; session_type: string; start_time: string }[];
}

// ─── Certificate ────────────────────────────────────────────────

export interface CertificateData {
  event: Event;
  attendee_name: string;
  certificate_type: string;
  rank: number | null;
  submission: Submission | null;
  sharing_url: string | null;
}
