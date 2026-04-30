export interface User {
  id: string;
  name: string;
  email: string;
  theme: 'light' | 'dark';
  avatar?: string;
}

export interface Academic {
  _id: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  createdAt: string;
}

export interface Semester {
  _id: string;
  academicId: string;
  name: string;
  description?: string;
  createdAt: string;
}

export interface Subject {
  _id: string;
  semesterId: string;
  academicId: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  createdAt: string;
  isLocked?: boolean;
}

export type Progress = 'pending' | 'in-progress' | 'completed';
export type ContentType = 'text' | 'code' | 'image';

export interface ContentBlock {
  _id?: string;
  type: ContentType;
  title: string;
  value: string;
  language?: string;
  order: number;
}

export interface Unit {
  _id: string;
  subjectId: string;
  semesterId: string;
  academicId: string;
  name: string;
  description?: string;
  progress: Progress;
  content: ContentBlock[];
  createdAt: string;
  updatedAt: string;
}

export interface SearchResult {
  type: 'academic' | 'semester' | 'subject' | 'unit';
  id: string;
  name: string;
  icon?: string;
  progress?: Progress;
  academicId?: string;
  semesterId?: string;
  subjectId?: string;
}
