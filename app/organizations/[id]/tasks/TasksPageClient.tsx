'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckSquare,
  Plus,
  Calendar,
  User,
  Flag,
  MoreVertical,
  Filter,
  CheckCircle2,
  Circle,
  Clock,
} from 'lucide-react';
import { useOrganization } from '@/contexts/OrganizationContext';

type TaskStatus = 'todo' | 'in_progress' | 'completed';
type TaskPriority = 'low' | 'medium' | 'high';

interface Task {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: string;
  dueDate: string;
  category: string;
}

export default function TasksPageClient() {
  const { selectedOrg } = useOrganization();
  const [filterStatus, setFilterStatus] = useState<'all' | TaskStatus>('all');
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);

  const tasks: Task[] = [
    // This would be loaded from a tasks service in a real implementation
    {
      id: 1,
      title: 'Welcome to the organization!',
      description: 'Complete your profile and explore the organization features',
      status: 'todo',
      priority: 'medium',
      assignee: 'You',
      dueDate: 'No due date',
      category: 'Getting Started',
    },
  ];

  const filteredTasks = tasks.filter((task) => {
    if (filterStatus === 'all') return true;
    return task.status === filterStatus;
  });

  const getStatusConfig = (status: TaskStatus) => {
    switch (status) {
      case 'todo':
        return {
          label: 'To Do',
          color: 'bg-gray-100 text-gray-700 border-gray-300',
          icon: Circle,
        };
      case 'in_progress':
        return {
          label: 'In Progress',
          color: 'bg-yellow-100 text-yellow-700 border-yellow-300',
          icon: Clock,
        };
      case 'completed':
        return {
          label: 'Completed',
          color: 'bg-green-100 text-green-700 border-green-300',
          icon: CheckCircle2,
        };
    }
  };

  const getPriorityConfig = (priority: TaskPriority) => {
    switch (priority) {
      case 'low':
        return { label: 'Low', color: 'text-blue-600' };
      case 'medium':
        return { label: 'Medium', color: 'text-yellow-600' };
      case 'high':
        return { label: 'High', color: 'text-red-600' };
    }
  };

  const statusCounts = {
    todo: tasks.filter((t) => t.status === 'todo').length,
    in_progress: tasks.filter((t) => t.status === 'in_progress').length,
    completed: tasks.filter((t) => t.status === 'completed').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-600 mt-1">Manage and track your organization tasks</p>
        </div>
        <motion.button
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-white font-semibold rounded-xl shadow-lg shadow-yellow-500/20"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowNewTaskModal(true)}
        >
          <Plus className="w-5 h-5" />
          New Task
        </motion.button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.button
          onClick={() => setFilterStatus('todo')}
          className={`bg-white rounded-xl shadow-sm border-2 p-6 text-left transition-all ${
            filterStatus === 'todo' ? 'border-yellow-400' : 'border-gray-200 hover:border-gray-300'
          }`}
          whileHover={{ y: -2 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <Circle className="w-5 h-5 text-gray-600" />
            </div>
            <h3 className="font-semibold text-gray-900">To Do</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">{statusCounts.todo}</p>
          <p className="text-sm text-gray-600 mt-1">Tasks to start</p>
        </motion.button>

        <motion.button
          onClick={() => setFilterStatus('in_progress')}
          className={`bg-white rounded-xl shadow-sm border-2 p-6 text-left transition-all ${
            filterStatus === 'in_progress'
              ? 'border-yellow-400'
              : 'border-gray-200 hover:border-gray-300'
          }`}
          whileHover={{ y: -2 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <h3 className="font-semibold text-gray-900">In Progress</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">{statusCounts.in_progress}</p>
          <p className="text-sm text-gray-600 mt-1">Tasks in progress</p>
        </motion.button>

        <motion.button
          onClick={() => setFilterStatus('completed')}
          className={`bg-white rounded-xl shadow-sm border-2 p-6 text-left transition-all ${
            filterStatus === 'completed'
              ? 'border-yellow-400'
              : 'border-gray-200 hover:border-gray-300'
          }`}
          whileHover={{ y: -2 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Completed</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">{statusCounts.completed}</p>
          <p className="text-sm text-gray-600 mt-1">Tasks completed</p>
        </motion.button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            {filterStatus === 'all' ? 'All Tasks' : getStatusConfig(filterStatus as TaskStatus).label}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === 'all'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              All
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {filteredTasks.map((task, index) => {
            const statusConfig = getStatusConfig(task.status);
            const priorityConfig = getPriorityConfig(task.priority);
            const StatusIcon = statusConfig.icon;

            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 rounded-xl border border-gray-200 hover:border-yellow-300 hover:bg-yellow-50/30 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="pt-1">
                    <StatusIcon className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">{task.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                      </div>
                      <motion.button
                        className="p-1 hover:bg-gray-100 rounded-lg"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <MoreVertical className="w-5 h-5 text-gray-500" />
                      </motion.button>
                    </div>
                    <div className="flex items-center gap-3 mt-3">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${statusConfig.color}`}
                      >
                        {statusConfig.label}
                      </span>
                      <span className={`flex items-center gap-1 text-xs font-semibold ${priorityConfig.color}`}>
                        <Flag className="w-3 h-3" />
                        {priorityConfig.label}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-600">
                        <User className="w-3 h-3" />
                        {task.assignee}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-600">
                        <Calendar className="w-3 h-3" />
                        {task.dueDate}
                      </span>
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                        {task.category}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {filteredTasks.length === 0 && (
          <div className="text-center py-12">
            <CheckSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No tasks found</p>
          </div>
        )}
      </div>
    </div>
  );
}
