import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectMongoDB from '@/lib/mongodb';
import Task from '@/models/Task';
import { ApiResponse } from '@/types';
import { UpdateTaskSchema, TaskIdSchema, formatZodError } from '@/lib/validations';

// Interface for JWT payload
interface JWTPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

// Helper function to get user from token
async function getUserFromToken(request: Request): Promise<string | null> {
  try {
    const authHeader = request.headers.get('authorization');
    const cookieHeader = request.headers.get('cookie');
    
    let token: string | null = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (cookieHeader) {
      const cookies = cookieHeader.split(';');
      const authCookie = cookies.find(cookie => cookie.trim().startsWith('auth-token='));
      if (authCookie) {
        token = authCookie.split('=')[1];
      }
    }
    
    if (!token || !process.env.NEXTAUTH_SECRET) {
      return null;
    }
    
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET) as JWTPayload;
    return decoded.userId;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

// GET /api/tasks/[id] - Get a specific task
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Await params in newer Next.js versions
    const { id } = await params;
    console.log(`📖 Fetching task ${id}...`);
    
    // Get user ID from token
    const userId = await getUserFromToken(request);
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
        } as ApiResponse,
        { status: 401 }
      );
    }
    
    // Connect to database
    await connectMongoDB();
    
    // Find task by ID and ensure it belongs to the user
    const task = await Task.findOne({ _id: id, userId });
    
    if (!task) {
      console.log(`❌ Task ${id} not found or unauthorized`);
      return NextResponse.json(
        {
          success: false,
          error: 'Task not found',
        } as ApiResponse,
        { status: 404 }
      );
    }
    
    console.log(`✅ Task ${id} fetched successfully`);
    
    return NextResponse.json({
      success: true,
      data: task,
      message: 'Task fetched successfully',
    } as ApiResponse);
    
  } catch (error) {
    console.error('❌ Error fetching task:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch task',
      } as ApiResponse,
      { status: 500 }
    );
  }
}

// PATCH /api/tasks/[id] - Update a specific task
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Await params in newer Next.js versions
    const { id } = await params;
    
    // Validate task ID
    const idValidation = TaskIdSchema.safeParse({ id });
    if (!idValidation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid task ID',
        } as ApiResponse,
        { status: 400 }
      );
    }
    
    console.log(`🔄 Updating task ${id}...`);
    
    // Get user ID from token
    const userId = await getUserFromToken(request);
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
        } as ApiResponse,
        { status: 401 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    console.log('Update data:', body);
    
    // Validate with Zod
    const validationResult = UpdateTaskSchema.safeParse(body);
    
    if (!validationResult.success) {
      console.log('❌ Validation failed:', validationResult.error.errors);
      const formattedErrors = formatZodError(validationResult.error);
      
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          fieldErrors: formattedErrors
        } as ApiResponse,
        { status: 400 }
      );
    }
    
    const updateData = validationResult.data;
    
    // Connect to database
    await connectMongoDB();
    
    // Find and update task (ensure it belongs to the user)
    const updatedTask = await Task.findOneAndUpdate(
      { _id: id, userId },
      { ...updateData },
      { new: true, runValidators: true }
    );
    
    if (!updatedTask) {
      console.log(`❌ Task ${id} not found or unauthorized`);
      return NextResponse.json(
        {
          success: false,
          error: 'Task not found',
        } as ApiResponse,
        { status: 404 }
      );
    }
    
    console.log(`✅ Task ${id} updated successfully`);
    
    return NextResponse.json({
      success: true,
      data: updatedTask,
      message: 'Task updated successfully',
    } as ApiResponse);
    
  } catch (error) {
    console.error('❌ Error updating task:', error);
    
    // Handle validation errors
    if (error instanceof Error && error.name === 'ValidationError') {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: error.message,
        } as ApiResponse,
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update task',
      } as ApiResponse,
      { status: 500 }
    );
  }
}

// DELETE /api/tasks/[id] - Delete a specific task
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Await params in newer Next.js versions
    const { id } = await params;
    
    // Validate task ID
    const idValidation = TaskIdSchema.safeParse({ id });
    if (!idValidation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid task ID',
        } as ApiResponse,
        { status: 400 }
      );
    }
    
    console.log(`🗑️ Deleting task ${id}...`);
    
    // Get user ID from token
    const userId = await getUserFromToken(request);
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
        } as ApiResponse,
        { status: 401 }
      );
    }
    
    // Connect to database
    await connectMongoDB();
    
    // Find and delete task (ensure it belongs to the user)
    const deletedTask = await Task.findOneAndDelete({ _id: id, userId });
    
    if (!deletedTask) {
      console.log(`❌ Task ${id} not found or unauthorized`);
      return NextResponse.json(
        {
          success: false,
          error: 'Task not found',
        } as ApiResponse,
        { status: 404 }
      );
    }
    
    console.log(`✅ Task ${id} deleted successfully`);
    
    return NextResponse.json({
      success: true,
      data: deletedTask,
      message: 'Task deleted successfully',
    } as ApiResponse);
    
  } catch (error) {
    console.error('❌ Error deleting task:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete task',
      } as ApiResponse,
      { status: 500 }
    );
  }
}