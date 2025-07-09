// Type definitions - no direct model imports to avoid client-side Mongoose issues

// Task enums - defined here instead of importing from models
export enum TaskStatus {
    PENDING = 'pending',
    IN_PROGRESS = 'in_progress',
    COMPLETED = 'completed',
  }
  
  export enum TaskPriority {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    URGENT = 'urgent',
  }
  
  export enum TaskCategory {
    WORK = 'work',
    PERSONAL = 'personal',
    HEALTH = 'health',
    FINANCE = 'finance',
    LEARNING = 'learning',
    OTHER = 'other',
  }
  
  // User interface
  export interface IUser {
    _id: string;
    name: string;
    email: string;
    password: string;
    avatar?: string;
    createdAt: Date;
    updatedAt: Date;
  }
  
  // Task interface  
  export interface ITask {
    _id: string;
    title: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;
    category: TaskCategory;
    dueDate?: Date;
    completedAt?: Date;
    userId: string; // Keep as string for client-side usage
    createdAt: Date;
    updatedAt: Date;
  }
  
  // API Response types
  export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
    fieldErrors?: { [key: string]: string }; // For Zod validation errors
    details?: string; // For detailed error messages
  }
  
  // Authentication types
  export interface LoginCredentials {
    email: string;
    password: string;
  }
  
  export interface RegisterCredentials {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
  }
  
  // Task form types
  export interface CreateTaskData {
    title: string;
    description?: string;
    priority: TaskPriority;
    category: TaskCategory;
    dueDate?: string; // ISO date string
  }
  
  export interface UpdateTaskData extends Partial<CreateTaskData> {
    status?: TaskStatus;
  }
  
  // User types
  export interface UserProfile {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
    createdAt: string;
  }
  
  // Dashboard stats
  export interface DashboardStats {
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    overdueTasks: number;
    tasksByCategory: Record<TaskCategory, number>;
    tasksByPriority: Record<TaskPriority, number>;
  }
  
  // Component prop types
  export interface TaskCardProps {
    task: ITask;
    onUpdate?: (taskId: string, data: UpdateTaskData) => void;
    onDelete?: (taskId: string) => void;
  }
  
  export interface TaskFormProps {
    task?: ITask;
    onSubmit: (data: CreateTaskData | UpdateTaskData) => void;
    onCancel?: () => void;
    isLoading?: boolean;
  }
  
  // Page props types
  export interface TaskPageProps {
    params: { id: string };
  }
  
  export interface DashboardPageProps {
    searchParams: {
      status?: TaskStatus;
      category?: TaskCategory;
      priority?: TaskPriority;
    };
  }