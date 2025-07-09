import mongoose, { Document, Model, Schema } from 'mongoose';

// TypeScript enums for the server-side model
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

// TypeScript interface for Task document (server-side)
export interface ITaskDocument extends Document {
  _id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  category: TaskCategory;
  dueDate?: Date;
  completedAt?: Date;
  userId: mongoose.Types.ObjectId; // ObjectId for server-side
  createdAt: Date;
  updatedAt: Date;
}

// Mongoose schema definition
const TaskSchema = new Schema<ITaskDocument>(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      minlength: [1, 'Task title cannot be empty'],
      maxlength: [200, 'Task title must be less than 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description must be less than 1000 characters'],
    },
    status: {
      type: String,
      enum: Object.values(TaskStatus),
      default: TaskStatus.PENDING,
    },
    priority: {
      type: String,
      enum: Object.values(TaskPriority),
      default: TaskPriority.MEDIUM,
    },
    category: {
      type: String,
      enum: Object.values(TaskCategory),
      default: TaskCategory.OTHER,
    },
    dueDate: {
      type: Date,
      validate: {
        validator: function (value: Date) {
          // Due date should be in the future (optional validation)
          return !value || value > new Date();
        },
        message: 'Due date should be in the future',
      },
    },
    completedAt: {
      type: Date,
      default: null,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User', // Reference to User model
      required: [true, 'User ID is required'],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
TaskSchema.index({ userId: 1 }); // Tasks by user
TaskSchema.index({ status: 1 }); // Tasks by status
TaskSchema.index({ dueDate: 1 }); // Tasks by due date
TaskSchema.index({ userId: 1, status: 1 }); // Compound index

// Middleware to set completedAt when status changes to completed
TaskSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    if (this.status === TaskStatus.COMPLETED && !this.completedAt) {
      this.completedAt = new Date();
    } else if (this.status !== TaskStatus.COMPLETED) {
      this.completedAt = undefined;
    }
  }
  next();
});

// Static method to get tasks by user
TaskSchema.statics.findByUser = function (userId: string) {
  return this.find({ userId }).sort({ createdAt: -1 });
};

// Static method to get overdue tasks
TaskSchema.statics.findOverdue = function (userId: string) {
  return this.find({
    userId,
    dueDate: { $lt: new Date() },
    status: { $ne: TaskStatus.COMPLETED },
  });
};

// Export the model
const Task: Model<ITaskDocument> = mongoose.models.Task || mongoose.model<ITaskDocument>('Task', TaskSchema);

export default Task;