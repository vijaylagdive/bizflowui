export interface AuthUser {
  userId: number;
  username: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}
