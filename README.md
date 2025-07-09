# Task Manager - Next.js Full-Stack App

A modern, full-stack task management application built with Next.js 14, TypeScript, MongoDB, and Zod validation.

## 🚀 Features

### ✅ **Authentication System**
- User registration with email verification
- Secure login with JWT tokens
- Password hashing with bcrypt
- HTTP-only cookies for security
- Protected routes and API endpoints

### ✅ **Task Management**
- Create, read, update, and delete tasks
- Task priorities (Low, Medium, High, Urgent)
- Categories (Work, Personal, Health, Finance, Learning, Other)
- Due dates with overdue indicators
- Task status tracking (Pending → In Progress → Completed)

### ✅ **Advanced Features**
- Real-time filtering by status, priority, and category
- Dashboard with statistics and recent tasks
- Responsive design for all devices
- Loading states and error handling
- Form validation with Zod

### ✅ **Technical Stack**
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, MongoDB with Mongoose
- **Authentication**: JWT tokens, bcrypt password hashing
- **Validation**: Zod schemas for runtime type safety
- **Database**: MongoDB Atlas (cloud database)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/task-manager-nextjs.git
   cd task-manager-nextjs
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   # MongoDB Connection
   MONGODB_URI=your_mongodb_connection_string
   
   # NextAuth Configuration
   NEXTAUTH_SECRET=your_super_secret_key_here
   
   # App Configuration
   NODE_ENV=development
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

