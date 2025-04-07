import { z } from 'zod';

export const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must be less than 72 characters'),
  confirmPassword: z.string(),
  company_name: z.string().min(1, 'Company name is required')
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const userSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least 1 uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least 1 lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least 1 number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least 1 special character')
    .optional(),
  company_name: z.string().min(1, 'Company name is required').max(100, 'Company name too long'),
  role: z.enum(['admin', 'user', 'manager']),
});

export type UserFormData = z.infer<typeof userSchema>;

export interface Profile {
  id: string;
  email: string;
  company_name: string;
  role: 'admin' | 'user' | 'manager';
  last_login: string;
  status: boolean;
  created_at: string;
  updated_at: string;
}

export const workflowSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  description: z.string().max(500, 'Description is too long').optional(),
  status: z.enum(['active', 'inactive', 'archived']).default('active'),
  stages: z.array(z.object({
    name: z.string(),
    description: z.string().optional(),
    order: z.number(),
  })).default([]),
  assignment_rules: z.record(z.any()).default({}),
  approval_levels: z.number().min(1).max(10).default(1),
  supports_documents: z.boolean().default(false),
});

export type SignUpInput = z.infer<typeof signUpSchema>;

export interface Profile {
  id: string;
  email: string;
  company_name: string;
  role: 'admin' | 'user' | 'manager';
  last_login: string;
  status: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkflowConfig {
  id: string;
  name: string;
  worker_id: string;
  api_auth_token: string;
  supports_documents?: boolean;
  supports_images?: boolean;
}

export interface Workflow extends WorkflowConfig {
  description: string;
  status: 'active' | 'inactive' | 'archived';
  created_at: string;
  updated_at: string;
  order: number;
  variables: any[];
}