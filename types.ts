
export enum UserRole {
  NONE = 'NONE',
  OWNER = 'OWNER',
  WORKER = 'WORKER'
}

export enum Nationality {
  TAIWAN = '台灣',
  INDONESIA = '印尼',
  VIETNAM = '越南',
  PHILIPPINES = '菲律賓'
}

export interface UserProfile {
  uid: string;
  email: string;
  photoURL?: string;
  // Private Information
  fullName: string;
  gender: 'male' | 'female'; 
  phoneNumber: string;
  nationality: Nationality;
  // Public Information
  ownedOrchards?: string; // Free text for simplicity in this demo
  skills?: string[];
  creditScore: number;
}

export enum ApplicationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected'
}

export interface JobApplication {
  id: string;
  jobId: string;
  workerId: string;
  workerName: string;
  workerProfileSnapshot: UserProfile; // Store snapshot to view details easily
  status: ApplicationStatus;
  appliedAt: string;
}

export interface ChatMessage {
  id: string;
  jobId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  content: string;
  timestamp: string;
}

export interface JobPost {
  id: string;
  ownerId?: string;
  ownerCreditScore?: number; // Displayed in worker list
  status: 'active' | 'pending' | 'completed';
  title: string; // Derived from crop + task
  crop: string; // farm_type
  task: string; // job_content
  description: string; // notes_raw
  notesSummary?: string; // notes_summary
  payRate: string; // Combination of salary_type + salary_amount
  salaryType?: string;
  salaryAmount?: number;
  location: string; // location_city + district
  locationDistrict?: string;
  date: string; // formatted date_start
  time?: string;
  requiredWorkers: number;
  currentWorkers: number;
  commuteTime?: number; // Calculated field for worker view
  terrain?: 'flat' | 'slope'; // New field: 平地 or 山坡地
  isAiGenerated?: boolean;
}

// Common constants for colors matching the Flutter design
export const THEME_COLORS = {
  OWNER: '#FF8C00', // Dark Orange
  WORKER: '#38761D', // Dark Green
  APP_BAR: '#F1F8E9', // Light Green 50 equivalent
};
