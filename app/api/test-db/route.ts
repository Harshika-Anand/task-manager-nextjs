import { NextResponse } from 'next/server';
import connectMongoDB from '@/lib/mongodb';
import User from '@/models/User';
import Task from '@/models/Task';

export async function GET() {
  try {
    console.log('Testing database connection...');
    
    // Connect to MongoDB
    await connectMongoDB();
    
    // Test database operations
    const userCount = await User.countDocuments();
    const taskCount = await Task.countDocuments();
    
    console.log(`Database connected! Found ${userCount} users and ${taskCount} tasks`);
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful!',
      data: {
        userCount,
        taskCount,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Database connection failed:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Database connection failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}