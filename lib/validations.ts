import { z } from 'zod';
import { TaskStatus, TaskPriority, TaskCategory } from '@/types';

// User validation schemas
export const RegisterSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .trim(),
  email: z.string()
    .email('Please enter a valid email address')
    .toLowerCase()
    .trim(),
  password: z.string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password is too long'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const LoginSchema = z.object({
  email: z.string()
    .email('Please enter a valid email address')
    .toLowerCase()
    .trim(),
  password: z.string()
    .min(1, 'Password is required')
});

// Task validation schemas
export const CreateTaskSchema = z.object({
  title: z.string()
    .min(1, 'Task title is required')
    .max(200, 'Title must be less than 200 characters')
    .trim(),
  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .trim()
    .optional()
    .or(z.literal('')), // Allow empty string
  priority: z.nativeEnum(TaskPriority, {
    errorMap: () => ({ message: 'Please select a valid priority' })
  }),
  category: z.nativeEnum(TaskCategory, {
    errorMap: () => ({ message: 'Please select a valid category' })
  }),
  dueDate: z.string()
    .optional()
    .or(z.literal(''))
    .refine((date) => {
      if (!date) return true; // Optional field
      const dueDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return dueDate >= today;
    }, 'Due date cannot be in the past')
});

export const UpdateTaskSchema = CreateTaskSchema.extend({
  status: z.nativeEnum(TaskStatus, {
    errorMap: () => ({ message: 'Please select a valid status' })
  }).optional(),
}).partial(); // All fields are optional for updates

// API parameter schemas
export const TaskIdSchema = z.object({
  id: z.string().min(1, 'Task ID is required')
});

export const TaskQuerySchema = z.object({
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  category: z.nativeEnum(TaskCategory).optional(),
});

// Type inference - automatically generate TypeScript types from schemas
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;
export type TaskQueryInput = z.infer<typeof TaskQuerySchema>;

// Utility function to format Zod errors
export function formatZodError(error: z.ZodError): { [key: string]: string } {
  const formattedErrors: { [key: string]: string } = {};
  
  error.errors.forEach((err) => {
    const path = err.path.join('.');
    formattedErrors[path] = err.message;
  });
  
  return formattedErrors;
}