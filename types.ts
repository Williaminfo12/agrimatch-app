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
  fullName: string;
  gender: 'male' | 'female'; 
  phoneNumber: string;
  nationality: Nationality;
  ownedOrchards?: string; 
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
  workerProfileSnapshot: UserProfile;
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
  ownerCreditScore?: number;
  status: 'active' | 'pending' | 'completed';
  title: string;
  crop: string;
  task: string;
  description: string;
  payRate: string;
  salaryType?: string;
  salaryAmount?: number;
  location: string;
  locationDistrict?: string;
  date: string;
  time?: string;
  requiredWorkers: number;
  currentWorkers: number;
  terrain?: 'flat' | 'slope';
  isAiGenerated?: boolean;
}

export const THEME_COLORS = {
  OWNER: '#FF8C00',
  WORKER: '#38761D',
  APP_BAR: '#F1F8E9',
};