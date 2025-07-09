'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import { UpdateTaskData, TaskPriority, TaskCategory, TaskStatus, ApiResponse, ITask } from '@/types';

interface EditTaskPageProps {
  params: { id: string };
}

export default function EditTaskPage({ params }: EditTaskPageProps) {
  const router = useRouter();
  const [taskId, setTaskId] = useState<string>('');
  
  // Form state
  const [formData, setFormData] = useState<UpdateTaskData>({
    title: '',
    description: '',
    priority: TaskPriority.MEDIUM,
    category: TaskCategory.PERSONAL,
    status: TaskStatus.PENDING,
    dueDate: '',
  });
  
  // UI state
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load task data
  useEffect(() => {
    const loadTask = async () => {
      try {
        const { id } = await params;
        setTaskId(id);
        
        console.log(`📖 Loading task ${id} for editing...`);
        
        const response = await fetch(`/api/tasks/${id}`, {
          credentials: 'include',
        });

        if (response.ok) {
          const result: ApiResponse<ITask> = await response.json();
          if (result.success && result.data) {
            const task = result.data;
            setFormData({
              title: task.title,
              description: task.description || '',
              priority: task.priority,
              category: task.category,
              status: task.status,
              dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
            });
            console.log('✅ Task loaded for editing');
          }
        } else {
          console.error('Failed to load task');
          router.push('/tasks');
        }
      } catch (error) {
        console.error('Error loading task:', error);
        router.push('/tasks');
      } finally {
        setIsLoading(false);
      }
    };

    loadTask();
  }, [params, router]);

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.title?.trim()) {
      newErrors.title = 'Task title is required';
    } else if (formData.title.length > 200) {
      newErrors.title = 'Title must be less than 200 characters';
    }

    if (formData.description && formData.description.length > 1000) {
      newErrors.description = 'Description must be less than 1000 characters';
    }

    if (formData.dueDate) {
      const dueDate = new Date(formData.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (dueDate < today) {
        newErrors.dueDate = 'Due date cannot be in the past';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      console.log('✏️ Updating task:', formData);

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const result: ApiResponse<ITask> = await response.json();

      if (result.success) {
        console.log('✅ Task updated successfully');
        router.push('/tasks');
      } else {
        setErrors({
          submit: result.error || 'Failed to update task. Please try again.'
        });
      }
    } catch (error) {
      console.error('Update task error:', error);
      setErrors({
        submit: 'Something went wrong. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get today's date for min date input
  const today = new Date().toISOString().split('T')[0];

  if (isLoading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="px-4 sm:px-0">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading task...</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="px-4 sm:px-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Edit Task</h1>
            <p className="text-gray-600 mt-2">
              Update your task details and keep everything organized.
            </p>
          </div>

          <div className="bg-white shadow rounded-lg">
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Global error */}
              {errors.submit && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <p className="text-red-700">{errors.submit}</p>
                </div>
              )}

              {/* Title field */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Task Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.title ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter your task title"
                  maxLength={200}
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                )}
              </div>

              {/* Description field */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.description ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Describe your task (optional)"
                  maxLength={1000}
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                )}
              </div>

              {/* Status, Priority and Category row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {/* Status field */}
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={TaskStatus.PENDING}>⏳ Pending</option>
                    <option value={TaskStatus.IN_PROGRESS}>🔄 In Progress</option>
                    <option value={TaskStatus.COMPLETED}>✅ Completed</option>
                  </select>
                </div>

                {/* Priority field */}
                <div>
                  <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    id="priority"
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={TaskPriority.LOW}>🟢 Low</option>
                    <option value={TaskPriority.MEDIUM}>🟡 Medium</option>
                    <option value={TaskPriority.HIGH}>🟠 High</option>
                    <option value={TaskPriority.URGENT}>🔴 Urgent</option>
                  </select>
                </div>

                {/* Category field */}
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={TaskCategory.WORK}>💼 Work</option>
                    <option value={TaskCategory.PERSONAL}>👤 Personal</option>
                    <option value={TaskCategory.HEALTH}>🏥 Health</option>
                    <option value={TaskCategory.FINANCE}>💰 Finance</option>
                    <option value={TaskCategory.LEARNING}>📚 Learning</option>
                    <option value={TaskCategory.OTHER}>📌 Other</option>
                  </select>
                </div>
              </div>

              {/* Due date field */}
              <div>
                <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date
                </label>
                <input
                  type="date"
                  id="dueDate"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleChange}
                  min={today}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.dueDate ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.dueDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.dueDate}</p>
                )}
              </div>

              {/* Submit buttons */}
              <div className="flex justify-end space-x-4 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => router.push('/tasks')}
                  className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? 'Updating...' : 'Update Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}