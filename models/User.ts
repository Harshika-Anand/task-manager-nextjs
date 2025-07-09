import mongoose, { Document, Model, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

// TypeScript interface for User document
// This defines what properties a User object should have
export interface IUser extends Document {
  _id: string;
  name: string;
  email: string;
  password: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
  // Method to check password
  comparePassword(password: string): Promise<boolean>;
}

// Mongoose schema definition
// This defines the structure in MongoDB
const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name must be less than 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please enter a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't include password when fetching user by default
    },
    avatar: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

// Add indexes for better query performance
// Removed duplicate email index since we already have unique: true above

// Hash password before saving
UserSchema.pre('save', async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    console.log('🔒 Hashing password for user:', this.email);
    console.log('Original password length:', this.password.length);
    
    // Hash password with cost of 12 (very secure)
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(this.password, saltRounds);
    
    console.log('Hashed password length:', hashedPassword.length);
    
    this.password = hashedPassword;
    next();
  } catch (error) {
    console.error('❌ Password hashing error:', error);
    next(error as Error);
  }
});

// Instance method to compare password
UserSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  try {
    console.log('Comparing passwords...', { 
      inputPassword: password,
      hasStoredPassword: !!this.password,
      storedPasswordLength: this.password?.length 
    });
    
    const result = await bcrypt.compare(password, this.password);
    console.log('bcrypt.compare result:', result);
    return result;
  } catch (error) {
    console.error('Password comparison error:', error);
    return false;
  }
};

// Export the model
// Use mongoose.models.User if it exists (for hot reload), otherwise create new model
const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;