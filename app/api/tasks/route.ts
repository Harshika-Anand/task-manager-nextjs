import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectMongoDB from '@/lib/mongodb';
import Task from '@/models/Task';
import { ApiResponse, CreateTaskData } from '@/types';
import { CreateTaskSchema, TaskQuerySchema, formatZodError } from '@/lib/validations';

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
    // Get token from Authorization header or cookies
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

// GET /api/tasks - Get all tasks for the current user
export async function GET(request: Request) {
  try {
    console.log('📝 Fetching tasks...');
    
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
    
    // Get URL parameters for filtering
    const url = new URL(request.url);
    const queryParams = {
      status: url.searchParams.get('status') || undefined,
      priority: url.searchParams.get('priority') || undefined,
      category: url.searchParams.get('category') || undefined,
    };
    
    // Validate query parameters with Zod
    const queryValidation = TaskQuerySchema.safeParse(queryParams);
    
    if (!queryValidation.success) {
      console.log('❌ Query validation failed:', queryValidation.error.errors);
      const formattedErrors = formatZodError(queryValidation.error);
      
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid query parameters',
          fieldErrors: formattedErrors
        } as ApiResponse,
        { status: 400 }
      );
    }
    
    // Build filter query
    const filter: any = { userId };
    const validatedParams = queryValidation.data;
    
    if (validatedParams.status) filter.status = validatedParams.status;
    if (validatedParams.priority) filter.priority = validatedParams.priority;
    if (validatedParams.category) filter.category = validatedParams.category;
    
    // Fetch tasks with filters
    const tasks = await Task.find(filter).sort({ createdAt: -1 });
    
    console.log(`✅ Found ${tasks.length} tasks for user ${userId}`);
    
    return NextResponse.json({
      success: true,
      data: tasks,
      message: 'Tasks fetched successfully',
    } as ApiResponse);
    
  } catch (error) {
    console.error('❌ Error fetching tasks:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch tasks',
      } as ApiResponse,
      { status: 500 }
    );
  }
}

// POST /api/tasks - Create a new task
export async function POST(request: Request) {
  try {
    console.log('➕ Creating new task...');
    
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
    
    console.log('Task data:', { 
      title: body.title, 
      priority: body.priority, 
      category: body.category, 
      userId 
    });
    
    // Validate with Zod
    const validationResult = CreateTaskSchema.safeParse(body);
    
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
    
    const { title, description, priority, category, dueDate } = validationResult.data;
    
    // Connect to database
    await connectMongoDB();
    
    // Create new task
    const newTask = new Task({
      title,
      description: description || undefined,
      priority,
      category,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      userId,
    });
    
    const savedTask = await newTask.save();
    console.log('✅ Task created:', savedTask._id);
    
    return NextResponse.json({
      success: true,
      data: savedTask,
      message: 'Task created successfully',
    } as ApiResponse);
    
  } catch (error) {
    console.error('❌ Error creating task:', error);
    
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
        error: 'Failed to create task',
      } as ApiResponse,
      { status: 500 }
    );
  }
}