'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { ITask, TaskStatus, TaskPriority, TaskCategory, ApiResponse } from '@/types';

export default function DashboardPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<ITask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    overdue: 0,
  });

  // Fetch user's tasks
  const fetchTasks = async () => {
    try {
      console.log('📊 Fetching dashboard data...');
      
      const response = await fetch('/api/tasks', {
        credentials: 'include',
      });

      if (response.ok) {
        const result: ApiResponse<ITask[]> = await response.json();
        if (result.success && result.data) {
          setTasks(result.data);
          calculateStats(result.data);
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

  // Calculate dashboard statistics
  const calculateStats = (taskList: ITask[]) => {
    const now = new Date();
    
    const stats = {
      total: taskList.length,
      completed: taskList.filter(task => task.status === TaskStatus.COMPLETED).length,
      pending: taskList.filter(task => task.status === TaskStatus.PENDING).length,
      overdue: taskList.filter(task => 
        task.dueDate && 
        new Date(task.dueDate) < now && 
        task.status !== TaskStatus.COMPLETED
      ).length,
    };

    setStats(stats);
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Get recent tasks (last 5)
  const recentTasks = tasks.slice(0, 5);

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="px-4 sm:px-0">
          {/* Welcome Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {user?.name}! 👋
            </h1>
            <p className="text-gray-600 mt-2">
              Here's what's happening with your tasks today.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                      <span className="text-blue-600 text-lg">📊</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Tasks
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.total}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                      <span className="text-green-600 text-lg">✅</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Completed
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.completed}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-100 rounded-md flex items-center justify-center">
                      <span className="text-yellow-600 text-lg">⏳</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Pending
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.pending}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-red-100 rounded-md flex items-center justify-center">
                      <span className="text-red-600 text-lg">🚨</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Overdue
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.overdue}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white shadow rounded-lg mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link
                  href="/tasks/create"
                  className="bg-blue-50 hover:bg-blue-100 rounded-lg p-4 text-center transition-colors"
                >
                  <div className="text-2xl mb-2">➕</div>
                  <div className="font-medium text-blue-900">Create Task</div>
                  <div className="text-sm text-blue-600">Add a new task</div>
                </Link>

                <Link
                  href="/tasks"
                  className="bg-gray-50 hover:bg-gray-100 rounded-lg p-4 text-center transition-colors"
                >
                  <div className="text-2xl mb-2">📝</div>
                  <div className="font-medium text-gray-900">View All Tasks</div>
                  <div className="text-sm text-gray-600">See all your tasks</div>
                </Link>

                <Link
                  href="/tasks?status=pending"
                  className="bg-yellow-50 hover:bg-yellow-100 rounded-lg p-4 text-center transition-colors"
                >
                  <div className="text-2xl mb-2">⏳</div>
                  <div className="font-medium text-yellow-900">Pending Tasks</div>
                  <div className="text-sm text-yellow-600">Tasks to complete</div>
                </Link>

                <Link
                  href="/tasks?priority=urgent"
                  className="bg-red-50 hover:bg-red-100 rounded-lg p-4 text-center transition-colors"
                >
                  <div className="text-2xl mb-2">🚨</div>
                  <div className="font-medium text-red-900">Urgent Tasks</div>
                  <div className="text-sm text-red-600">High priority items</div>
                </Link>
              </div>
            </div>
          </div>

          {/* Recent Tasks */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Recent Tasks</h2>
              <Link
                href="/tasks"
                className="text-blue-600 hover:text-blue-500 text-sm font-medium"
              >
                View all →
              </Link>
            </div>
            <div className="p-6">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading tasks...</p>
                </div>
              ) : recentTasks.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">📝</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks yet</h3>
                  <p className="text-gray-600 mb-4">Get started by creating your first task!</p>
                  <Link
                    href="/tasks/create"
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Create Your First Task
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentTasks.map((task) => (
                    <div
                      key={task._id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">{task.title}</h3>
                          {task.description && (
                            <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            task.priority === TaskPriority.URGENT ? 'bg-red-100 text-red-800' :
                            task.priority === TaskPriority.HIGH ? 'bg-orange-100 text-orange-800' :
                            task.priority === TaskPriority.MEDIUM ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {task.priority}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            task.status === TaskStatus.COMPLETED ? 'bg-green-100 text-green-800' :
                            task.status === TaskStatus.IN_PROGRESS ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {task.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}