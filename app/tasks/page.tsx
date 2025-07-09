'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import { ITask, TaskStatus, TaskPriority, TaskCategory, ApiResponse, UpdateTaskData } from '@/types';

export default function TasksPage() {
  const searchParams = useSearchParams();
  
  // State
  const [tasks, setTasks] = useState<ITask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: searchParams.get('status') || '',
    priority: searchParams.get('priority') || '',
    category: searchParams.get('category') || '',
  });

  // Fetch tasks with filters
  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      console.log('📝 Fetching tasks with filters:', filters);
      
      // Build query string
      const queryParams = new URLSearchParams();
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.priority) queryParams.append('priority', filters.priority);
      if (filters.category) queryParams.append('category', filters.category);
      
      const response = await fetch(`/api/tasks?${queryParams.toString()}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const result: ApiResponse<ITask[]> = await response.json();
        if (result.success && result.data) {
          setTasks(result.data);
          console.log(`✅ Loaded ${result.data.length} tasks`);
        }
      } else {
        console.error('Failed to fetch tasks');
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Update task status
  const updateTaskStatus = async (taskId: string, status: TaskStatus) => {
    try {
      console.log(`🔄 Updating task ${taskId} status to ${status}`);
      
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        const result: ApiResponse<ITask> = await response.json();
        if (result.success && result.data) {
          // Update the task in local state
          setTasks(prevTasks =>
            prevTasks.map(task =>
              task._id === taskId ? result.data! : task
            )
          );
          console.log('✅ Task status updated');
        }
      } else {
        console.error('Failed to update task status');
      }
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  // Delete task
  const deleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    try {
      console.log(`🗑️ Deleting task ${taskId}`);
      
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        // Remove task from local state
        setTasks(prevTasks => prevTasks.filter(task => task._id !== taskId));
        console.log('✅ Task deleted');
      } else {
        console.error('Failed to delete task');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  // Handle filter changes
  const handleFilterChange = (filterType: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      status: '',
      priority: '',
      category: '',
    });
  };

  // Fetch tasks when filters change
  useEffect(() => {
    fetchTasks();
  }, [filters]);

  // Get priority color
  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.URGENT: return 'bg-red-100 text-red-800';
      case TaskPriority.HIGH: return 'bg-orange-100 text-orange-800';
      case TaskPriority.MEDIUM: return 'bg-yellow-100 text-yellow-800';
      case TaskPriority.LOW: return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get status color
  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.COMPLETED: return 'bg-green-100 text-green-800';
      case TaskStatus.IN_PROGRESS: return 'bg-blue-100 text-blue-800';
      case TaskStatus.PENDING: return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString();
    }
  };

  // Check if task is overdue
  const isOverdue = (task: ITask) => {
    if (!task.dueDate || task.status === TaskStatus.COMPLETED) return false;
    return new Date(task.dueDate) < new Date();
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="px-4 sm:px-0">
          {/* Header */}
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">All Tasks</h1>
              <p className="text-gray-600 mt-2">
                Manage and organize all your tasks in one place.
              </p>
            </div>
            <Link
              href="/tasks/create"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              ➕ New Task
            </Link>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow mb-6 p-4">
            <div className="flex flex-wrap gap-4 items-center">
              <h3 className="font-medium text-gray-900">Filters:</h3>
              
              {/* Status filter */}
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value={TaskStatus.PENDING}>Pending</option>
                <option value={TaskStatus.IN_PROGRESS}>In Progress</option>
                <option value={TaskStatus.COMPLETED}>Completed</option>
              </select>

              {/* Priority filter */}
              <select
                value={filters.priority}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Priority</option>
                <option value={TaskPriority.URGENT}>🔴 Urgent</option>
                <option value={TaskPriority.HIGH}>🟠 High</option>
                <option value={TaskPriority.MEDIUM}>🟡 Medium</option>
                <option value={TaskPriority.LOW}>🟢 Low</option>
              </select>

              {/* Category filter */}
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                <option value={TaskCategory.WORK}>💼 Work</option>
                <option value={TaskCategory.PERSONAL}>👤 Personal</option>
                <option value={TaskCategory.HEALTH}>🏥 Health</option>
                <option value={TaskCategory.FINANCE}>💰 Finance</option>
                <option value={TaskCategory.LEARNING}>📚 Learning</option>
                <option value={TaskCategory.OTHER}>📌 Other</option>
              </select>

              {/* Clear filters */}
              {(filters.status || filters.priority || filters.category) && (
                <button
                  onClick={clearFilters}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Tasks List */}
          <div className="bg-white rounded-lg shadow">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading tasks...</p>
              </div>
            ) : tasks.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-4xl mb-4">📝</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
                <p className="text-gray-600 mb-4">
                  {filters.status || filters.priority || filters.category
                    ? 'No tasks match your current filters.'
                    : 'You haven\'t created any tasks yet.'}
                </p>
                <Link
                  href="/tasks/create"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Create Your First Task
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {tasks.map((task) => (
                  <div
                    key={task._id}
                    className={`p-6 hover:bg-gray-50 transition-colors ${
                      isOverdue(task) ? 'border-l-4 border-red-500' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* Task title and status */}
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className={`text-lg font-medium ${
                            task.status === TaskStatus.COMPLETED 
                              ? 'line-through text-gray-500' 
                              : 'text-gray-900'
                          }`}>
                            {task.title}
                          </h3>
                          {isOverdue(task) && (
                            <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                              Overdue
                            </span>
                          )}
                        </div>

                        {/* Task description */}
                        {task.description && (
                          <p className="text-gray-600 mb-3">{task.description}</p>
                        )}

                        {/* Task metadata */}
                        <div className="flex flex-wrap items-center gap-3 text-sm">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                            {task.status.replace('_', ' ')}
                          </span>
                          <span className="text-gray-500">{task.category}</span>
                          {task.dueDate && (
                            <span className={`text-sm ${isOverdue(task) ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                              Due: {formatDate(task.dueDate)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 ml-4">
                        {/* Status toggle */}
                        {task.status === TaskStatus.PENDING && (
                          <button
                            onClick={() => updateTaskStatus(task._id, TaskStatus.IN_PROGRESS)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Start
                          </button>
                        )}
                        {task.status === TaskStatus.IN_PROGRESS && (
                          <button
                            onClick={() => updateTaskStatus(task._id, TaskStatus.COMPLETED)}
                            className="text-green-600 hover:text-green-800 text-sm font-medium"
                          >
                            Complete
                          </button>
                        )}
                        {task.status === TaskStatus.COMPLETED && (
                          <button
                            onClick={() => updateTaskStatus(task._id, TaskStatus.PENDING)}
                            className="text-gray-600 hover:text-gray-800 text-sm font-medium"
                          >
                            Reopen
                          </button>
                        )}

                        {/* Edit button */}
                        <Link
                          href={`/tasks/${task._id}/edit`}
                          className="text-gray-600 hover:text-gray-800 text-sm font-medium"
                        >
                          Edit
                        </Link>

                        {/* Delete button */}
                        <button
                          onClick={() => deleteTask(task._id)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Task count */}
          {!isLoading && tasks.length > 0 && (
            <div className="mt-4 text-center text-gray-600">
              Showing {tasks.length} task{tasks.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}