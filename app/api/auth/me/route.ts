import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectMongoDB from '@/lib/mongodb';
import User from '@/models/User';
import { ApiResponse } from '@/types';

// Interface for JWT payload
interface JWTPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

export async function GET(request: Request) {
  try {
    console.log('👤 Getting current user...');
    
    // Get token from Authorization header or cookies
    const authHeader = request.headers.get('authorization');
    const cookieHeader = request.headers.get('cookie');
    
    console.log('Auth header:', authHeader ? 'Present' : 'Missing');
    console.log('Cookie header:', cookieHeader ? 'Present' : 'Missing');
    
    let token: string | null = null;
    
    // Try to get token from Authorization header first
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
      console.log('Token from Authorization header');
    }
    // If not found, try to get from cookies
    else if (cookieHeader) {
      const cookies = cookieHeader.split(';');
      const authCookie = cookies.find(cookie => cookie.trim().startsWith('auth-token='));
      if (authCookie) {
        token = authCookie.split('=')[1];
        console.log('Token from cookie found');
      } else {
        console.log('No auth-token cookie found');
        console.log('Available cookies:', cookies.map(c => c.trim().split('=')[0]));
      }
    }
    
    if (!token) {
      console.log('❌ No token found');
      return NextResponse.json(
        {
          success: false,
          error: 'No authentication token provided',
        } as ApiResponse,
        { status: 401 }
      );
    }
    
    // Verify JWT token
    if (!process.env.NEXTAUTH_SECRET) {
      throw new Error('NEXTAUTH_SECRET is not configured');
    }
    
    console.log('Verifying token...');
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET) as JWTPayload;
    console.log('Token decoded for user:', decoded.userId);
    
    // Connect to database
    await connectMongoDB();
    
    // Find user by ID
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      console.log('❌ User not found:', decoded.userId);
      return NextResponse.json(
        {
          success: false,
          error: 'User not found',
        } as ApiResponse,
        { status: 404 }
      );
    }
    
    // Prepare user response (without password)
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      createdAt: user.createdAt,
    };
    
    console.log('✅ Current user retrieved:', user.email);
    
    return NextResponse.json({
      success: true,
      data: userResponse,
    } as ApiResponse);
    
  } catch (error) {
    console.error('❌ Get current user error:', error);
    
    // Handle JWT errors
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid authentication token',
        } as ApiResponse,
        { status: 401 }
      );
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication token expired',
        } as ApiResponse,
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get current user',
      } as ApiResponse,
      { status: 500 }
    );
  }
}