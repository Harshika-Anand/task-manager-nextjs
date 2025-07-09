import { NextResponse } from 'next/server';
import { ApiResponse } from '@/types';

export async function POST() {
  try {
    console.log('🚪 User logging out...');
    
    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    } as ApiResponse);
    
    // Clear the auth cookie
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0, // Expire immediately
      path: '/',
    });
    
    console.log('✅ User logged out successfully');
    
    return response;
    
  } catch (error) {
    console.error('❌ Logout error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Logout failed',
      } as ApiResponse,
      { status: 500 }
    );
  }
}