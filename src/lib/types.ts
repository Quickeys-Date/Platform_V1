// src/lib/types.ts

export type UserRole = 'USER' | 'ADMIN'
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED'
export type ConversationStatus = 'active' | 'archived'
export type TriggerType = 'CLOSE_CONVERSATION' | 'INACTIVITY'
export type StateId = 'PAX_GOOD' | 'PAX_NEUTRAL' | 'PAX_NOT_GREAT' | 'PAX_CONFUSED' | 'PAX_DISAPPOINTED'
export type FeedbackResponse = 'FEEDBACK_YES' | 'FEEDBACK_NOT_QUITE'
export type ReportType = 'REPORT_INAPPROPRIATE' | 'REPORT_HARASSMENT' | 'REPORT_SPAM' | 'REPORT_FAKE' | 'REPORT_OTHER'

export interface Profile {
  id: string
  email: string
  first_name: string
  date_of_birth: string | null
  gender: string
  interested_in: string[]
  city: string
  state: string
  bio: string | null
  connection_prompt: string | null
  age_range_min: number
  age_range_max: number
  location_radius: string
  photos: string[]
  role: UserRole
  status: UserStatus
  pax_onboarded: boolean
  profile_complete: boolean
  created_at: string
  updated_at: string
}

export interface Conversation {
  id: string
  initiator_id: string
  recipient_id: string
  status: ConversationStatus
  archived_at: string | null
  archived_by: string | null
  last_message_at: string
  created_at: string
  other_profile?: Profile
  last_message?: Message
  unread_count?: number
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  created_at: string
  sender?: Profile
}

export interface PaxTrigger {
  id: string
  user_id: string
  conversation_id: string
  trigger_type: TriggerType
  state_id_selected: StateId | null
  feedback_response: FeedbackResponse | null
  feedback_open_text: string | null
  created_at: string
}

export interface Report {
  id: string
  reporter_id: string
  reported_id: string
  report_type: ReportType
  note: string | null
  source_screen: 'Chat' | 'Connection Profile'
  status: 'PENDING' | 'REVIEWED' | 'DISMISSED'
  created_at: string
  reporter?: Profile
  reported?: Profile
}

export interface AdminAction {
  id: string
  admin_id: string
  action: string
  target_user_id: string | null
  target_report_id: string | null
  notes: string | null
  created_at: string
}
