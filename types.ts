
export enum Role {
  CITIZEN = 'citizen',
  REPORTER = 'reporter'
}

export enum NewsField {
  TECH_AI = 'Technology / AI',
  JOBS = 'Jobs / Daily Information'
}

export enum NewsRegion {
  STATE = 'State-wise',
  NATIONAL = 'National-wise',
  INTERNATIONAL = 'International-wise'
}

export interface User {
  email: string;
  role: Role;
  isVerified?: boolean;
  phoneNumber?: string;
  idProofUrl?: string;
}

export interface NewsItemSource {
  title: string;
  uri: string;
}

export interface NewsItem {
  id: string;
  title: string;
  description: string;
  field: NewsField;
  region: NewsRegion;
  stateName?: string;
  reporterId: string;
  postedDate: string;
  imageUrl?: string;
  source: 'external' | 'reporter';
  fontStyle?: string;
  sources?: NewsItemSource[];
}

export type ViewStep = 'LOGIN' | 'ROLE_SELECT' | 'VERIFICATION' | 'FIELD_SELECT' | 'REGION_SELECT' | 'DASHBOARD';
