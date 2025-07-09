import { NextResponse } from 'next/server';
import connectMongoDB from '@/lib/mongodb';
import User from '@/models/User';
import { ApiResponse } from '@/types';
import { RegisterSchema, formatZodError } from '@/lib/validations';

export async function POST(request: Request) {
  try {
    console.log('📝 Registration attempt...');
    
    // Connect to database
    await connectMongoDB();
    
    // Parse request body
    const body = await request.json();
    
    console.log('Registration data:', { 
      name: body.name, 
      email: body.email, 
      passwordLength: body.password?.length 
    });
    
    // Validate with Zod
    const validationResult = RegisterSchema.safeParse(body);
    
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
    
    const { name, email, password } = validationResult.data;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('❌ User already exists:', email);
      return NextResponse.json(
        {
          success: false,
          error: 'User with this email already exists',
        } as ApiResponse,
        { status: 400 }
      );
    }
    
    // Create new user (password will be automatically hashed by the pre-save middleware)
    const newUser = new User({
      name,
      email,
      password,
    });
    
    const savedUser = await newUser.save();
    console.log('✅ User created successfully:', savedUser._id);
    
    // Return user data (without password)
    const userResponse = {
      _id: savedUser._id,
      name: savedUser.name,
      email: savedUser.email,
      avatar: savedUser.avatar,
      createdAt: savedUser.createdAt,
    };
    
    return NextResponse.json({
      success: true,
      message: 'User registered successfully',
      data: userResponse,
    } as ApiResponse);
    
  } catch (error) {
    console.error('❌ Registration error:', error);
    
    // Handle MongoDB validation errors
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
    
    // Handle duplicate key error (email already exists)
    if (error instanceof Error && error.message.includes('E11000')) {
      return NextResponse.json(
        {
          success: false,
          error: 'User with this email already exists',
        } as ApiResponse,
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      {
        success: false,
        error: 'Registration failed. Please try again.',
      } as ApiResponse,
      { status: 500 }
    );
  }
}