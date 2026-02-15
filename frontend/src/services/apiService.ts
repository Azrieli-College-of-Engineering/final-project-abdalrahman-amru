import type { EncryptedData } from './cryptoService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// API Error class
export class APIError extends Error {
  status: number;
  
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'APIError';
  }
}

// Generic API request helper
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new APIError(
        response.status,
        data.error || data.message || 'An error occurred'
      );
    }

    return data;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(0, 'Network error: Unable to connect to server');
  }
}

// Auth API
export interface RegisterData {
  email: string;
  usernameHash: string;
  passwordVerifier: string;
  saltLogin: string;
}

export interface LoginData {
  email: string;
  passwordVerifier: string;
}

export interface AuthResponse {
  token: string;
  userId: number;
  email: string;
  saltLogin?: string;
}

export interface RegisterResponse {
  message: string;
  userId: number;
}

export const authAPI = {
  register: (data: RegisterData): Promise<RegisterResponse> =>
    apiRequest<RegisterResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (data: LoginData): Promise<AuthResponse> =>
    apiRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// Notes API
export interface Note {
  id: number;
  ciphertext: string;
  iv: string;
  authTag: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotesListResponse {
  notes: Note[];
}

export interface CreateNoteResponse {
  message: string;
  noteId: number;
  createdAt: string;
}

export interface UpdateNoteResponse {
  message: string;
  noteId: number;
  updatedAt: string;
}

export const notesAPI = {
  getAll: (token: string): Promise<NotesListResponse> =>
    apiRequest<NotesListResponse>('/notes', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),

  getOne: (token: string, noteId: number): Promise<Note> =>
    apiRequest<Note>(`/notes/${noteId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),

  create: (token: string, encryptedData: EncryptedData): Promise<CreateNoteResponse> =>
    apiRequest<CreateNoteResponse>('/notes', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(encryptedData),
    }),

  update: (
    token: string,
    noteId: number,
    encryptedData: EncryptedData
  ): Promise<UpdateNoteResponse> =>
    apiRequest<UpdateNoteResponse>(`/notes/${noteId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(encryptedData),
    }),

  delete: (token: string, noteId: number): Promise<void> =>
    apiRequest<void>(`/notes/${noteId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),
};
