'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';

export default function CategoriesPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="px-4 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Categories</h1>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600">Task categories will be here soon! 📁</p>
            <p className="text-sm text-gray-500 mt-2">This page is working - no more 404!</p>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}