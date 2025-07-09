import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectMongoDB from '@/lib/mongodb';
import User from '@/models/User';
import { ApiResponse, LoginCredentials } from '@/types';

export async function POST(request: Request) {
  try {
    console.log('🔐 Login attempt...');
    
    // Connect to database
    await connectMongoDB();
    
    // Parse request body
    const body: LoginCredentials = await request.json();
    const { email, password } = body;
    
    console.log('Login attempt for:', email);
    
    // Validation
    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email and password are required',
        } as ApiResponse,
        { status: 400 }
      );
    }
    
    // Find user by email (include password for comparison)
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    
    if (!user) {
      console.log('❌ User not found:', email);
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email or password',
        } as ApiResponse,
        { status: 401 }
      );
    }
    
    console.log('User found, checking password...', { 
      hasPassword: !!user.password, 
      passwordLength: user.password?.length 
    });
    
    // Check password
    const isPasswordValid = await user.comparePassword(password);
    console.log('Password validation result:', isPasswordValid);
    
    if (!isPasswordValid) {
      console.log('❌ Invalid password for:', email);
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email or password',
        } as ApiResponse,
        { status: 401 }
      );
    }
    
    // Create JWT token
    if (!process.env.NEXTAUTH_SECRET) {
      throw new Error('NEXTAUTH_SECRET is not configured');
    }
    
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
      },
      process.env.NEXTAUTH_SECRET,
      {
        expiresIn: '7d', // Token expires in 7 days
      }
    );
    
    console.log('✅ Login successful for:', email);
    
    // Prepare user response (without password)
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      createdAt: user.createdAt,
    };
    
    // Create response with HTTP-only cookie
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userResponse,
        token, // In production, you might want to only use HTTP-only cookies
      },
    } as ApiResponse);
    
    // Set HTTP-only cookie for added security
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: false, // Set to false for development (localhost)
      sameSite: 'lax', // Changed from 'strict' to 'lax'
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
      path: '/',
    });
    
    return response;
    
  } catch (error) {
    console.error('❌ Login error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Login failed. Please try again.',
      } as ApiResponse,
      { status: 500 }
    );
  }
}