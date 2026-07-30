export type StaffRole = 'DOC' | 'INF' | 'AMM';

export interface StaffMember {
  id: number;
  username: string;
  role: StaffRole;
  isActive: boolean;
}

export interface StaffCreationRequest {
  username: string;
  password: string;
  role: StaffRole;
}

export interface UsernameAvailabilityDto {
  available: boolean;
}
